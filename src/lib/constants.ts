// ── UniPay Contract Address (UniPayRegistry) ──────────────────────────────────
// Will be filled automatically after deploy on Arc Testnet
export const UNIPAY_REGISTRY_ADDRESS = "0xe9dbfa0c86bb35f2152826d759482a03edf9d612" as `0x${string}`;

// ── Token Addresses ────────────────────────────────────────────────────────────
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`;

// ── UniPayRegistry ABI (100% Presisi dan Sinkron dengan Kontrak Solidity Aktual) ──
export const REGISTRY_ABI = [
  // ── Read Functions ──────────────────────────────────────────────────────────
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "merchants",
    "outputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "metadata", "type": "string" },
      { "internalType": "bool", "name": "isRegistered", "type": "bool" },
      { "internalType": "uint256", "name": "totalReceived", "type": "uint256" },
      { "internalType": "uint256", "name": "totalTransactions", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }],
    "name": "sessions",
    "outputs": [
      { "internalType": "address", "name": "merchant", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" },
      { "internalType": "bool", "name": "isFulfilled", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // ── Write Functions ─────────────────────────────────────────────────────────
  {
    "inputs": [
      { "internalType": "string", "name": "name", "type": "string" },
      { "internalType": "string", "name": "metadata", "type": "string" }
    ],
    "name": "registerMerchant",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "expiry", "type": "uint256" }
    ],
    "name": "createSession",
    "outputs": [{ "internalType": "bytes32", "name": "sessionId", "type": "bytes32" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "bytes32", "name": "sessionId", "type": "bytes32" }],
    "name": "pay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "name", "type": "string" },
      { "indexed": false, "internalType": "string", "name": "metadata", "type": "string" }
    ],
    "name": "MerchantRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "token", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "expiry", "type": "uint256" }
    ],
    "name": "SessionCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "bytes32", "name": "sessionId", "type": "bytes32" },
      { "indexed": true, "internalType": "address", "name": "merchant", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "payer", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "PaymentCompleted",
    "type": "event"
  }
] as const;

// ── ERC20 ABI (minimal for approval + balance) ─────────────────────────────────
export const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ── Supported tokens list ──────────────────────────────────────────────────────
export const SUPPORTED_TOKENS = [
  { symbol: "USDC", address: USDC_ADDRESS, decimals: 6 },
  { symbol: "EURC", address: EURC_ADDRESS, decimals: 6 },
] as const;

export type SupportedToken = "USDC" | "EURC";
