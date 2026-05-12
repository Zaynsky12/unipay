/**
 * UniPay Embedded Checkout Web Component
 * Tag: <unipay-checkout>
 * Attributes: merchant, amount, currency, session, theme
 */
class UniPayCheckoutWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['merchant', 'amount', 'currency', 'session', 'theme'];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const merchant = this.getAttribute('merchant') || 'Verified Merchant';
    const amount = this.getAttribute('amount') || '0.00';
    const currency = this.getAttribute('currency') || 'USDC';
    const session = this.getAttribute('session') || 'preview';
    const theme = this.getAttribute('theme') || 'dark';

    const isDark = theme === 'dark';
    const bgColor = isDark ? '#0A0A0F' : '#FFFFFF';
    const textColor = isDark ? '#EDEDED' : '#111827';
    const cardBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';

    // Rancang antarmuka sematan widget yang premium
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          width: 100%;
          max-width: 400px;
          box-sizing: border-box;
        }
        .widget-container {
          background-color: ${bgColor};
          color: ${textColor};
          border: 1px solid ${borderColor};
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid ${borderColor};
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .logo-area {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-icon {
          width: 22px;
          height: 22px;
          background: #7C3AED;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        }
        .brand {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .badge {
          background: rgba(124, 58, 237, 0.15);
          color: #A78BFA;
          border: 1px solid rgba(124, 58, 237, 0.3);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .merchant-name {
          font-size: 12px;
          color: ${isDark ? '#9CA3AF' : '#6B7280'};
          margin-bottom: 4px;
        }
        .amount-area {
          background: ${cardBg};
          border: 1px solid ${borderColor};
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          margin-bottom: 20px;
        }
        .amount-value {
          font-size: 28px;
          font-weight: 900;
          margin: 0;
          line-height: 1.1;
        }
        .currency-label {
          font-size: 12px;
          color: #818CF8;
          font-weight: 700;
        }
        .btn-pay {
          background: linear-gradient(135deg, #7C3AED, #6366F1);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px;
          width: 100%;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          text-align: center;
          display: block;
          text-decoration: none;
          box-sizing: border-box;
        }
        .btn-pay:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }
        .footer {
          font-size: 10px;
          color: ${isDark ? '#6B7280' : '#9CA3AF'};
          text-align: center;
          margin-top: 14px;
        }
      </style>

      <div class="widget-container">
        <div class="header">
          <div class="logo-area">
            <div class="logo-icon">U</div>
            <span class="brand">UniPay Checkout</span>
          </div>
          <span class="badge">Arc L1 L2 Bridge</span>
        </div>

        <div class="merchant-name">Payment Target:</div>
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 16px; word-break: break-all;">
          ${merchant.length === 42 ? `${merchant.slice(0, 10)}...${merchant.slice(-6)}` : merchant}
        </div>

        <div class="amount-area">
          <div class="amount-value">${amount} <span class="currency-label">${currency}</span></div>
          <div style="font-size: 11px; color: ${isDark ? '#6B7280' : '#9CA3AF'}; margin-top: 4px;">
            Settle in &lt; 1s native finality
          </div>
        </div>

        <a href="https://unipay.app/pay/${session}" target="_blank" class="btn-pay">
          Pay with any Chain Stablecoin
        </a>

        <div class="footer">
          Powered by Circle Unified Balance Protocol
        </div>
      </div>
    `;
  }
}

// Daftarkan Custom Element
if (!customElements.get('unipay-checkout')) {
  customElements.define('unipay-checkout', UniPayCheckoutWidget);
}
