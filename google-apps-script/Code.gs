/**
 * ==============================================================================
 * 設備單價查詢系統 - Google Apps Script (GAS) 後端 API 與自動建表程式
 * ==============================================================================
 * 功能說明：
 * 1. setupDatabase(): 第一次使用時執行此函式，自動建立 10 個分類分頁、_用戶權限表與_登入紀錄表。
 * 2. doGet(e): 提供分類清單、各類別設備資料、全域資料查詢 API。
 * 3. doPost(e): 提供使用者登入驗證、登入時間紀錄、新帳號註冊申請、帳號審核等 API。
 * ==============================================================================
 */

// 系統保留分頁名稱
const SYSTEM_SHEETS = ['_用戶權限', '_登入紀錄'];

/**
 * 第一次使用：自動初始化 Google Sheet 資料庫 (只建立不存在的分頁，絕不覆蓋既有資料)
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. 檢查或建立「_用戶權限」分頁 (若已存在則保留所有既有帳號資料)
  let userSheet = ss.getSheetByName('_用戶權限');
  if (!userSheet) {
    userSheet = ss.insertSheet('_用戶權限');
    userSheet.getRange(1, 1, 1, 7).setValues([[
      '帳號 (Username)', '密碼 (Password)', '姓名/單位', '狀態 (已啟用/待審核/停用)', '角色 (admin/sales/procurement)', '註冊時間', '最後登入時間'
    ]]);
    userSheet.getRange(1, 1, 1, 7).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    
    // 僅在全新建立時加入預設管理員與測試帳號
    userSheet.appendRow(['admin', 'admin123', '系統管理員', '已啟用', 'admin', new Date(), new Date()]);
    userSheet.appendRow(['sales01', '123456', '業務部-張專員', '已啟用', 'sales', new Date(), '']);
    userSheet.appendRow(['buyer01', '123456', '採購部-李經理', '已啟用', 'procurement', new Date(), '']);
    userSheet.appendRow(['guest', '123456', '估價部-林小姐', '待審核', 'sales', new Date(), '']);
    userSheet.autoResizeColumns(1, 7);
  }

  // 2. 檢查或建立「_登入紀錄」分頁
  let logSheet = ss.getSheetByName('_登入紀錄');
  if (!logSheet) {
    logSheet = ss.insertSheet('_登入紀錄');
    logSheet.getRange(1, 1, 1, 5).setValues([[
      '登入時間', '帳號', '姓名/單位', '登入結果', '備註/客戶端'
    ]]);
    logSheet.getRange(1, 1, 1, 5).setBackground('#0f172a').setFontColor('#ffffff').setFontWeight('bold');
    logSheet.appendRow([new Date(), 'admin', '系統管理員', '成功', '系統初始化建立']);
    logSheet.autoResizeColumns(1, 5);
  }

  // 3. 建立 12 個設備分類分頁 (安全機制：已存在的分頁 100% 完整保留，不覆蓋任何既有資料)
  const defaultCategories = [
    {
      name: '01_中央監控系統',
      items: [
        ['AI 4K 超高畫質網路槍型攝影機', '海康威視 HIKVISION', 'DS-2CD3T87G2-LSU', 4800, 6800, '星光級全彩夜視，內建車牌辨識與防護警戒', 'https://www.hikvision.com'],
        ['64路 4K 雙電源高階 NVR 錄影主機', '晶睿通訊 VIVOTEK', 'NR9782-v2', 48000, 65000, '支援 H.265/RAID 0,1,5,6/16 Bay 熱抽換', 'https://www.vivotek.com'],
        ['55吋 4K 工業級液晶監控顯示器', '優派 ViewSonic', 'CDE5520', 22000, 29800, '7x24小時全天候運作，窄邊框超廣視角', 'https://www.viewsonic.com']
      ]
    },
    {
      name: '02_門禁系統',
      items: [
        ['AI 3D人臉+指紋+感應卡辨識主機', '茂旭 Soyal', 'AR-837-EA', 9800, 13800, '雙鏡頭活體防偽，支援TCP/IP與MQTT連線', 'https://www.soyal.com'],
        ['防水型感應讀卡機 (Mifare)', '茂旭 Soyal', 'AR-721-K', 1650, 2400, 'IP65防水防塵，支援悠遊卡/一卡通', 'https://www.soyal.com'],
        ['陽極鎖 600磅 (含訊號回授輸出)', '朋茂 Pongee', 'EB-200A', 1200, 1850, '斷電開門安全型，具微動開關接點', 'https://example.com/eb200a.pdf']
      ]
    },
    {
      name: '03_對講系統',
      items: [
        ['10吋 Android 觸控智慧室內對講總機', '宇瞻/聚積', 'SIP-1000A', 8500, 12500, 'PoE供電，支援社區廣播與梯廳影像對講', 'https://example.com/intercom-10.pdf'],
        ['彩色影像門口對講對講機 (大樓型)', '進階對講', 'VDP-800B', 14500, 19800, '白光LED補光，廣角防暴面板', 'https://example.com/vdp800.pdf'],
        ['緊急求救對講對講主機 (地下室/廁所)', '台芝', 'EM-500', 3200, 4600, '一鍵呼叫警衛室，具雙向清晰對講', 'https://example.com/em500.pdf']
      ]
    },
    {
      name: '04_停管系統',
      items: [
        ['AI 動態車牌辨識一體機 (含補光燈)', '車亭科技', 'LPR-2000AI', 28000, 38000, '辨識率>99.5%，含嵌入式演算法與防水外殼', 'https://example.com/lpr2000.pdf'],
        ['伺服高速直流變頻柵欄機 (3米桿)', '長佳', 'BG-300S', 32000, 43500, '起桿時間 1.2秒，具防砸防撞安全回彈', 'https://example.com/bg300.pdf'],
        ['自動繳費機 (支援多元行動支付/悠遊卡)', '華邦停管', 'APS-800', 165000, 215000, '支援LinePay/街口/悠遊卡/發票列印', 'https://example.com/aps800.pdf']
      ]
    },
    {
      name: '05_網路系統',
      items: [
        ['24埠 L2+ Managed PoE+ 網路交換器', '思科 CISCO / CBS', 'CBS350-24P', 18500, 24800, '370W PoE預算，4個SFP+ 10G光纖埠', 'https://www.cisco.com'],
        ['企業級 Wi-Fi 6 AX3000 無線AP', 'Aruba Networks', 'AP-505', 8900, 12800, '支援PoE供電，MU-MIMO多用戶高並發', 'https://www.arubanetworks.com'],
        ['42U 標準 19吋伺服器機櫃 600x1000', '台祥', 'SR-42U-1000', 14500, 19500, '含散熱風扇組、PDU電源排插、接地銅排', 'https://example.com/rack42u.pdf']
      ]
    },
    {
      name: '06_訪客機系統',
      items: [
        ['21.5吋 雙螢幕智慧訪客自助理登記機', '創見資訊', 'VIS-215K', 46000, 62000, '內建證件掃描器、熱感印表機、人臉拍照', 'https://example.com/vis215.pdf'],
        ['桌上型訪客發卡機 (含證件OCR辨識)', '華信', 'VDR-100', 16500, 23000, '自動讀取身分證/健保卡，即時發放訪客QR碼', 'https://example.com/vdr100.pdf']
      ]
    },
    {
      name: '07_多媒體系統',
      items: [
        ['4K 數位電子看板播放器 (Android)', '鎧應科技 CAYIN', 'SMP-2300', 9800, 14200, '支援排程播放、多區域分割畫面與遠端派送', 'https://www.cayintech.com'],
        ['矩陣式多音區數位廣播擴大機 240W', 'TOA 日本', 'VM-3240VA', 38000, 49800, '6音區切換，消防連動緊急廣播認證', 'https://www.toa.com.tw'],
        ['8吋 嵌頂式同軸雙音路揚聲器 30W', '山葉 YAMAHA', 'VXC8', 3100, 4500, '高音質天花板喇叭，附變壓器支援100V', 'https://www.yamaha.com']
      ]
    },
    {
      name: '08_線材',
      items: [
        ['Cat.6 UTP 網路線 305米/箱 (純銅)', '普利特 CommScope', 'CS30-UTP-BL', 3400, 4600, '23AWG純銅芯，符合TIA-568-C.2標準', 'https://www.commscope.com'],
        ['Cat.6A 遮蔽式雙絞線 (FTP) 305米', '太平洋電線電纜', 'PEWC-C6A-S', 5600, 7500, '具鋁箔隔離，抗電磁干擾 10G高速傳輸', 'https://www.pewc.com.tw'],
        ['耐燃/耐熱控制信號線 0.9mm x 2C (200M)', '大山電線', 'FR-0.9-2C', 1850, 2600, '通過消防耐燃認證 840度 30分鐘', 'https://example.com/fr-wire.pdf'],
        ['單模 12芯 室內外光纖纜線 (每米)', '華新麗華', 'FOC-SM-12C', 45, 65, '低耗損單模光纖，抗拉耐磨護套', 'https://www.walsin.com']
      ]
    },
    {
      name: '09_飛利浦燈控系統',
      items: [
        ['Dynalite 智慧照明中央控制主機', '飛利浦 PHILIPS', 'PDEG-Ethernet', 42000, 58000, '支援DyNet / BACnet / IP 整合中央監控', 'https://www.lighting.philips.com.tw'],
        ['4迴路 16A 智慧繼電器控制模組', '飛利浦 PHILIPS', 'DDRC416-RD', 16500, 22800, '支援DALI-2調光與排程時鐘控制', 'https://www.lighting.philips.com.tw'],
        ['多功能環境微波+照度感應器', '飛利浦 PHILIPS', 'DUS360CS', 4600, 6500, '360度人體感應，自動依環境流明調光', 'https://www.lighting.philips.com.tw']
      ]
    },
    {
      name: '10_其他周邊設備',
      items: [
        ['在線互動式 UPS 不斷電系統 1500VA', '飛瑞/伊頓 EATON', 'C-1500', 8800, 11800, '純正弦波輸出，保護弱電監控主機', 'https://www.eaton.com'],
        ['弱電防雷突波吸收保護器 (RJ45/PoE)', '德國 OBO BETTERMANN', 'ND-CAT6A/EA', 2200, 3100, '防護戶外攝影機雷擊突波，響應時間<1ns', 'https://www.obo.de'],
        ['標準 110V 8孔 防突波鋁合金排插', '群加 PowerSync', 'TPS-8P-15A', 850, 1250, '工業級金屬外殼，過載自動斷路器保護', 'https://example.com/pdu8.pdf']
      ]
    },
    {
      name: '11_電子鎖系統',
      items: [
        ['3D人臉辨識+指紋智慧電子鎖', '耶魯 Yale', 'YDM-7220', 16500, 23800, '支援3D人臉、指紋、卡片、密碼、APP遠端開鎖', 'https://www.yalelock.com.tw'],
        ['推拉式六合一智慧聯網電子鎖', '飛利浦 PHILIPS', 'DDL702E', 18500, 26800, '內建Wi-Fi聯網、室內紅外線感應開門', 'https://www.philips.com.tw'],
        ['指紋感應推拉智慧門鎖', '三星 SAMSUNG / Zigbang', 'SHP-DP738', 13800, 19500, '藍牙連線、防尾隨安全鎖定、機械備用鑰匙', 'https://www.samsungdigitallife.com']
      ]
    },
    {
      name: '12_攝影機系統',
      items: [
        ['AI 4K 超高畫質星光全彩槍型攝影機', '海康威視 HIKVISION', 'DS-2CD2T87G2P-LSU', 5200, 7500, '180度全景拼接超廣角、內建雙向語音對講', 'https://www.hikvision.com'],
        ['500萬畫素 AI 人臉辨識紅外線半球攝影機', '晶睿通訊 VIVOTEK', 'FD9389-EHTV-v2', 4200, 5900, '防暴IK10、IP66防水防塵，電動變焦鏡頭', 'https://www.vivotek.com'],
        ['32倍光學變焦 4K 高速球型雲台攝影機 (PTZ)', '大華 DAHUA', 'SD6AL445XA-HNR', 36000, 48500, '自動雷達追蹤、雷射補光夜視達500米', 'https://www.dahuasecurity.com']
      ]
    }
  ];

  defaultCategories.forEach(cat => {
    let sheet = ss.getSheetByName(cat.name);
    // 如果分頁不存在，才進行建立與加入初始示範資料；如果已存在，絕對不改動裡面的任何資料！
    if (!sheet) {
      sheet = ss.insertSheet(cat.name);
      sheet.getRange(1, 1, 1, 7).setValues([[
        '項目', '廠牌', '型號', '採購成本', '業務成本', '備註', '型錄(下載連結)'
      ]]);
      sheet.getRange(1, 1, 1, 7).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
      
      if (cat.items && cat.items.length > 0) {
        sheet.getRange(2, 1, cat.items.length, 7).setValues(cat.items);
      }
      sheet.autoResizeColumns(1, 7);
    }
  });

  const defaultSheet = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (defaultSheet && defaultSheet.getLastRow() === 0 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }
}

/**
 * 💡 智慧無痛升級函式 (smartMigrateDatabase)
 * 如果您手動打了很多資料，只需執行此函式：
 * 1. 100% 完整保留您在 Google Sheet 裡輸入的每一筆設備資料。
 * 2. 自動檢查各分頁第 1 列標題，補齊「採購成本」與「業務成本」標準格式。
 */
function smartMigrateDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (SYSTEM_SHEETS.includes(name)) return;

    const lastRow = sheet.getLastRow();
    const lastCol = Math.max(sheet.getLastColumn(), 7);
    if (lastRow === 0) return;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const colMap = getHeaderMapping(headers);

    // 若原分頁只有 6 欄且只有單一金額欄位，安全自動擴充第 1 列標題
    if (colMap.costPrice === -1 || colMap.salesPrice === -1) {
      sheet.getRange(1, 1, 1, 7).setValues([[
        '項目', '廠牌', '型號', '採購成本', '業務成本', '備註', '型錄(下載連結)'
      ]]);
      sheet.getRange(1, 1, 1, 7).setBackground('#0284c7').setFontColor('#ffffff').setFontWeight('bold');
    }
  });

  SpreadsheetApp.getUi().alert('✅ 升級完成！您原本輸入的所有設備項目皆已 100% 完整保留！');
}

/**
 * 處理 GET 請求 (依角色過濾價格資訊，支援動態標題偵測)
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const action = params.action || 'getAllData';
  const userRole = String(params.role || 'sales').trim().toLowerCase(); // 'admin' | 'sales' | 'procurement'
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === 'getCategories') {
      const sheets = ss.getSheets();
      const categories = sheets
        .map(s => s.getName())
        .filter(name => !SYSTEM_SHEETS.includes(name));

      return createJsonResponse({ success: true, categories: categories });
    }

    if (action === 'getAllData') {
      const sheets = ss.getSheets();
      const result = {};
      let totalItemCount = 0;

      sheets.forEach(sheet => {
        const name = sheet.getName();
        if (SYSTEM_SHEETS.includes(name)) return;

        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          result[name] = [];
          return;
        }

        // 第 1 列為標題，進行動態智能欄位配對
        const headers = data[0];
        const colMap = getHeaderMapping(headers);

        const items = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[colMap.name] && !row[colMap.brand] && !row[colMap.model]) continue;

          // 準確讀取並清洗金額 (支援含逗號、貨幣符號之文字)
          const costPrice = colMap.costPrice !== -1 ? parseNumber(row[colMap.costPrice]) : 0;
          const salesPrice = colMap.salesPrice !== -1 ? parseNumber(row[colMap.salesPrice]) : 0;
          const note = colMap.note !== -1 ? String(row[colMap.note] || '').trim() : '';
          const catalog = colMap.catalog !== -1 ? String(row[colMap.catalog] || '').trim() : '';

          // 依使用者角色進行嚴格資料隔離
          const itemObj = {
            id: `${name}_${i}`,
            category: name,
            name: String(row[colMap.name] || '').trim(),
            brand: colMap.brand !== -1 ? String(row[colMap.brand] || '').trim() : '',
            model: colMap.model !== -1 ? String(row[colMap.model] || '').trim() : '',
            note: note,
            catalog: catalog,
            rowIndex: i + 1
          };

          if (userRole === 'admin') {
            itemObj.costPrice = costPrice;
            itemObj.salesPrice = salesPrice;
            itemObj.profit = salesPrice - costPrice;
            itemObj.profitMargin = salesPrice > 0 ? Math.round(((salesPrice - costPrice) / salesPrice) * 100) : 0;
            itemObj.price = salesPrice; // 主顯示金額
          } else if (userRole === 'procurement') {
            itemObj.costPrice = costPrice;
            itemObj.price = costPrice; // 採購專屬主顯示金額
          } else {
            // sales 業務
            itemObj.salesPrice = salesPrice;
            itemObj.price = salesPrice; // 業務專屬主顯示金額
          }

          items.push(itemObj);
          totalItemCount++;
        }

        result[name] = items;
      });

      return createJsonResponse({
        success: true,
        userRole: userRole,
        categories: Object.keys(result),
        totalItems: totalItemCount,
        data: result,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getUsers') {
      const userSheet = ss.getSheetByName('_用戶權限');
      if (!userSheet) return createJsonResponse({ success: false, message: '權限表尚未建立' });

      const data = userSheet.getDataRange().getValues();
      const users = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        users.push({
          username: String(row[0]),
          name: String(row[2] || ''),
          status: String(row[3] || '待審核'),
          role: String(row[4] || 'sales'),
          registeredAt: row[5] ? formatDate(row[5]) : '',
          lastLogin: row[6] ? formatDate(row[6]) : '尚未登入',
          rowIndex: i + 1
        });
      }
      return createJsonResponse({ success: true, users: users });
    }

    if (action === 'getLogs') {
      const logSheet = ss.getSheetByName('_登入紀錄');
      if (!logSheet) return createJsonResponse({ success: true, logs: [] });

      const data = logSheet.getDataRange().getValues();
      const logs = [];
      for (let i = Math.max(1, data.length - 100); i < data.length; i++) {
        const row = data[i];
        if (!row[0]) continue;
        logs.unshift({
          time: row[0] ? formatDate(row[0]) : '',
          username: String(row[1] || ''),
          name: String(row[2] || ''),
          status: String(row[3] || ''),
          detail: String(row[4] || '')
        });
      }
      return createJsonResponse({ success: true, logs: logs });
    }

    return createJsonResponse({ success: false, message: '無效的 action 參數' });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 處理 POST 請求 (登入驗證、登入時間寫入、用戶註冊、權限審核)
 */
