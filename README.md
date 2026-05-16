# UniPay Protocol 🟣

**UniPay** is a premium, stateless payment protocol built on the **Arc Network**, designed to provide seamless, non-custodial billing solutions for the modern decentralized web.

![UniPay Banner](https://unipay.app/banner.png)

## 🚀 Key Features

- **Stateless Payment Dispatch**: Funds go directly from the buyer to the merchant's wallet. UniPay never holds your assets.
- **On-chain Merchant Identity**: Verify your brand via the UniPay Registry. Set up your brand logo, name, and contact info directly on the blockchain.
- **Smart Paylinks**: Generate deterministic billing endpoints for one-time invoices with custom descriptions and expiry.
- **Recurring Subscriptions**: Set up recurring billing cycles for your services with ease.
- **AI-Powered Assistant**: Integrated intelligent guide powered by Google Gemini to help users navigate the protocol and resolve issues.
- **Multi-chain Readiness**: Built for Arc L1 with future-ready support for Base, Arbitrum, and Optimism.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TailwindCSS, Lucide Icons.
- **Blockchain Interface**: Wagmi, Viem, Reown AppKit.
- **Smart Contracts**: Solidity (UniPayRegistry deployed on Arc Network).
- **Intelligence**: Google Gemini Flash 1.5.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Zaynsky12/unipay.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_GOLDSKY_URL=your_subgraph_url
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔐 Security & Non-Custodial

UniPay is designed with a **stateless architecture**. When a session is paid, the protocol executes a direct transfer of assets. Merchants maintain 100% control over their funds at all times. All merchant metadata is stored on-chain via the `UniPayRegistry` contract.

---

*Built for the future of decentralized settlements on Arc Network.*
