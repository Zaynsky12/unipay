# Morphic Privacy Vault

**Morphic Privacy Vault** is a state-of-the-art decentralized application (dApp) designed to bring absolute financial privacy to Web3 users. **Built specifically for the Arc Network**, Morphic utilizes advanced smart contracts to allow users to shield their public crypto assets, move them into a private vault, and withdraw them seamlessly.

## 🛡️ Key Features

- **Multi-Asset Shielding:** Seamlessly deposit (shield) and withdraw (unshield) multiple stablecoins, including **USDC** and **EURC**.
- **Arc Network Integration:** Fully built and deployed on **Arc Network**, leveraging its high-speed and low-cost infrastructure.
- **Dark Modern Glassmorphism UI:** A breathtaking, highly responsive, and futuristic user interface designed to feel premium and mysterious.
- **Real-Time On-Chain Syncing:** Instantly fetches user's public and private balances using direct blockchain reads.
- **Private Send (Coming Soon):** Send shielded assets directly to other users without ever revealing your identity on the public ledger.

## 💻 Tech Stack

- **Frontend Framework:** [Next.js](https://nextjs.org/) (App Router, React 18)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom Glassmorphism and micro-animations.
- **Web3 Integration:** [Wagmi](https://wagmi.sh/) + [Viem](https://viem.sh/) for contract interactions and hooks.
- **Wallet Connection:** [Reown AppKit](https://reown.com/) (@circle-fin/app-kit) for seamless wallet onboarding.
- **Smart Contracts:** Solidity, deployed via [Hardhat](https://hardhat.org/).

## 🚀 Getting Started

### 1. Clone & Install
```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_PROJECT_ID="your_walletconnect_project_id"
```

### 3. Run Development Server
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Smart Contract (Arc Network)
Morphic's logic is powered by `MorphicVault.sol`, enabling nested `mapping(address => mapping(address => uint256))` to keep track of user's shielded balances per asset securely.

**Deployed Contract Address (Arc Testnet):**
- Morphic Vault: `0xA08057b48C41B915112B5d1a7e462A1D44CC51a9`
- Supported Assets: `USDC`, `EURC`

## 🔒 Privacy Notice
While the frontend demonstrates the shielding and unshielding flow, true cryptographic privacy (like Zero-Knowledge proofs) depends on the underlying network capabilities. Morphic acts as the premier interface for interacting with Arc's privacy pools.
