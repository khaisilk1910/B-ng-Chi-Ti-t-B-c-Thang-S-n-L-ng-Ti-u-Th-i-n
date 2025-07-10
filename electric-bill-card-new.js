class CustomElectricBillCard extends HTMLElement {
  set hass(hass) {
    const entityId = this.config.entity;
    const state = hass.states[entityId];
    const kwh = parseFloat(state?.state || 0);

    const bac = [0, 0, 0, 0, 0, 0];
    const max = [50, 50, 100, 100, 100];
    let remaining = kwh;

    for (let i = 0; i < 5; i++) {
      bac[i] = Math.min(remaining, max[i]);
      remaining -= bac[i];
    }
    bac[5] = Math.max(remaining, 0);

    // Dùng localStorage nếu có
    const storageKey = 'customElectricBillPrices';
    const defaultPrices = [1984, 2050, 2380, 2998, 3350, 3460];
    if (!this.prices) {
      const saved = localStorage.getItem(storageKey);
      try {
        this.prices = saved ? JSON.parse(saved) : defaultPrices;
      } catch (e) {
        this.prices = defaultPrices;
      }
    }

    const tien = bac.map((val, i) => val * this.prices[i]);
    const tong = tien.reduce((a, b) => a + b, 0);
    const thue = tong * 0.08;
    const tongcong = tong + thue;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const avgKwh = kwh / lastDay;
    const avgCost = tongcong / lastDay;

    this.innerHTML = `
      <ha-card header="Chi tiết tiền điện tháng ${month + 1}/${year}" style="--ha-card-header-font-size: 24px; --ha-card-padding: 8px;">
        <table style="width:100%; border-collapse: collapse;">
          <tr style="background:#eee;">
            <th style="border: 1px solid #ccc; padding: 6px; color: red;">Bậc<br>(<a href="https://www.evn.com.vn/d/vi-VN/news/Bieu-gia-ban-le-dien-theo-Quyet-dinh-so-1279QD-BCT-ngay-0952025-cua-Bo-Cong-Thuong-60-28-502668" target="_blank">🌐</a>)</th>
            <th style="border: 1px solid #ccc; padding: 6px; color: red;">Đơn giá<br>(đ)</th>
            <th style="border: 1px solid #ccc; padding: 6px; color: red;">Sản lượng<br>(kWh)</th>
            <th style="border: 1px solid #ccc; padding: 6px; color: red;">Thành tiền<br>(đ)</th>
          </tr>
          ${bac.map((val, i) =>
            val > 0 ? `
              <tr>
                <td style="border: 1px solid #ccc; text-align:center;">${i + 1}</td>
                <td style="border: 1px solid #ccc; text-align:center;">
                  <input type="number" data-index="${i}" value="${this.prices[i]}" style="width: 80px; text-align: right;" />
                </td>
                <td style="border: 1px solid #ccc; text-align:center;">${val.toFixed(0)}</td>
                <td style="border: 1px solid #ccc; text-align:right;">${Math.round(tien[i]).toLocaleString()}</td>
              </tr>` : ''
          ).join('')}

          <tr>
            <td colspan="2" style="padding-right: 30px; text-align:right; padding-top: 20px; border-bottom: 1px solid rgba(204, 204, 204, 0.4); color: red;"><b>Tổng kWh:</b></td>
            <td style="text-align:right; color: red; padding-top: 20px; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>${kwh.toFixed(0)}</strong></td>
            <td style="text-align:center; padding-top: 20px; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>kWh</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding-right: 30px; text-align:right; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><b>Tổng tiền:</b></td>
            <td style="text-align:right; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>${Math.round(tong).toLocaleString()}</strong></td>
            <td style="text-align:center; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>đ</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding-right: 30px; text-align:right; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><b>VAT (8%):</b></td>
            <td style="text-align:right; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>${Math.round(thue).toLocaleString()}</strong></td>
            <td style="text-align:center; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>đ</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding-right: 30px; text-align:right; border-bottom: 1px solid rgba(204, 204, 204, 0.4); color: red;"><b>Thanh toán:</b></td>
            <td style="text-align:right; color: red; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>${Math.round(tongcong).toLocaleString()}</strong></td>
            <td style="text-align:center; border-bottom: 1px solid rgba(204, 204, 204, 0.4);"><strong>đ</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding-right: 30px; text-align:right; padding-top: 20px;"><b>TB Tháng:</b></td>
            <td style="text-align:right; padding-top: 20px;"><strong>${avgKwh.toFixed(2)}</strong></td>
            <td style="text-align:center; padding-top: 20px;"><strong>kWh/ngày</strong></td>
          </tr>
          <tr>
            <td colspan="2"></td>
            <td style="text-align:right;"><strong>${Math.round(avgCost).toLocaleString()}</strong></td>
            <td style="text-align:center;"><strong>đ/ngày</strong></td>
          </tr>
        </table>
        <div style="text-align: right; padding: 10px 16px;">
          <button id="reset-prices" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Đặt lại đơn giá mặc định
          </button>
        </div>
      </ha-card>
    `;

    // Sự kiện thay đổi đơn giá
    this.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        const newPrice = parseFloat(e.target.value);
        if (!isNaN(newPrice) && newPrice >= 0) {
          this.prices[index] = newPrice;
          localStorage.setItem(storageKey, JSON.stringify(this.prices));
          this.hass = hass;
        }
      });
    });

    // Sự kiện reset đơn giá
    this.querySelector('#reset-prices')?.addEventListener('click', () => {
      localStorage.removeItem(storageKey);
      this.prices = defaultPrices;
      this.hass = hass;
    });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error("Bạn cần cấu hình entity");
    }
    this.config = config;
  }

  getCardSize() {
    return 5;
  }
}
customElements.define('custom-electric-bill-card-new', CustomElectricBillCard);
