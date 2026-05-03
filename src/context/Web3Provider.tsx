"use client";

import React, { type ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { defineChain } from 'viem';

// Define Arc Testnet for Wagmi/Viem
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

// Setup QueryClient
const queryClient = new QueryClient();

// Get your Project ID from cloud.reown.com
// Using a demo public ID for development, replace with your own in production
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '578ef42e8d44388cc7acc1ca69ed85a9';

// Metadata for Reown
const metadata = {
  name: 'Morphic Privacy',
  description: 'Private Transfers on Arc Network',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

// Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks: [arcTestnet],
  projectId,
  ssr: true,
});

// Initialize Reown AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [arcTestnet],
  defaultNetwork: arcTestnet,
  projectId,
  metadata,
  themeMode: 'dark',
  features: {
    analytics: false,
    email: false,
    socials: []
  },
  themeVariables: {
    '--w3m-accent': '#00E5FF', // Cyan accent from Arc Pass
    '--w3m-color-mix': '#000000',
    '--w3m-color-mix-strength': 10,
    '--w3m-border-radius-master': '12px',
  }
});

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
