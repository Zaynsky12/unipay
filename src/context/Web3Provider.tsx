"use client";

import React, { type ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import { defineChain } from 'viem';
import { baseSepolia, arbitrumSepolia, optimismSepolia, sepolia } from 'viem/chains';

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
// The QueryClient will be instantiated inside the component to avoid SSR issues.

// ── Wagmi Config ───────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  ssr: true,
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
  transports: {
    [arcTestnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
});

// ── Privy Config ───────────────────────────────────────────────────────────────
const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 10_000, retry: 2 },
    },
  }));

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#fc5000',
          showWalletLoginFirst: false,
        },
        defaultChain: arcTestnet,
        supportedChains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
