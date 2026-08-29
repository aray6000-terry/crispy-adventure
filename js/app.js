/**
 * ==============================================================================
 * 設備單價查詢系統 - 主應用程式 (app.js)
 * ==============================================================================
 */

const App = {
  state: {
    categories: [],
    rawData: {},
    allItems: [],
    activeCategory: 'ALL',
    searchQuery: '',
    selectedBrand: 'ALL',
    sortOption: 'name_asc',
    viewMode: 'grid',
    isLoading: false,
    theme: 'dark'
  },

  /**
   * 初始化系統
   */
  async init() {
    this.initTheme();

    if (!Auth.isLoggedIn()) {
      this.renderAuthView();
    } else {
      this.renderMainView();
      await this.loadData();
    }

    this.bindEvents();
  },

  /**
   * 主題切換
   */
  initTheme() {
    const saved = localStorage.getItem('EQUIP_THEME') || 'dark';
    this.state.theme = saved;
    document.documentElement.setAttribute('data-theme', saved);
    this.updateThemeButton();
  },

  toggleTheme() {
    this.state.theme = this.state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.state.theme);
    localStorage.setItem('EQUIP_THEME', this.state.theme);
    this.updateThemeButton();
  },

  updateThemeButton() {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = this.state.theme === 'dark' ? '☀️ 淺色' : '🌙 深色';
    }
  },

  /**
   * 依據使用者權限載入 Google Sheet 資料
   */
  async loadData() {
    this.state.isLoading = true;
    this.renderLoading(true);

    try {
      const currentRole = Auth.getRole();
      const res = await API.getAllData(currentRole);
      if (res && res.success) {
        this.state.categories = res.categories || [];
        this.state.rawData = res.data || {};

        let all = [];
        Object.entries(this.state.rawData).forEach(([cat, items]) => {
          all = all.concat(items);
        });
        this.state.allItems = all;

        const banner = document.getElementById('demo-mode-banner');
        if (banner) {
          banner.style.display = res.isDemo ? 'flex' : 'none';
        }

        this.renderStats();
        this.renderCategoryTabs();
        this.populateBrandFilter();
        this.applyFiltersAndRender();
      } else {
        this.showToast(res.message || '載入資料失敗', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showToast('無法連線至 Google Sheet 資料庫', 'error');
    } finally {
      this.state.isLoading = false;
      this.renderLoading(false);
    }
  },

  renderStats() {
    const catCountEl = document.getElementById('stat-cat-count');
    const itemCountEl = document.getElementById('stat-item-count');
    const brandCountEl = document.getElementById('stat-brand-count');
    const syncTimeEl = document.getElementById('stat-sync-time');

    if (catCountEl) catCountEl.textContent = this.state.categories.length;
    if (itemCountEl) itemCountEl.textContent = this.state.allItems.length;

    const uniqueBrands = new Set(this.state.allItems.map(i => i.brand).filter(Boolean));
    if (brandCountEl) brandCountEl.textContent = uniqueBrands.size;

    if (syncTimeEl) {
      const now = new Date();
      syncTimeEl.textContent = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }
  },

  renderCategoryTabs() {
    const container = document.getElementById('category-tabs');
    if (!container) return;

    let html = `
      <button class="cat-tab-btn ${this.state.activeCategory === 'ALL' ? 'active' : ''}" onclick="App.selectCategory('ALL')">
        <span>全部類別</span>
        <span class="cat-tab-badge">${this.state.allItems.length}</span>
      </button>
    `;

    this.state.categories.forEach(cat => {
      const count = (this.state.rawData[cat] || []).length;
      const isActive = this.state.activeCategory === cat ? 'active' : '';
      html += `
        <button class="cat-tab-btn ${isActive}" onclick="App.selectCategory('${cat}')">
          <span>${cat}</span>
          <span class="cat-tab-badge">${count}</span>
        </button>
      `;
    });

    container.innerHTML = html;
  },

  populateBrandFilter() {
    const select = document.getElementById('brand-filter-select');
    if (!select) return;

    let itemsToScan = this.state.activeCategory === 'ALL'
      ? this.state.allItems
      : (this.state.rawData[this.state.activeCategory] || []);

    const brands = [...new Set(itemsToScan.map(i => i.brand).filter(Boolean))].sort();

    let html = '<option value="ALL">🏢 全部廠牌</option>';
    brands.forEach(b => {
      html += `<option value="${b}">${b}</option>`;
    });
    select.innerHTML = html;
    select.value = this.state.selectedBrand;
  },

  selectCategory(categoryName) {
    this.state.activeCategory = categoryName;
    this.state.selectedBrand = 'ALL';
    this.renderCategoryTabs();
    this.populateBrandFilter();
    this.applyFiltersAndRender();
  },

  getFilteredItems() {
    let items = this.state.activeCategory === 'ALL'
      ? [...this.state.allItems]
      : [...(this.state.rawData[this.state.activeCategory] || [])];

    const q = this.state.searchQuery.toLowerCase().trim();
    if (q) {
      items = items.filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.brand && item.brand.toLowerCase().includes(q)) ||
          (item.model && item.model.toLowerCase().includes(q)) ||
          (item.note && item.note.toLowerCase().includes(q))
        );
      });
    }

    if (this.state.selectedBrand !== 'ALL') {
      items = items.filter(i => i.brand === this.state.selectedBrand);
    }

    switch (this.state.sortOption) {
      case 'price_asc':
        items.sort((a, b) => (a.price || a.salesPrice || a.costPrice || 0) - (b.price || b.salesPrice || b.costPrice || 0));
        break;
      case 'price_desc':
        items.sort((a, b) => (b.price || b.salesPrice || b.costPrice || 0) - (a.price || a.salesPrice || a.costPrice || 0));
        break;
      case 'brand_asc':
        items.sort((a, b) => (a.brand || '').localeCompare(b.brand || '', 'zh-Hant'));
        break;
      case 'name_asc':
      default:
        items.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hant'));
        break;
    }

    return items;
  },

  applyFiltersAndRender() {
    const items = this.getFilteredItems();
    const resultCountEl = document.getElementById('results-count-display');
    if (resultCountEl) {
      resultCountEl.innerHTML = `找到 <strong>${items.length}</strong> 項設備`;
    }

    const container = document.getElementById('items-display-container');
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>未找到相符的設備</h3>
          <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 6px;">請嘗試更換關鍵字或重設篩選條件</p>
          <button class="btn btn-secondary btn-sm" style="margin-top: 14px;" onclick="App.resetFilters()">重設篩選條件</button>
        </div>
      `;
      return;
    }

    if (this.state.viewMode === 'grid') {
      this.renderGridView(items, container);
    } else {
      this.renderTableView(items, container);
    }
  },

  /**
   * 渲染卡片視圖 (依角色動態顯示業務價 / 採購價 / 雙價)
   */
  renderGridView(items, container) {
    const q = this.state.searchQuery.trim();
    const role = Auth.getRole();
    let html = `<div class="item-grid">`;

    items.forEach(item => {
      const nameHighlighted = this.highlightText(item.name, q);
      const brandHighlighted = this.highlightText(item.brand, q);
      const modelHighlighted = this.highlightText(item.model, q);
      const noteHighlighted = this.highlightText(item.note, q);

      const catalogBtn = item.catalog
        ? `<a href="${item.catalog}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" title="開啟/下載型錄">
             📄 型錄
           </a>`
        : `<span style="font-size: 0.75rem; color: var(--text-dim); padding: 5px 8px;">無型錄</span>`;

      // 依角色渲染金額資訊
      let priceHtml = '';
      if (role === 'admin') {
        const cost = item.costPrice || 0;
        const sales = item.salesPrice || item.price || 0;
        const profit = item.profit || (sales - cost);
        const margin = item.profitMargin || (sales > 0 ? Math.round((profit / sales) * 100) : 0);

        priceHtml = `
          <div class="price-display">
            <div style="display: flex; gap: 12px; align-items: baseline;">
              <div>
                <span class="price-label" style="color: var(--accent-emerald);">業務報價</span>
                <div class="price-value" style="font-size: 1.15rem; color: var(--accent-emerald);">NT$ ${sales.toLocaleString()}</div>
              </div>
              <div>
                <span class="price-label" style="color: var(--secondary);">採購底價</span>
                <div class="price-value" style="font-size: 1.15rem; color: var(--secondary);">NT$ ${cost.toLocaleString()}</div>
              </div>
            </div>
            <div style="font-size: 0.75rem; color: var(--accent-amber); font-weight: 600; margin-top: 3px;">
              預估毛利: NT$ ${profit.toLocaleString()} (${margin}%)
            </div>
          </div>
        `;
      } else if (role === 'procurement') {
        const cost = item.costPrice || item.price || 0;
        priceHtml = `
          <div class="price-display">
            <span class="price-label" style="color: var(--secondary);">採購進貨單價</span>
            <span class="price-value" style="color: var(--secondary);">NT$ ${cost.toLocaleString()}</span>
          </div>
        `;
      } else {
        // 業務 sales
        const sales = item.salesPrice || item.price || 0;
        priceHtml = `
          <div class="price-display">
            <span class="price-label" style="color: var(--accent-emerald);">業務建議售價</span>
            <span class="price-value" style="color: var(--accent-emerald);">NT$ ${sales.toLocaleString()}</span>
          </div>
        `;
      }

      html += `
        <div class="item-card">
          <div>
            <div class="card-top">
              <span class="item-category-tag">${item.category}</span>
            </div>

            <div class="item-name">${nameHighlighted}</div>

            <div class="meta-tags">
              ${item.brand ? `<span class="brand-badge">🏢 ${brandHighlighted}</span>` : ''}
              ${item.model ? `<span class="model-badge">🔖 ${modelHighlighted}</span>` : ''}
            </div>

            <div class="item-note">
              ${noteHighlighted || '<span style="color: var(--text-dim);">無額外備註</span>'}
            </div>
          </div>

          <div class="card-bottom">
            ${priceHtml}

            <div class="card-actions">
              ${catalogBtn}
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  /**
   * 渲染表格視圖 (依角色顯示不同單價欄位)
   */
  renderTableView(items, container) {
    const q = this.state.searchQuery.trim();
    const role = Auth.getRole();

    let priceTh = '';
    if (role === 'admin') {
      priceTh = `
        <th style="color: var(--secondary);">採購底價 (NT$)</th>
        <th style="color: var(--accent-emerald);">業務售價 (NT$)</th>
        <th style="color: var(--accent-amber);">毛利 (率)</th>
      `;
    } else if (role === 'procurement') {
      priceTh = `<th style="color: var(--secondary);">採購單價 (NT$)</th>`;
    } else {
      priceTh = `<th style="color: var(--accent-emerald);">業務單價 (NT$)</th>`;
    }

    let html = `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>類別</th>
              <th>設備項目</th>
              <th>廠牌</th>
              <th>型號</th>
              ${priceTh}
              <th>備註說明</th>
              <th>型錄</th>
            </tr>
          </thead>
          <tbody>
    `;

    items.forEach(item => {
      const catalogBtn = item.catalog
        ? `<a href="${item.catalog}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="padding: 3px 8px;">
             📄 開啟
           </a>`
        : `<span style="color: var(--text-dim); font-size: 0.8rem;">-</span>`;

      let priceTd = '';
      if (role === 'admin') {
        const cost = item.costPrice || 0;
        const sales = item.salesPrice || item.price || 0;
        const profit = item.profit || (sales - cost);
        const margin = item.profitMargin || (sales > 0 ? Math.round((profit / sales) * 100) : 0);
        priceTd = `
          <td class="table-price" style="color: var(--secondary);">NT$ ${cost.toLocaleString()}</td>
          <td class="table-price" style="color: var(--accent-emerald);">NT$ ${sales.toLocaleString()}</td>
          <td style="font-family: monospace; font-size: 0.85rem; color: var(--accent-amber); font-weight: 600;">NT$ ${profit.toLocaleString()} (${margin}%)</td>
        `;
      } else if (role === 'procurement') {
        const cost = item.costPrice || item.price || 0;
        priceTd = `<td class="table-price" style="color: var(--secondary);">NT$ ${cost.toLocaleString()}</td>`;
      } else {
        const sales = item.salesPrice || item.price || 0;
        priceTd = `<td class="table-price" style="color: var(--accent-emerald);">NT$ ${sales.toLocaleString()}</td>`;
      }

      html += `
        <tr>
          <td><span class="item-category-tag" style="margin: 0;">${item.category}</span></td>
          <td style="font-weight: 600;">${this.highlightText(item.name, q)}</td>
          <td>${this.highlightText(item.brand || '-', q)}</td>
          <td><span class="model-badge">${this.highlightText(item.model || '-', q)}</span></td>
          ${priceTd}
          <td style="color: var(--text-muted); font-size: 0.85rem; max-width: 200px;">${this.highlightText(item.note || '-', q)}</td>
          <td>${catalogBtn}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  },

  highlightText(text, keyword) {
    if (!text) return '';
    if (!keyword) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  },

  resetFilters() {
    this.state.searchQuery = '';
    this.state.selectedBrand = 'ALL';
    this.state.sortOption = 'name_asc';
    const searchInput = document.getElementById('search-input');
    const brandSelect = document.getElementById('brand-filter-select');
    const sortSelect = document.getElementById('sort-select');
    const clearBtn = document.getElementById('clear-search-btn');

    if (searchInput) searchInput.value = '';
    if (brandSelect) brandSelect.value = 'ALL';
    if (sortSelect) sortSelect.value = 'name_asc';
    if (clearBtn) clearBtn.style.display = 'none';

    this.applyFiltersAndRender();
  },

  setViewMode(mode) {
    this.state.viewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    this.applyFiltersAndRender();
  },

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-search-btn');
    let debounceTimer = null;

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) clearBtn.style.display = val ? 'block' : 'none';

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.state.searchQuery = val;
          this.applyFiltersAndRender();
        }, 250);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        clearBtn.style.display = 'none';
        this.state.searchQuery = '';
        this.applyFiltersAndRender();
      });
    }

    const brandSelect = document.getElementById('brand-filter-select');
    if (brandSelect) {
      brandSelect.addEventListener('change', (e) => {
        this.state.selectedBrand = e.target.value;
        this.applyFiltersAndRender();
      });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.state.sortOption = e.target.value;
        this.applyFiltersAndRender();
      });
    }
  },

  renderLoading(show) {
    const loader = document.getElementById('data-loading-spinner');
    const container = document.getElementById('items-display-container');
    if (loader) loader.style.display = show ? 'flex' : 'none';
    if (container && show) container.innerHTML = '';
  },

  renderAuthView() {
    document.getElementById('app-main-view').style.display = 'none';
    document.getElementById('app-auth-view').style.display = 'block';
  },

  renderMainView() {
    document.getElementById('app-auth-view').style.display = 'none';
    document.getElementById('app-main-view').style.display = 'block';

    const user = Auth.getUser();
    if (user) {
      const nameEl = document.getElementById('header-user-name');
      const roleEl = document.getElementById('header-user-role');
      const adminBtn = document.getElementById('admin-panel-btn');

      if (nameEl) nameEl.textContent = user.name || user.username;
      if (roleEl) {
        roleEl.textContent = Auth.getRoleName();
        if (Auth.isAdmin()) {
          roleEl.style.background = 'rgba(245,158,11,0.15)';
          roleEl.style.color = 'var(--accent-amber)';
        } else if (Auth.isProcurement()) {
          roleEl.style.background = 'rgba(14,165,233,0.15)';
          roleEl.style.color = 'var(--secondary)';
        } else {
          roleEl.style.background = 'rgba(16,185,129,0.15)';
          roleEl.style.color = 'var(--accent-emerald)';
        }
      }
      if (adminBtn) adminBtn.style.display = Auth.isAdmin() ? 'inline-flex' : 'none';
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value.trim();
    const p = document.getElementById('login-password').value.trim();
    const btn = document.getElementById('login-submit-btn');

    if (!u || !p) {
      this.showToast('請輸入帳號與密碼', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = '登入驗證中...';

    try {
      const res = await Auth.login(u, p);
      if (res.success) {
        this.showToast(`歡迎回來，${res.user.name}！ (${Auth.getRoleName()})`, 'success');
        this.renderMainView();
        await this.loadData();
      } else {
        this.showToast(res.message, 'error');
      }
    } catch (err) {
      this.showToast('登入時發生錯誤', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '登入系統';
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const u = document.getElementById('reg-username').value.trim();
    const p = document.getElementById('reg-password').value.trim();
    const n = document.getElementById('reg-name').value.trim();
    const r = document.getElementById('reg-role').value;
    const btn = document.getElementById('reg-submit-btn');

    if (!u || !p || !n) {
      this.showToast('所有欄位皆為必填', 'warning');
      return;
    }

    btn.disabled = true;
    btn.textContent = '送出申請中...';

    try {
      const res = await Auth.register(u, p, n, r);
      if (res.success) {
        this.showToast(res.message, 'success');
        this.switchAuthTab('login');
      } else {
        this.showToast(res.message, 'error');
      }
    } catch (err) {
      this.showToast('註冊申請失敗', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '送出註冊審核申請';
    }
  },

  switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.getElementById('login-form-container').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('register-form-container').style.display = tab === 'register' ? 'block' : 'none';
  },

  fillQuickLogin(username, password) {
    this.switchAuthTab('login');
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
  },

  async openAdminModal() {
    if (!Auth.isAdmin()) {
      this.showToast('僅系統管理員有權限訪問後台', 'error');
      return;
    }
    document.getElementById('admin-modal').classList.add('active');
    await this.loadAdminUsers();
    await this.loadAdminLogs();
  },

  closeAdminModal() {
    document.getElementById('admin-modal').classList.remove('active');
  },

  async loadAdminUsers() {
    const listEl = document.getElementById('admin-users-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="padding: 20px; text-align: center;">載入用戶名單中...</div>';

    const res = await API.getUsers();
    if (res && res.success) {
      let html = `
        <table class="data-table" style="font-size: 0.85rem;">
          <thead>
            <tr>
              <th>帳號</th>
              <th>姓名/單位</th>
              <th>角色權限</th>
              <th>最後登入時間</th>
              <th>狀態</th>
              <th>審核操作</th>
            </tr>
          </thead>
          <tbody>
      `;

      res.users.forEach(u => {
        const isPending = u.status === '待審核';
        const isEnabled = u.status === '已啟用';

        const roleSelector = `
          <select style="background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 4px; font-size: 0.8rem;" onchange="App.changeUserRole('${u.username}', '${u.status}', this.value)">
            <option value="sales" ${u.role === 'sales' ? 'selected' : ''}>💼 業務 (業務價)</option>
            <option value="procurement" ${u.role === 'procurement' ? 'selected' : ''}>🛒 採購 (採購價)</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 管理者 (雙價)</option>
          </select>
        `;

        const statusBadge = isEnabled
          ? `<span style="background: rgba(16,185,129,0.15); color: var(--accent-emerald); padding: 2px 8px; border-radius: 4px; font-weight: 600;">已啟用</span>`
          : (isPending 
              ? `<span style="background: rgba(245,158,11,0.15); color: var(--accent-amber); padding: 2px 8px; border-radius: 4px; font-weight: 600;">待審核</span>`
              : `<span style="background: rgba(244,63,94,0.15); color: var(--accent-rose); padding: 2px 8px; border-radius: 4px; font-weight: 600;">停用</span>`);

        html += `
          <tr>
            <td style="font-weight: 600;">${u.username}</td>
            <td>${u.name}</td>
            <td>${roleSelector}</td>
            <td style="font-family: monospace; font-size: 0.78rem;">${u.lastLogin || '尚未登入'}</td>
            <td>${statusBadge}</td>
            <td>
              ${isPending || !isEnabled
                ? `<button class="btn btn-primary btn-sm" style="padding: 2px 8px;" onclick="App.updateUserStatus('${u.username}', '已啟用')">核准啟用</button>`
                : `<button class="btn btn-danger btn-sm" style="padding: 2px 8px;" onclick="App.updateUserStatus('${u.username}', '停用')">停用</button>`
              }
            </td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      listEl.innerHTML = html;
    }
  },

  async updateUserStatus(username, newStatus) {
    const res = await API.updateUserStatus(username, newStatus);
    if (res && res.success) {
      this.showToast(res.message, 'success');
      await this.loadAdminUsers();
    } else {
      this.showToast(res.message || '更新失敗', 'error');
    }
  },

  async changeUserRole(username, currentStatus, newRole) {
    const res = await API.updateUserStatus(username, currentStatus, newRole);
    if (res && res.success) {
      this.showToast(res.message, 'success');
    }
  },

  async loadAdminLogs() {
    const listEl = document.getElementById('admin-logs-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="padding: 20px; text-align: center;">載入日誌中...</div>';

    const res = await API.getLogs();
    if (res && res.success) {
      let html = `
        <table class="data-table" style="font-size: 0.82rem;">
          <thead>
            <tr>
              <th>時間</th>
              <th>帳號</th>
              <th>姓名</th>
              <th>結果</th>
              <th>備註/來源</th>
            </tr>
          </thead>
          <tbody>
      `;

      res.logs.forEach(l => {
        html += `
          <tr>
            <td style="font-family: monospace;">${l.time}</td>
            <td style="font-weight: 600;">${l.username}</td>
            <td>${l.name}</td>
            <td>${l.status}</td>
            <td style="color: var(--text-muted);">${l.detail}</td>
          </tr>
        `;
      });

      html += `</tbody></table>`;
      listEl.innerHTML = html;
    }
  },

  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
