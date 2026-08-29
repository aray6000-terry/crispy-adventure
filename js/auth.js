/**
 * ==============================================================================
 * 設備單價查詢系統 - 權限與身份驗證模組 (auth.js)
 * ==============================================================================
 */

const Auth = {
  SESSION_KEY: 'EQUIP_PRICE_AUTH_USER_V2',

  /**
   * 取得當前已登入使用者資訊
   */
  getUser() {
    const data = sessionStorage.getItem(this.SESSION_KEY);
    return data ? JSON.parse(data) : null;
  },

  /**
   * 是否已登入
   */
  isLoggedIn() {
    return Boolean(this.getUser());
  },

  /**
   * 取得當前角色 (admin | sales | procurement)
   */
  getRole() {
    const user = this.getUser();
    return user ? (user.role || 'sales') : 'guest';
  },

  /**
   * 取得角色中文名稱
   */
  getRoleName() {
    const role = this.getRole();
    if (role === 'admin') return '👑 系統管理員';
    if (role === 'procurement') return '🛒 採購人員';
    return '💼 業務人員';
  },

  isAdmin() {
    return this.getRole() === 'admin';
  },

  isSales() {
    return this.getRole() === 'sales';
  },

  isProcurement() {
    return this.getRole() === 'procurement';
  },

  /**
   * 執行登入
   */
  async login(username, password) {
    const res = await API.login(username, password);
    if (res.success && res.user) {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(res.user));
    }
    return res;
  },

  /**
   * 執行註冊申請
   */
  async register(username, password, name, role = 'sales') {
    return await API.register(username, password, name, role);
  },

  /**
   * 登出
   */
  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.reload();
  }
};