function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let payload = {};

  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }
  } catch (parseErr) {
    return createJsonResponse({ success: false, message: 'JSON 格式錯誤' });
  }

  const action = payload.action || '';

  try {
    // 1. 登入驗證
    if (action === 'login') {
      const username = String(payload.username || '').trim();
      const password = String(payload.password || '').trim();
      const userAgent = String(payload.userAgent || 'Web 瀏覽器');

      if (!username || !password) {
        return createJsonResponse({ success: false, message: '請輸入帳號與密碼' });
      }

      const userSheet = ss.getSheetByName('_用戶權限');
      if (!userSheet) {
        return createJsonResponse({ success: false, message: '系統權限表尚未初始化，請聯絡管理員執行 setupDatabase()' });
      }

      const data = userSheet.getDataRange().getValues();
      let foundUser = null;
      let userRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (String(row[0]).trim() === username) {
          foundUser = {
            username: String(row[0]).trim(),
            password: String(row[1]).trim(),
            name: String(row[2] || '').trim(),
            status: String(row[3] || '待審核').trim(),
            role: String(row[4] || 'sales').trim()
          };
          userRowIndex = i + 1;
          break;
        }
      }

      if (!foundUser || foundUser.password !== password) {
        appendLoginLog(ss, username, foundUser ? foundUser.name : '未知用戶', '失敗 (密碼錯誤/無此帳號)', userAgent);
        return createJsonResponse({ success: false, message: '帳號或密碼錯誤，請重新確認' });
      }

      if (foundUser.status !== '已啟用') {
        appendLoginLog(ss, username, foundUser.name, `登入受阻 (${foundUser.status})`, userAgent);
        if (foundUser.status === '待審核') {
          return createJsonResponse({ success: false, message: '您的帳號正在審核中，請待管理員核准後方可登入！' });
        } else {
          return createJsonResponse({ success: false, message: `您的帳號目前狀態為【${foundUser.status}】，無法進入系統。` });
        }
      }

      // 驗證成功：更新「最後登入時間」
      const now = new Date();
      userSheet.getRange(userRowIndex, 7).setValue(now);

      // 寫入「_登入紀錄」表
      appendLoginLog(ss, username, foundUser.name, '成功', userAgent);

      const token = Utilities.base64Encode(username + ':' + now.getTime() + ':' + foundUser.role);

      return createJsonResponse({
        success: true,
        message: '登入成功',
        user: {
          username: foundUser.username,
          name: foundUser.name,
          role: foundUser.role, // 'admin' | 'sales' | 'procurement'
          lastLogin: formatDate(now)
        },
        token: token
      });
    }

    // 2. 訪客註冊申請
    if (action === 'register') {
      const username = String(payload.username || '').trim();
      const password = String(payload.password || '').trim();
      const name = String(payload.name || '').trim();
      const role = String(payload.role || 'sales').trim(); // 'sales' | 'procurement'

      if (!username || !password || !name) {
        return createJsonResponse({ success: false, message: '所有註冊欄位均為必填' });
      }

      const userSheet = ss.getSheetByName('_用戶權限');
      if (!userSheet) return createJsonResponse({ success: false, message: '系統權限表尚未初始化' });

      const data = userSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === username) {
          return createJsonResponse({ success: false, message: '此帳號已存在，請使用其他帳號或直接登入' });
        }
      }

      const now = new Date();
      userSheet.appendRow([username, password, name, '待審核', role, now, '']);
      appendLoginLog(ss, username, name, `註冊申請 (${role === 'procurement' ? '採購' : '業務'})`, '送出註冊待後台審核');

      return createJsonResponse({
        success: true,
        message: '註冊申請已送出！請等待管理員在 Google Sheet 或後台審核啟用後即可登入。'
      });
    }

    // 3. 管理者操作：審核/修改用戶狀態與角色
    if (action === 'updateUserStatus') {
      const targetUsername = String(payload.targetUsername || '').trim();
      const newStatus = String(payload.newStatus || '').trim();
      const newRole = payload.newRole ? String(payload.newRole).trim() : '';

      const userSheet = ss.getSheetByName('_用戶權限');
      const data = userSheet.getDataRange().getValues();
      let targetRowIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === targetUsername) {
          targetRowIndex = i + 1;
          break;
        }
      }

      if (targetRowIndex === -1) {
        return createJsonResponse({ success: false, message: '找不到該用戶' });
      }

      if (newStatus) {
        userSheet.getRange(targetRowIndex, 4).setValue(newStatus);
      }
      if (newRole) {
        userSheet.getRange(targetRowIndex, 5).setValue(newRole);
      }

      return createJsonResponse({ success: true, message: `用戶 [${targetUsername}] 資料已更新！` });
    }

    return createJsonResponse({ success: false, message: '未知的 POST action' });

  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * 寫入登入日誌
 */
