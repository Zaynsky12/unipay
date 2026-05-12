# UniPay — Decentralized Checkout Protocol 🌐💳

> **Stripe-grade Payment Experience Built Natively for Web3.**  
> Accept static or dynamic settlements in **USDC / EURC** from any EVM network, bridge natively to the **Arc Network L1**, and settle directly into your merchant wallet in **&lt; 1 second**.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636?style=flat-square&logo=solidity)](https://soliditylang.org)
[![Arc Network](https://img.shields.io/badge/L1%20Chain-Arc%20Testnet-7C3AED?style=flat-square)](https://arc.network)

---

## ⚡ Core Philosophy & Architecture
UniPay operates entirely **without backend servers or proprietary databases**.  
The actual core "database" and validation layer is an un-upgradable Solidity smart contract (`UniPayRegistry`) residing immutably on the Arc Network blockchain. 

### 🛡️ Key Platform Modules:
1. **Merchant Command Center (`/dashboard`)**:
   - Register corporate identities onchain natively.
   - Monitor real-time dynamic settlement volumes extracted directly from unmanipulated node maps.
   - Asynchronous live socket reflection via `watchContractEvent` intercepts completed customer payments instantly without UI refreshing.
2. **Dynamic Invoicing Generator (`/dashboard/create`)**:
   - Generate secure P2P checkout parameters targeting deterministic `keccak256` session identifiers to prevent settlement collisions.
3. **Decentralized Audit Archives (`/dashboard/history`)**:
   - Interrogates Arc L1 event logs via direct RPC socket routing (`eth_getLogs`) to form transparent ledger timelines.
4. **Public Registry Explorer (`/explorer`)**:
   - Browse global merchant parameters mapping sub-second finality confidences.
5. **Universal Embedded Widget (`public/widget.js`)**:
   - Drop-in standalone Web Component (`<unipay-checkout>`) enabling seamless checkout modules inside third-party Web2 frameworks (WordPress, React, Vanilla HTML).

---

## 🛠️ Technology Stack
- **Frontend Framework**: Next.js 14 (App Router) + TypeScript
- **Styling Engine**: Tailwind CSS + Premium Custom Glassmorphism UI
- **Web3 Adapters**: Wagmi v2 + Viem v2 + Reown AppKit Cross-chain Modals
- **Smart Contract Interface**: Solidity (EVM Bytecode Compliant)
- **Target L1 Node**: Arc Testnet (`Chain ID: 5042002`, `RPC: https://rpc.testnet.arc.network`)

---

## 📦 Local Deployment & Verification

### 1. Environment Setup
Create a `.env` file at root level mapping your explicit environment keys:
```env
NEXT_PUBLIC_REOWN_PROJECT_ID="YOUR_REOWN_PROJECT_ID"
DEPLOYER_PRIVATE_KEY="0xYOUR_TESTNET_PRIVATE_KEY"
```

### 2. Auto-Deploying Smart Contract
Execute our smart pre-compiled Node.js script to push your state machine directly to the Arc Testnet:
```bash
node scripts/deploy.mjs
```
*Note: Upon block confirmation, the script will automatically harvest the resultant permanent contract address and inject it safely into your `src/lib/constants.ts` file.*

### 3. Launching Development Server
Start hot-reloading development instances locally:
```bash
npm install
npm run dev
```
Navigate to `http://localhost:3000` to review rich aesthetic landing sequences.

---

## 🛡️ Production Compliance
This application strictly adheres to production validation parameters. Running compilation audits guarantees clean execution traces:
```bash
npm run build
```
Resultant output routes guarantee highly optimized static server pre-rendering configurations mixed with fast dynamic routes.

---

## 📄 License
Distributed under the **MIT License**. Immutably accessible globally.
