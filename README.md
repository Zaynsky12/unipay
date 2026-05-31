# LumiPay Protocol 🟣

> **Stateless stablecoin payment processing engine, built natively on the Arc Network.**

LumiPay is a fully decentralized, non-custodial payment checkout protocol that enables merchants to accept USDC from any chain and settle directly into their self-custody wallet in under 1 second. No intermediaries. No custodial risk. Pure on-chain finality.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Stateless Payment Dispatch** | Funds go P2P — directly from buyer wallet to merchant. LumiPay never holds assets. |
| 🧠 **On-chain Merchant Identity** | Brand name, metadata, and identity stored immutably on the `LumiPayRegistry` smart contract. |
| 🔗 **Smart Pay Links** | Generate deterministic endpoints for checkouts, invoices, and donations with custom expiry timers. |
| 🔄 **Recurring Subscriptions** | Schedule recurring billing cycles with configurable on-chain execution intervals. |
| ⚡ **1-Second Finality** | Built natively on the Arc Network for instant sub-second payment settlement and negligible gas fees. |
| 📊 **Real-time Analytics** | Live business performance metrics pulled from an on-chain subgraph (Goldsky-indexed). |
| 🌐 **Payment Explorer** | Public-facing transaction explorer for on-chain payment transparency. |

---

## 🏗 Architecture

```
[ Buyer ] ──→ [ LumiPay Frontend (Next.js) ]
                       │
                       ↓
        [ LumiPayRegistry Smart Contract ]  ←─ Deployed on Arc Network
                       │
             ┌─────────┴─────────┐
             ↓                   ↓
     [ Merchant Wallet ]   [ Event Emitted ]
                                 │
                                 ↓
                    [ Goldsky Subgraph Indexer ]
                                 │
                                 ↓
                    [ Dashboard Analytics / History ]
```

LumiPay is built on a **fully stateless architecture**. All state — merchant profiles, payment sessions, subscriptions — lives exclusively on-chain. The frontend is a read/write interface to the `LumiPayRegistry` contract with no backend server.

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** (App Router) — Framework
- **[TailwindCSS 4](https://tailwindcss.com/)** — Styling
- **[Lucide React](https://lucide.dev/)** — Icon system
- **[GSAP](https://gsap.com/)** — Animations

### Blockchain Interface
- **[Wagmi v3](https://wagmi.sh/)** + **[Viem v2](https://viem.sh/)** — EVM interaction
- **[Privy Headless Auth](https://privy.io/)** — Custom Embedded Wallet & Email/Google Auth integration
- **[Circle CCTP (Cross-Chain Transfer Protocol)](https://www.circle.com/)** — Decentralized Auto Bridge for cross-chain USDC

### Smart Contracts
- **[Solidity ^0.8.20](https://soliditylang.org/)** — `LumiPayRegistry` contract
- **[Hardhat](https://hardhat.org/)** — Development & deployment framework

### Indexing & Data
- **[Goldsky Subgraph](https://goldsky.com/)** — Real-time on-chain event indexing
- **[GraphQL Request](https://github.com/jasonkuhrt/graphql-request)** — Subgraph querying

### AI
- **[Google Gemini](https://ai.google.dev/)** — Embedded AI assistant

---

## 📦 Installation & Setup

### Prerequisites
- Node.js `>=18`
- npm or yarn
- MetaMask or any EVM-compatible wallet

### 1. Clone the repository

```bash
git clone https://github.com/Zaynsky12/lumipay.git
cd lumipay
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
# For Next.js frontend (Goldsky, Privy, Gemini)
cp .env.example .env.local

# For Hardhat smart contract deployment (Private Key)
cp .env.example .env
```

See [`.env.example`](./.env.example) for all required variables and instructions.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Smart Contract — `LumiPayRegistry`

Deployed on **Arc Network**. The single source of truth for all protocol state.

### Core Functions

| Function | Access | Description |
|---|---|---|
| `registerMerchant(name, metadata)` | Public | Register/update on-chain merchant profile |
| `createSession(amount, token, description, expiry, isReusable)` | Merchant | Create a new checkout payment link |
| `deactivateSession(sessionId)` | Merchant | Deactivate an active payment session |
| `pay(sessionId)` <br> `pay(sessionId, amount)` | Payer | Execute a P2P payment to a merchant. Supports dynamic amounts for donations. |
| `createSubscription(sessionId, interval)` | Payer | Subscribe to a merchant's recurring billing via a session |
| `executeSubscription(subId)` | Anyone / Relayer | Execute a due subscription payment |
| `cancelSubscription(subId)` | Merchant / Subscriber | Cancel an active subscription |

### On-chain Events (indexed by subgraph)

```solidity
MerchantRegistered(address indexed merchant, string name, string metadata)
SessionCreated(bytes32 indexed sessionId, address indexed merchant, uint256 amount, address token, string description, uint256 expiry, bool isReusable)
SessionDeactivated(bytes32 indexed sessionId)
PaymentCompleted(bytes32 indexed sessionId, address indexed merchant, address indexed payer, uint256 amount)
SubscriptionCreated(bytes32 indexed subId, address indexed merchant, address indexed subscriber, uint256 amount, uint256 interval, bytes32 sessionId)
SubscriptionExecuted(bytes32 indexed subId, address indexed merchant, address indexed subscriber, uint256 amount)
SubscriptionCancelled(bytes32 indexed subId)
```

---

## 📱 Dashboard Pages

| Route | Description |
|---|---|
| `/` | Landing page with protocol overview & live stats |
| `/dashboard` | Main merchant control center — payment links overview |
| `/dashboard/create` | Create new payment links (Checkout, Invoice, Subscription, Donate) |
| `/dashboard/history` | Full on-chain transaction history |
| `/dashboard/assets` | Cross-chain USDC asset overview |
| `/dashboard/account` | Merchant profile settings & on-chain identity management |
| `/dashboard/insights` | Business analytics & revenue metrics |
| `/pay/:sessionId` | Public-facing payment page for buyers |
| `/donate/:sessionId` | Public-facing donation page with dynamic amount input |
| `/subscribe/:merchantAddress` | Public-facing subscription page |
| `/explorer` | On-chain payment explorer |

---

## 🔐 Security & Non-Custodial Design

- **Reentrancy Protected**: The `pay()` function marks a session as fulfilled *before* executing the ERC20 transfer.
- **Stateless**: No user funds are ever held by the contract. All transfers are direct `transferFrom` → merchant wallet.
- **Social Login & Embedded Wallets**: Seamless onboarding via Privy Headless UI with Google Auth and email OTP login — no browser extension required.
- **Expiry Enforcement**: Every payment session has an on-chain expiry enforced at the contract level.
- **Non-custodial by design**: Merchants have 100% custody of funds at all times.

---

## 🌍 Supported Networks

| Network | Status |
|---|---|
| **Arc Network (L1)** | ✅ Primary — Live |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

*Built for the future of decentralized commerce on the Arc Network.*