function appendLoginLog(ss, username, name, status, detail) {
  try {
    let logSheet = ss.getSheetByName('_登入紀錄');
    if (!logSheet) {
      logSheet = ss.insertSheet('_登入紀錄');
      logSheet.getRange(1, 1, 1, 5).setValues([['登入時間', '帳號', '姓名/單位', '登入結果', '備註/客戶端']]);
    }
    logSheet.appendRow([new Date(), username, name, status, detail]);
  } catch (e) {
    console.error('寫入日誌失敗:', e);
  }
}

function formatDate(date) {
  if (!date) return '';
  try {
    const d = new Date(date);
    return Utilities.formatDate(d, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
  } catch (e) {
    return String(date);
  }
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 智能標題解析：自動偵測「業務價」、「採購價」、「項目」、「廠牌」、「型號」等欄位位置
 * 無論您的 Google Sheet 欄位順序為何、或標題文字些微不同，皆能精準配對！
 */
function getHeaderMapping(headers) {
  const map = {
    name: 0,
    brand: 1,
    model: 2,
    costPrice: -1,
    salesPrice: -1,
    generalPrice: -1,
    note: -1,
    catalog: -1
  };

  headers.forEach((h, idx) => {
    const title = String(h || '').trim().toLowerCase();
    if (!title) return;

    // 1. 業務成本 / 業務價 / 報價 / 售價 / 建議售價 (若包含「業務」優先判定為業務成本)
    if (title.includes('業務') || title.includes('報價') || title.includes('售價') || title.includes('定價') || title.includes('牌價') || title.includes('建議') || title.includes('sales') || title.includes('quote') || title.includes('sell')) {
      map.salesPrice = idx;
    }
    // 2. 採購成本 / 採購價 / 進價 / 進貨 / 底價 / 成本
    else if (title.includes('採購') || title.includes('成本') || title.includes('進價') || title.includes('進貨') || title.includes('底價') || title.includes('cost') || title.includes('buy') || title.includes('purchase')) {
      map.costPrice = idx;
    }
    // 3. 通用單一金額欄位 (備援)
    else if (title.includes('金額') || title.includes('單價') || title.includes('price')) {
      map.generalPrice = idx;
    }
    // 4. 項目名稱 / 品名
    else if (title.includes('項目') || title.includes('品名') || title.includes('設備') || title.includes('名稱') || title.includes('item') || title.includes('name')) {
      map.name = idx;
    }
    // 5. 廠牌 / 品牌
    else if (title.includes('廠牌') || title.includes('品牌') || title.includes('brand') || title.includes('make')) {
      map.brand = idx;
    }
    // 6. 型號 / 規格
    else if (title.includes('型號') || title.includes('規格') || title.includes('model') || title.includes('spec')) {
      map.model = idx;
    }
    // 7. 備註 / 說明
    else if (title.includes('備註') || title.includes('說明') || title.includes('note') || title.includes('remark')) {
      map.note = idx;
    }
    // 8. 型錄 / 檔案連結
    else if (title.includes('型錄') || title.includes('連結') || title.includes('下載') || title.includes('catalog') || title.includes('link') || title.includes('url')) {
      map.catalog = idx;
    }
  });

  // 若未明確找到特定欄位，進行智慧推斷與備援
  if (map.costPrice === -1 && map.salesPrice === -1) {
    if (map.generalPrice !== -1) {
      map.salesPrice = map.generalPrice;
      map.costPrice = map.generalPrice;
    } else {
      map.costPrice = 3;
      map.salesPrice = 4;
    }
  } else if (map.costPrice === -1 && map.salesPrice !== -1) {
    map.costPrice = map.generalPrice !== -1 ? map.generalPrice : map.salesPrice;
  } else if (map.salesPrice === -1 && map.costPrice !== -1) {
    map.salesPrice = map.generalPrice !== -1 ? map.generalPrice : map.costPrice;
  }

  if (map.note === -1) map.note = 5;
  if (map.catalog === -1) map.catalog = 6;

  return map;
}

/**
 * 數值清洗函式：自動去除貨幣符號、千分位逗號、字串空白，精準轉為浮點數
 */
function parseNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}


