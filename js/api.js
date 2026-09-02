/**
 * ==============================================================================
 * 設備單價查詢系統 - API 模組 (api.js)
 * ==============================================================================
 * 負責與 Google Apps Script Web App 後端通訊，依角色傳遞權限並具備本地 Mock 機制。
 * ==============================================================================
 */

const API = {
  /**
   * 檢查是否已配置 Google Apps Script 部署網址 (若啟用強制離線模式則視為未配置)
   */
  isConfigured() {
    if (this.isOfflineMode()) {
      return false;
    }
    return Boolean(CONFIG.GAS_API_URL && CONFIG.GAS_API_URL.trim().startsWith('http'));
  },

  isOfflineMode() {
    return localStorage.getItem('EQUIP_PRICE_OFFLINE_MODE') === 'true';
  },

  setOfflineMode(enabled) {
    if (enabled) {
      localStorage.setItem('EQUIP_PRICE_OFFLINE_MODE', 'true');
    } else {
      localStorage.removeItem('EQUIP_PRICE_OFFLINE_MODE');
    }
  },

  /**
   * 取得本地模擬資料庫 (保存在 localStorage 內以利測試登入狀態與審核)
   */
  getLocalDb() {
    let users = localStorage.getItem('PRICE_SYS_USERS_V2');
    if (!users) {
      localStorage.setItem('PRICE_SYS_USERS_V2', JSON.stringify(CONFIG.DEMO_USERS));
      users = JSON.stringify(CONFIG.DEMO_USERS);
    }

    let logs = localStorage.getItem('PRICE_SYS_LOGS_V2');
    if (!logs) {
      localStorage.setItem('PRICE_SYS_LOGS_V2', JSON.stringify(CONFIG.DEMO_LOGS));
      logs = JSON.stringify(CONFIG.DEMO_LOGS);
    }

    let items = localStorage.getItem('PRICE_SYS_ITEMS_V2');
    if (!items) {
      localStorage.setItem('PRICE_SYS_ITEMS_V2', JSON.stringify(CONFIG.DEMO_DATA));
      items = JSON.stringify(CONFIG.DEMO_DATA);
    }

    return {
      users: JSON.parse(users),
      logs: JSON.parse(logs),
      items: JSON.parse(items)
    };
  },

  /**
   * 登入 API
   */
  async login(username, password) {
    if (this.isConfigured()) {
      try {
        const response = await fetch(CONFIG.GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username: username,
            password: password,
            userAgent: navigator.userAgent
          })
        });
        const result = await response.json();
        if (result) {
          if (!result.message && result.error) {
            result.message = result.error;
          }
          if (!result.success) {
            const errStr = String(result.message || '');
            if (errStr.includes('找不到使用者資料表') || errStr.includes('未知的 POST action') || errStr.includes('16 家公司')) {
              result.message = '【後端版本不符】目前的 Google Apps Script 部署網址指向了其他專案（設備數量統計系統）。請重新部署本專案 Code.gs，或切換為「離線示範模式」進行測試。';
              result.isBackendMismatch = true;
            } else if (errStr.includes('系統權限表尚未初始化')) {
              result.message = '【尚未初始化】Google 試算表尚未建立權限表，請至 Apps Script 執行 setupDatabase()。';
            }
          }
          return result;
        }
      } catch (err) {
        console.error('GAS API 連線失敗，切換至本地模擬驗證:', err);
      }
    }

    // 本地模擬模式 (Demo Mode)
    await new Promise(r => setTimeout(r, 400));
    const db = this.getLocalDb();
    const user = db.users.find(u => u.username === username);

    if (!user || user.password !== password) {
      this.recordLocalLog(username, user ? user.name : '未知用戶', '失敗 (密碼錯誤/無此帳號)', '本地模擬登入');
      return { success: false, message: '帳號或密碼錯誤，請重新確認' };
    }

    if (user.status !== '已啟用') {
      this.recordLocalLog(username, user.name, `登入受阻 (${user.status})`, '本地模擬登入');
      if (user.status === '待審核') {
        return { success: false, message: '您的帳號正在審核中，請待管理員核准後方可登入！' };
      } else {
        return { success: false, message: `您的帳號目前狀態為【${user.status}】，無法進入系統。` };
      }
    }

    // 更新最後登入時間
    const nowStr = this.formatCurrentDate();
    user.lastLogin = nowStr;
    localStorage.setItem('PRICE_SYS_USERS_V2', JSON.stringify(db.users));
    this.recordLocalLog(username, user.name, `成功 (${user.role === 'admin' ? '管理者' : (user.role === 'procurement' ? '採購' : '業務')})`, '本地模擬登入');

    return {
      success: true,
      message: '登入成功',
      user: {
        username: user.username,
        name: user.name,
        role: user.role || 'sales',
        lastLogin: user.lastLogin
      },
      token: 'demo-token-' + Date.now()
    };
  },

  /**
   * 註冊申請 API (包含角色選擇)
   */
  async register(username, password, name, role = 'sales') {
    if (this.isConfigured()) {
      try {
        const response = await fetch(CONFIG.GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'register',
            username: username,
            password: password,
            name: name,
            role: role
          })
        });
        const result = await response.json();
        if (result && !result.message && result.error) result.message = result.error;
        return result;
      } catch (err) {
        console.error('GAS 註冊失敗:', err);
      }
    }

    // 本地模擬模式
    await new Promise(r => setTimeout(r, 400));
    const db = this.getLocalDb();
    if (db.users.some(u => u.username === username)) {
      return { success: false, message: '此帳號已被使用，請更換其他帳號' };
    }

    const nowStr = this.formatCurrentDate();
    db.users.push({
      username: username,
      password: password,
      name: name,
      status: '待審核',
      role: role,
      registeredAt: nowStr,
      lastLogin: '尚未登入'
    });

    localStorage.setItem('PRICE_SYS_USERS_V2', JSON.stringify(db.users));
    this.recordLocalLog(username, name, `註冊申請 (${role === 'procurement' ? '採購' : '業務'})`, '送出註冊待審核');

    return {
      success: true,
      message: '註冊申請已送出！請通知管理員審核開通（可使用 admin 帳號登入進行審核）。'
    };
  },

  /**
   * 依據使用者角色取得設備資料 (業務隱藏進價、採購隱藏售價、管理者看雙價)
   */
  async getAllData(userRole = 'sales') {
    if (this.isConfigured()) {
      try {
        const response = await fetch(`${CONFIG.GAS_API_URL}?action=getAllData&role=${encodeURIComponent(userRole)}`);
        const result = await response.json();
        if (result && result.success) {
          return result;
        }
      } catch (err) {
        console.warn('無法從 Google Sheet 取得資料，切換為本地展示資料:', err);
      }
    }

    // 本地模擬過濾
    await new Promise(r => setTimeout(r, 300));
    const db = this.getLocalDb();
    const processedData = {};
    let total = 0;

    Object.entries(db.items).forEach(([catName, items]) => {
      processedData[catName] = items.map(raw => {
        const item = {
          id: raw.id,
          category: raw.category,
          name: raw.name,
          brand: raw.brand,
          model: raw.model,
          note: raw.note,
          catalog: raw.catalog
        };

        const cost = Number(raw.costPrice) || 0;
        const sales = Number(raw.salesPrice) || 0;

        if (userRole === 'admin') {
          item.costPrice = cost;
          item.salesPrice = sales;
          item.profit = sales - cost;
          item.profitMargin = sales > 0 ? Math.round(((sales - cost) / sales) * 100) : 0;
          item.price = sales;
        } else if (userRole === 'procurement') {
          item.costPrice = cost;
          item.price = cost;
        } else {
          // sales
          item.salesPrice = sales;
          item.price = sales;
        }

        return item;
      });
      total += processedData[catName].length;
    });

    return {
      success: true,
      isDemo: !this.isConfigured(),
      userRole: userRole,
      categories: Object.keys(processedData),
      totalItems: total,
      data: processedData,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * 取得使用者名單 (管理者功能)
   */
  async getUsers() {
    if (this.isConfigured()) {
      try {
        const response = await fetch(`${CONFIG.GAS_API_URL}?action=getUsers`);
        return await response.json();
      } catch (err) {
        console.error('取得用戶失敗:', err);
      }
    }

    const db = this.getLocalDb();
    return { success: true, users: db.users };
  },

  /**
   * 更新用戶狀態與角色 (審核開通/停用/變更角色)
   */
  async updateUserStatus(targetUsername, newStatus, newRole = null) {
    if (this.isConfigured()) {
      try {
        const response = await fetch(CONFIG.GAS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'updateUserStatus',
            targetUsername: targetUsername,
            newStatus: newStatus,
            newRole: newRole
          })
        });
        const result = await response.json();
        if (result && !result.message && result.error) result.message = result.error;
        return result;
      } catch (err) {
        console.error('更新狀態失敗:', err);
      }
    }

    const db = this.getLocalDb();
    const target = db.users.find(u => u.username === targetUsername);
    if (target) {
      if (newStatus) target.status = newStatus;
      if (newRole) target.role = newRole;
      localStorage.setItem('PRICE_SYS_USERS_V2', JSON.stringify(db.users));
      return { success: true, message: `用戶 [${targetUsername}] 資料已更新！` };
    }
    return { success: false, message: '找不到該用戶' };
  },

  /**
   * 取得登入審計日誌 (管理者功能)
   */
  async getLogs() {
    if (this.isConfigured()) {
      try {
        const response = await fetch(`${CONFIG.GAS_API_URL}?action=getLogs`);
        return await response.json();
      } catch (err) {
        console.error('取得日誌失敗:', err);
      }
    }

    const db = this.getLocalDb();
    return { success: true, logs: db.logs };
  },

  /**
   * 本地輔助：寫入日誌
   */
  recordLocalLog(username, name, status, detail) {
    const db = this.getLocalDb();
    db.logs.unshift({
      time: this.formatCurrentDate(),
      username: username,
      name: name,
      status: status,
      detail: detail
    });
    localStorage.setItem('PRICE_SYS_LOGS_V2', JSON.stringify(db.logs.slice(0, 100)));
  },

  formatCurrentDate() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
};
