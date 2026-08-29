/**
 * ==============================================================================
 * 設備單價查詢系統 - 詢價與估價清單模組 (cart.js)
 * ==============================================================================
 */

const Cart = {
  STORAGE_KEY: 'EQUIP_PRICE_CART_ITEMS_V2',
  items: [],

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.items = JSON.parse(saved);
      } catch (e) {
        this.items = [];
      }
    }
    this.updateBadge();
  },

  save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items));
    this.updateBadge();
  },

  /**
   * 加入設備至詢價單
   */
  addItem(item) {
    const existing = this.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      this.items.push({
        ...item,
        quantity: 1
      });
    }
    this.save();
    this.renderDrawer();
    App.showToast(`已將【${item.name}】加入清單`, 'success');
  },

  /**
   * 移除設備
   */
  removeItem(itemId) {
    this.items = this.items.filter(i => i.id !== itemId);
    this.save();
    this.renderDrawer();
  },

  /**
   * 調整數量
   */
  updateQuantity(itemId, delta) {
    const item = this.items.find(i => i.id === itemId);
    if (!item) return;

    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    this.save();
    this.renderDrawer();
  },

  /**
   * 清空詢價單
   */
  clear() {
    if (this.items.length === 0) return;
    if (confirm('確定要清空整份清單嗎？')) {
      this.items = [];
      this.save();
      this.renderDrawer();
      App.showToast('已清空清單', 'warning');
    }
  },

  /**
   * 計算總計金額
   */
  getTotalAmount() {
    return this.items.reduce((sum, item) => sum + ((item.price || item.salesPrice || item.costPrice || 0) * (item.quantity || 1)), 0);
  },

  /**
   * 管理者計算總成本
   */
  getTotalCost() {
    return this.items.reduce((sum, item) => sum + ((item.costPrice || item.price || 0) * (item.quantity || 1)), 0);
  },

  /**
   * 更新導覽列購物車數量角標
   */
  updateBadge() {
    const badge = document.getElementById('cart-badge-count');
    if (!badge) return;
    const totalQty = this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    badge.textContent = totalQty;
    badge.style.display = totalQty > 0 ? 'inline-block' : 'none';
  },

  /**
   * 渲染詢價單抽屜 / 彈窗
   */
  renderDrawer() {
    const container = document.getElementById('cart-items-list');
    const totalEl = document.getElementById('cart-total-amount');
    const countEl = document.getElementById('cart-item-count');
    const role = Auth.getRole();
    if (!container) return;

    if (countEl) countEl.textContent = this.items.length;

    const totalSales = this.getTotalAmount();
    const totalCost = this.getTotalCost();

    if (totalEl) {
      if (role === 'admin') {
        const grossProfit = totalSales - totalCost;
        const margin = totalSales > 0 ? Math.round((grossProfit / totalSales) * 100) : 0;
        totalEl.innerHTML = `
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-emerald);">業務總額: NT$ ${totalSales.toLocaleString()}</div>
          <div style="font-size: 0.85rem; color: var(--secondary); margin-top: 2px;">採購總成本: NT$ ${totalCost.toLocaleString()} | 預估毛利: NT$ ${grossProfit.toLocaleString()} (${margin}%)</div>
        `;
      } else if (role === 'procurement') {
        totalEl.innerHTML = `NT$ ${totalCost.toLocaleString()} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-dim);">(採購成本)</span>`;
      } else {
        totalEl.innerHTML = `NT$ ${totalSales.toLocaleString()} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-dim);">(業務報價)</span>`;
      }
    }

    if (this.items.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-dim);">
          <div style="font-size: 40px; margin-bottom: 8px;">🛒</div>
          <p>清單目前是空的</p>
          <p style="font-size: 0.8rem; margin-top: 4px;">點擊設備卡片上的「+ 詢價/加入」即可暫存試算！</p>
        </div>
      `;
      return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 12px;">`;

    this.items.forEach(item => {
      const qty = item.quantity || 1;
      let priceDisplay = '';
      let subtotalDisplay = '';

      if (role === 'admin') {
        const itemSales = item.salesPrice || item.price || 0;
        const itemCost = item.costPrice || 0;
        priceDisplay = `
          <div style="font-size: 0.8rem; color: var(--accent-emerald); font-weight: 600;">業務價: NT$ ${itemSales.toLocaleString()}</div>
          <div style="font-size: 0.75rem; color: var(--secondary);">採購價: NT$ ${itemCost.toLocaleString()}</div>
        `;
        subtotalDisplay = `
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald); font-family: monospace;">NT$ ${(itemSales * qty).toLocaleString()}</div>
          <div style="font-size: 0.72rem; color: var(--text-dim);">成本: NT$ ${(itemCost * qty).toLocaleString()}</div>
        `;
      } else if (role === 'procurement') {
        const itemCost = item.costPrice || item.price || 0;
        priceDisplay = `<div style="font-size: 0.82rem; color: var(--secondary); font-weight: 700;">採購單價: NT$ ${itemCost.toLocaleString()}</div>`;
        subtotalDisplay = `<div style="font-size: 0.95rem; font-weight: 700; color: var(--secondary); font-family: monospace;">NT$ ${(itemCost * qty).toLocaleString()}</div>`;
      } else {
        const itemSales = item.salesPrice || item.price || 0;
        priceDisplay = `<div style="font-size: 0.82rem; color: var(--accent-emerald); font-weight: 700;">業務單價: NT$ ${itemSales.toLocaleString()}</div>`;
        subtotalDisplay = `<div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-emerald); font-family: monospace;">NT$ ${(itemSales * qty).toLocaleString()}</div>`;
      }

      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="flex: 1; min-width: 0; padding-right: 12px;">
            <div style="font-weight: 600; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; gap: 8px; margin-top: 3px;">
              <span>${item.brand || '未指定'}</span>
              <span>•</span>
              <span style="font-family: monospace;">${item.model || '-'}</span>
            </div>
            <div style="margin-top: 4px;">
              ${priceDisplay}
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 10px;">
            <!-- 數量調整 -->
            <div style="display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
              <button class="btn btn-sm" style="padding: 2px 8px; border: none; background: none; color: var(--text-main);" onclick="Cart.updateQuantity('${item.id}', -1)">-</button>
              <span style="padding: 0 8px; font-size: 0.85rem; font-weight: 600; min-width: 24px; text-align: center;">${qty}</span>
              <button class="btn btn-sm" style="padding: 2px 8px; border: none; background: none; color: var(--text-main);" onclick="Cart.updateQuantity('${item.id}', 1)">+</button>
            </div>

            <!-- 小計 -->
            <div style="text-align: right; min-width: 95px;">
              ${subtotalDisplay}
            </div>

            <!-- 刪除 -->
            <button class="btn btn-icon btn-sm btn-danger" style="width: 28px; height: 28px;" onclick="Cart.removeItem('${item.id}')" title="刪除">
              ✕
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  /**
   * 匯出 Excel (CSV 格式，防中文亂碼，依據使用者權限調整欄位)
   */
  exportToCsv() {
    if (this.items.length === 0) {
      App.showToast('清單內無資料可匯出', 'warning');
      return;
    }

    const role = Auth.getRole();
    let headers = [];
    let rows = [];

    if (role === 'admin') {
      headers = ['類別', '設備項目', '廠牌', '型號', '採購成本(NT$)', '業務售價(NT$)', '數量', '採購小計(NT$)', '業務小計(NT$)', '預估毛利(NT$)', '備註', '型錄連結'];
      rows = this.items.map(item => {
        const qty = item.quantity || 1;
        const cost = item.costPrice || 0;
        const sales = item.salesPrice || item.price || 0;
        return [
          `"${(item.category || '').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.brand || '').replace(/"/g, '""')}"`,
          `"${(item.model || '').replace(/"/g, '""')}"`,
          cost,
          sales,
          qty,
          cost * qty,
          sales * qty,
          (sales - cost) * qty,
          `"${(item.note || '').replace(/"/g, '""')}"`,
          `"${(item.catalog || '').replace(/"/g, '""')}"`
        ];
      });
      rows.push(['', '', '', '', '合計總額', '', '', this.getTotalCost(), this.getTotalAmount(), this.getTotalAmount() - this.getTotalCost(), '', '']);
    } else if (role === 'procurement') {
      headers = ['類別', '設備項目', '廠牌', '型號', '採購單價(NT$)', '數量', '採購小計(NT$)', '備註', '型錄連結'];
      rows = this.items.map(item => {
        const qty = item.quantity || 1;
        const cost = item.costPrice || item.price || 0;
        return [
          `"${(item.category || '').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.brand || '').replace(/"/g, '""')}"`,
          `"${(item.model || '').replace(/"/g, '""')}"`,
          cost,
          qty,
          cost * qty,
          `"${(item.note || '').replace(/"/g, '""')}"`,
          `"${(item.catalog || '').replace(/"/g, '""')}"`
        ];
      });
      rows.push(['', '', '', '', '合計總金額', '', this.getTotalCost(), '', '']);
    } else {
      // 業務 sales
      headers = ['類別', '設備項目', '廠牌', '型號', '業務單價(NT$)', '數量', '小計(NT$)', '備註', '型錄連結'];
      rows = this.items.map(item => {
        const qty = item.quantity || 1;
        const sales = item.salesPrice || item.price || 0;
        return [
          `"${(item.category || '').replace(/"/g, '""')}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.brand || '').replace(/"/g, '""')}"`,
          `"${(item.model || '').replace(/"/g, '""')}"`,
          sales,
          qty,
          sales * qty,
          `"${(item.note || '').replace(/"/g, '""')}"`,
          `"${(item.catalog || '').replace(/"/g, '""')}"`
        ];
      });
      rows.push(['', '', '', '', '合計總金額', '', this.getTotalAmount(), '', '']);
    }

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `設備清單_${role}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    App.showToast('清單 CSV 匯出成功！', 'success');
  },

  /**
   * 列印報價單模式
   */
  printQuotation() {
    if (this.items.length === 0) {
      App.showToast('清單內無資料可列印', 'warning');
      return;
    }
    window.print();
  }
};
