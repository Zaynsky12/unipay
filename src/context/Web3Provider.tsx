"use client";

import React, { type ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';

// ── Arc Testnet Chain Definition ───────────────────────────────────────────────
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public:  { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// ── QueryClient ────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 10_000, retry: 2 },
  },
});

// ── Reown AppKit Config ────────────────────────────────────────────────────────
const projectId =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '578ef42e8d44388cc7acc1ca69ed85a9';

const metadata = {
  name: 'LumiPay',
  description: 'Decentralized Payment Checkout Protocol on Arc Network',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const wagmiAdapter = new WagmiAdapter({
  networks: [arcTestnet, base, arbitrum, optimism],
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnet, base, arbitrum, optimism],
  defaultNetwork: arcTestnet,
  projectId,
  metadata,
  themeMode: 'dark',
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeVariables: {
    '--w3m-accent': '#7C3AED',
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 15,
    '--w3m-border-radius-master': '12px',
  },
});

// ── Provider Export ────────────────────────────────────────────────────────────
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
