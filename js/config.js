/**
 * ==============================================================================
 * 設備單價查詢系統 - 設定檔 (Config)
 * ==============================================================================
 * 請在此處填入您部署 Google Apps Script 後所取得的「網頁應用程式網址 (Web App URL)」
 * 格式範例：https://script.google.com/macros/s/AKfycbx.../exec
 * ==============================================================================
 */

const CONFIG = {
  // 您所設定的 Google Apps Script 部署網址：
  GAS_API_URL: "https://script.google.com/macros/s/AKfycbx1yMXWp3xHvFMe-rLIAyhhjcMPGJhkijDGSOqXRxZz0ivfpy1FI-ylTjpoBz7Yuv9W/exec",

  // 系統基本資訊
  APP_NAME: "智慧設備單價查詢系統",
  VERSION: "v1.2.0",

  // 預設 10 大弱電/監控/門禁/對講/停管/燈控類別與展示資料 (包含採購價 costPrice 與業務價 salesPrice)
  DEMO_DATA: {
    "01_中央監控系統": [
      {
        id: "01_中央監控系統_1",
        category: "01_中央監控系統",
        name: "AI 4K 超高畫質網路槍型攝影機",
        brand: "海康威視 HIKVISION",
        model: "DS-2CD3T87G2-LSU",
        costPrice: 4800,
        salesPrice: 6800,
        note: "星光級全彩夜視，內建車牌辨識與防護警戒",
        catalog: "https://www.hikvision.com"
      },
      {
        id: "01_中央監控系統_2",
        category: "01_中央監控系統",
        name: "64路 4K 雙電源高階 NVR 錄影主機",
        brand: "晶睿通訊 VIVOTEK",
        model: "NR9782-v2",
        costPrice: 48000,
        salesPrice: 65000,
        note: "支援 H.265/RAID 0,1,5,6/16 Bay 熱抽換",
        catalog: "https://www.vivotek.com"
      },
      {
        id: "01_中央監控系統_3",
        category: "01_中央監控系統",
        name: "55吋 4K 工業級液晶監控顯示器",
        brand: "優派 ViewSonic",
        model: "CDE5520",
        costPrice: 22000,
        salesPrice: 29800,
        note: "7x24小時全天候運作，窄邊框超廣視角",
        catalog: "https://www.viewsonic.com"
      }
    ],
    "02_門禁系統": [
      {
        id: "02_門禁系統_1",
        category: "02_門禁系統",
        name: "AI 3D人臉+指紋+感應卡辨識主機",
        brand: "茂旭 Soyal",
        model: "AR-837-EA",
        costPrice: 9800,
        salesPrice: 13800,
        note: "雙鏡頭活體防偽，支援TCP/IP與MQTT連線",
        catalog: "https://www.soyal.com"
      },
      {
        id: "02_門禁系統_2",
        category: "02_門禁系統",
        name: "防水型感應讀卡機 (Mifare)",
        brand: "茂旭 Soyal",
        model: "AR-721-K",
        costPrice: 1650,
        salesPrice: 2400,
        note: "IP65防水防塵，支援悠遊卡/一卡通",
        catalog: "https://www.soyal.com"
      },
      {
        id: "02_門禁系統_3",
        category: "02_門禁系統",
        name: "陽極鎖 600磅 (含訊號回授輸出)",
        brand: "朋茂 Pongee",
        model: "EB-200A",
        costPrice: 1200,
        salesPrice: 1850,
        note: "斷電開門安全型，具微動開關接點",
        catalog: "https://example.com/eb200a.pdf"
      }
    ],
    "03_對講系統": [
      {
        id: "03_對講系統_1",
        category: "03_對講系統",
        name: "10吋 Android 觸控智慧室內對講總機",
        brand: "宇瞻/聚積",
        model: "SIP-1000A",
        costPrice: 8500,
        salesPrice: 12500,
        note: "PoE供電，支援社區廣播與梯廳影像對講",
        catalog: "https://example.com/intercom-10.pdf"
      },
      {
        id: "03_對講系統_2",
        category: "03_對講系統",
        name: "彩色影像門口對講對講機 (大樓型)",
        brand: "進階對講",
        model: "VDP-800B",
        costPrice: 14500,
        salesPrice: 19800,
        note: "白光LED補光，廣角防暴面板",
        catalog: "https://example.com/vdp800.pdf"
      },
      {
        id: "03_對講系統_3",
        category: "03_對講系統",
        name: "緊急求救對講對講主機 (地下室/廁所)",
        brand: "台芝",
        model: "EM-500",
        costPrice: 3200,
        salesPrice: 4600,
        note: "一鍵呼叫警衛室，具雙向清晰對講",
        catalog: "https://example.com/em500.pdf"
      }
    ],
    "04_停管系統": [
      {
        id: "04_停管系統_1",
        category: "04_停管系統",
        name: "AI 動態車牌辨識一體機 (含補光燈)",
        brand: "車亭科技",
        model: "LPR-2000AI",
        costPrice: 28000,
        salesPrice: 38000,
        note: "辨識率>99.5%，含嵌入式演算法與防水外殼",
        catalog: "https://example.com/lpr2000.pdf"
      },
      {
        id: "04_停管系統_2",
        category: "04_停管系統",
        name: "伺服高速直流變頻柵欄機 (3米桿)",
        brand: "長佳",
        model: "BG-300S",
        costPrice: 32000,
        salesPrice: 43500,
        note: "起桿時間 1.2秒，具防砸防撞安全回彈",
        catalog: "https://example.com/bg300.pdf"
      },
      {
        id: "04_停管系統_3",
        category: "04_停管系統",
        name: "自動繳費機 (支援多元行動支付/悠遊卡)",
        brand: "華邦停管",
        model: "APS-800",
        costPrice: 165000,
        salesPrice: 215000,
        note: "支援LinePay/街口/悠遊卡/發票列印",
        catalog: "https://example.com/aps800.pdf"
      }
    ],
    "05_網路系統": [
      {
        id: "05_網路系統_1",
        category: "05_網路系統",
        name: "24埠 L2+ Managed PoE+ 網路交換器",
        brand: "思科 CISCO / CBS",
        model: "CBS350-24P",
        costPrice: 18500,
        salesPrice: 24800,
        note: "370W PoE預算，4個SFP+ 10G光纖埠",
        catalog: "https://www.cisco.com"
      },
      {
        id: "05_網路系統_2",
        category: "05_網路系統",
        name: "企業級 Wi-Fi 6 AX3000 無線AP",
        brand: "Aruba Networks",
        model: "AP-505",
        costPrice: 8900,
        salesPrice: 12800,
        note: "支援PoE供電，MU-MIMO多用戶高並發",
        catalog: "https://www.arubanetworks.com"
      },
      {
        id: "05_網路系統_3",
        category: "05_網路系統",
        name: "42U 標準 19吋伺服器機櫃 600x1000",
        brand: "台祥",
        model: "SR-42U-1000",
        costPrice: 14500,
        salesPrice: 19500,
        note: "含散熱風扇組、PDU電源排插、接地銅排",
        catalog: "https://example.com/rack42u.pdf"
      }
    ],
    "06_訪客機系統": [
      {
        id: "06_訪客機系統_1",
        category: "06_訪客機系統",
        name: "21.5吋 雙螢幕智慧訪客自助理登記機",
        brand: "創見資訊",
        model: "VIS-215K",
        costPrice: 46000,
        salesPrice: 62000,
        note: "內建證件掃描器、熱感印表機、人臉拍照",
        catalog: "https://example.com/vis215.pdf"
      },
      {
        id: "06_訪客機系統_2",
        category: "06_訪客機系統",
        name: "桌上型訪客發卡機 (含證件OCR辨識)",
        brand: "華信",
        model: "VDR-100",
        costPrice: 16500,
        salesPrice: 23000,
        note: "自動讀取身分證/健保卡，即時發放訪客QR碼",
        catalog: "https://example.com/vdr100.pdf"
      }
    ],
    "07_多媒體系統": [
      {
        id: "07_多媒體系統_1",
        category: "07_多媒體系統",
        name: "4K 數位電子看板播放器 (Android)",
        brand: "鎧應科技 CAYIN",
        model: "SMP-2300",
        costPrice: 9800,
        salesPrice: 14200,
        note: "支援排程播放、多區域分割畫面與遠端派送",
        catalog: "https://www.cayintech.com"
      },
      {
        id: "07_多媒體系統_2",
        category: "07_多媒體系統",
        name: "矩陣式多音區數位廣播擴大機 240W",
        brand: "TOA 日本",
        model: "VM-3240VA",
        costPrice: 38000,
        salesPrice: 49800,
        note: "6音區切換，消防連動緊急廣播認證",
        catalog: "https://www.toa.com.tw"
      },
      {
        id: "07_多媒體系統_3",
        category: "07_多媒體系統",
        name: "8吋 嵌頂式同軸雙音路揚聲器 30W",
        brand: "山葉 YAMAHA",
        model: "VXC8",
        costPrice: 3100,
        salesPrice: 4500,
        note: "高音質天花板喇叭，附變壓器支援100V",
        catalog: "https://www.yamaha.com"
      }
    ],
    "08_線材": [
      {
        id: "08_線材_1",
        category: "08_線材",
        name: "Cat.6 UTP 網路線 305米/箱 (純銅)",
        brand: "普利特 CommScope",
        model: "CS30-UTP-BL",
        costPrice: 3400,
        salesPrice: 4600,
        note: "23AWG純銅芯，符合TIA-568-C.2標準",
        catalog: "https://www.commscope.com"
      },
      {
        id: "08_線材_2",
        category: "08_線材",
        name: "Cat.6A 遮蔽式雙絞線 (FTP) 305米",
        brand: "太平洋電線電纜",
        model: "PEWC-C6A-S",
        costPrice: 5600,
        salesPrice: 7500,
        note: "具鋁箔隔離，抗電磁干擾 10G高速傳輸",
        catalog: "https://www.pewc.com.tw"
      },
      {
        id: "08_線材_3",
        category: "08_線材",
        name: "耐燃/耐熱控制信號線 0.9mm x 2C (200M)",
        brand: "大山電線",
        model: "FR-0.9-2C",
        costPrice: 1850,
        salesPrice: 2600,
        note: "通過消防耐燃認證 840度 30分鐘",
        catalog: "https://example.com/fr-wire.pdf"
      },
      {
        id: "08_線材_4",
        category: "08_線材",
        name: "單模 12芯 室內外光纖纜線 (每米)",
        brand: "華新麗華",
        model: "FOC-SM-12C",
        costPrice: 45,
        salesPrice: 65,
        note: "低耗損單模光纖，抗拉耐磨護套",
        catalog: "https://www.walsin.com"
      }
    ],
    "09_飛利浦燈控系統": [
      {
        id: "09_飛利浦燈控系統_1",
        category: "09_飛利浦燈控系統",
        name: "Dynalite 智慧照明中央控制主機",
        brand: "飛利浦 PHILIPS",
        model: "PDEG-Ethernet",
        costPrice: 42000,
        salesPrice: 58000,
        note: "支援DyNet / BACnet / IP 整合中央監控",
        catalog: "https://www.lighting.philips.com.tw"
      },
      {
        id: "09_飛利浦燈控系統_2",
        category: "09_飛利浦燈控系統",
        name: "4迴路 16A 智慧繼電器控制模組",
        brand: "飛利浦 PHILIPS",
        model: "DDRC416-RD",
        costPrice: 16500,
        salesPrice: 22800,
        note: "支援DALI-2調光與排程時鐘控制",
        catalog: "https://www.lighting.philips.com.tw"
      },
      {
        id: "09_飛利浦燈控系統_3",
        category: "09_飛利浦燈控系統",
        name: "多功能環境微波+照度感應器",
        brand: "飛利浦 PHILIPS",
        model: "DUS360CS",
        costPrice: 4600,
        salesPrice: 6500,
        note: "360度人體感應，自動依環境流明調光",
        catalog: "https://www.lighting.philips.com.tw"
      }
    ],
    "10_其他周邊設備": [
      {
        id: "10_其他周邊設備_1",
        category: "10_其他周邊設備",
        name: "在線互動式 UPS 不斷電系統 1500VA",
        brand: "飛瑞/伊頓 EATON",
        model: "C-1500",
        costPrice: 8800,
        salesPrice: 11800,
        note: "純正弦波輸出，保護弱電監控主機",
        catalog: "https://www.eaton.com"
      },
      {
        id: "10_其他周邊設備_2",
        category: "10_其他周邊設備",
        name: "弱電防雷突波吸收保護器 (RJ45/PoE)",
        brand: "德國 OBO BETTERMANN",
        model: "ND-CAT6A/EA",
        costPrice: 2200,
        salesPrice: 3100,
        note: "防護戶外攝影機雷擊突波，響應時間<1ns",
        catalog: "https://www.obo.de"
      },
      {
        id: "10_其他周邊設備_3",
        category: "10_其他周邊設備",
        name: "標準 110V 8孔 防突波鋁合金排插",
        brand: "群加 PowerSync",
        model: "TPS-8P-15A",
        costPrice: 850,
        salesPrice: 1250,
        note: "工業級金屬外殼，過載自動斷路器保護",
        catalog: "https://example.com/pdu8.pdf"
      }
    ],
    "11_電子鎖系統": [
      {
        id: "11_電子鎖系統_1",
        category: "11_電子鎖系統",
        name: "3D人臉辨識+指紋智慧電子鎖",
        brand: "耶魯 Yale",
        model: "YDM-7220",
        costPrice: 16500,
        salesPrice: 23800,
        note: "支援3D人臉、指紋、卡片、密碼、APP遠端開鎖",
        catalog: "https://www.yalelock.com.tw"
      },
      {
        id: "11_電子鎖系統_2",
        category: "11_電子鎖系統",
        name: "推拉式六合一智慧聯網電子鎖",
        brand: "飛利浦 PHILIPS",
        model: "DDL702E",
        costPrice: 18500,
        salesPrice: 26800,
        note: "內建Wi-Fi聯網、室內紅外線感應開門",
        catalog: "https://www.philips.com.tw"
      },
      {
        id: "11_電子鎖系統_3",
        category: "11_電子鎖系統",
        name: "指紋感應推拉智慧門鎖",
        brand: "三星 SAMSUNG / Zigbang",
        model: "SHP-DP738",
        costPrice: 13800,
        salesPrice: 19500,
        note: "藍牙連線、防尾隨安全鎖定、機械備用鑰匙",
        catalog: "https://www.samsungdigitallife.com"
      }
    ],
    "12_攝影機系統": [
      {
        id: "12_攝影機系統_1",
        category: "12_攝影機系統",
        name: "AI 4K 超高畫質星光全彩槍型攝影機",
        brand: "海康威視 HIKVISION",
        model: "DS-2CD2T87G2P-LSU",
        costPrice: 5200,
        salesPrice: 7500,
        note: "180度全景拼接超廣角、內建雙向語音對講",
        catalog: "https://www.hikvision.com"
      },
      {
        id: "12_攝影機系統_2",
        category: "12_攝影機系統",
        name: "500萬畫素 AI 人臉辨識紅外線半球攝影機",
        brand: "晶睿通訊 VIVOTEK",
        model: "FD9389-EHTV-v2",
        costPrice: 4200,
        salesPrice: 5900,
        note: "防暴IK10、IP66防水防塵，電動變焦鏡頭",
        catalog: "https://www.vivotek.com"
      },
      {
        id: "12_攝影機系統_3",
        category: "12_攝影機系統",
        name: "32倍光學變焦 4K 高速球型雲台攝影機 (PTZ)",
        brand: "大華 DAHUA",
        model: "SD6AL445XA-HNR",
        costPrice: 36000,
        salesPrice: 48500,
        note: "自動雷達追蹤、雷射補光夜視達500米",
        catalog: "https://www.dahuasecurity.com"
      }
    ]
  },

  // 本地模擬帳號名單 (區分 admin、sales、procurement)
  DEMO_USERS: [
    { username: "admin", password: "admin123", name: "系統管理員", status: "已啟用", role: "admin", registeredAt: "2026/08/29 10:00:00", lastLogin: "2026/08/30 00:10:00" },
    { username: "sales01", password: "123456", name: "業務部-張專員", status: "已啟用", role: "sales", registeredAt: "2026/08/29 11:20:00", lastLogin: "2026/08/29 22:15:00" },
    { username: "buyer01", password: "123456", name: "採購部-李經理", status: "已啟用", role: "procurement", registeredAt: "2026/08/29 12:30:00", lastLogin: "2026/08/29 21:00:00" },
    { username: "guest", password: "123456", name: "估價部-林小姐", status: "待審核", role: "sales", registeredAt: "2026/08/29 14:00:00", lastLogin: "尚未登入" }
  ],

  // 本地模擬登入紀錄
  DEMO_LOGS: [
    { time: "2026/08/30 00:10:00", username: "admin", name: "系統管理員", status: "成功", detail: "網頁端登入 (管理員雙價權限)" },
    { time: "2026/08/29 22:15:00", username: "sales01", name: "業務部-張專員", status: "成功", detail: "網頁端登入 (業務價權限)" },
    { time: "2026/08/29 21:00:00", username: "buyer01", name: "採購部-李經理", status: "成功", detail: "網頁端登入 (採購價權限)" },
    { time: "2026/08/29 14:05:00", username: "guest", name: "估價部-林小姐", status: "登入受阻 (待審核)", detail: "帳號審核中" }
  ]
};
