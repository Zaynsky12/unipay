"use client";

import React from 'react';
import Link from 'next/link';
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  Zap, 
  ArrowRight, 
  Globe, 
  Layers, 
  CheckCircle2, 
  UserPlus, 
  CreditCard, 
  Banknote,
  ShieldCheck
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

export default function LandingPage() {
  // Membaca statistik publik dari kontrak secara realtime/periodik
  const { data: statsData, isLoading } = useReadContracts({
    contracts: [
      { address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'totalMerchants' },
      { address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'totalVolume' },
      { address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'totalTransactions' },
    ],
  });

  const totalMerchants = statsData?.[0]?.result ? Number(statsData[0].result) : 0;
  // Volume USDC dalam 6 decimals
  const totalVolume = statsData?.[1]?.result ? Number(formatUnits(statsData[1].result, 6)) : 0;
  const totalTransactions = statsData?.[2]?.result ? Number(statsData[2].result) : 0;

  return (
    <div className="flex flex-col gap-0 pb-24 animate-fade-in overflow-hidden">
      
      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-32 md:pt-20">
        {/* Latar Belakang & Efek Cahaya */}
        <div className="absolute top-0 -z-10 w-full h-full bg-[#0A0A0F]" />
        <div className="absolute top-1/4 -left-1/4 -z-10 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-1/3 -right-1/4 -z-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] opacity-50" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs md:text-sm font-bold text-violet-400 mb-8 backdrop-blur-md animate-fade-in-down">
          <Zap className="w-4 h-4 fill-current text-violet-400" />
          Fully Onchain Checkout Protocol on Arc Network
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-8 max-w-5xl animate-fade-in-up">
          Accept USDC from any chain, <br />
          <span className="gradient-text">settle in &lt; 1 second.</span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed mb-12 animate-fade-in-up delay-100 px-2">
          UniPay is the decentralized Stripe of Web3. Receive multi-chain stablecoin payments instantly directly into your self-custodial wallet. No database, no backend servers.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up delay-200">
          <Link 
            href="/dashboard" 
            className="group relative px-8 py-4 bg-white text-black font-black rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Launch App
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#how-it-works" 
            className="px-8 py-4 bg-white/[0.04] text-white font-bold rounded-xl border border-white/10 hover:bg-white/[0.08] transition-all flex items-center justify-center backdrop-blur-xl"
          >
            Explore Protocol
          </a>
        </div>

        {/* ── Live Onchain Statistics ── */}
        <div className="w-full max-w-5xl mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left px-4 animate-fade-in-up delay-300">
          <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-violet-600/5 rounded-full blur-xl group-hover:bg-violet-600/10 transition-all" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Merchants</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {isLoading ? <span className="shimmer px-8 py-1 rounded w-16 inline-block" /> : totalMerchants}
              </span>
              <span className="text-xs text-violet-400 font-semibold">Active</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Verified directly from smart contract</p>
          </div>

          <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-xl group-hover:bg-indigo-600/10 transition-all" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Volume Settled</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                ${isLoading ? <span className="shimmer px-12 py-1 rounded w-24 inline-block" /> : totalVolume.toLocaleString()}
              </span>
              <span className="text-xs text-gray-400 font-semibold">USDC</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">&lt; 1s finality on Arc Network</p>
          </div>

          <div className="glass-panel p-6 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-600/5 rounded-full blur-xl group-hover:bg-emerald-600/10 transition-all" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Transactions</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-white">
                {isLoading ? <span className="shimmer px-8 py-1 rounded w-16 inline-block" /> : totalTransactions}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">100% Onchain</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">Zero database infrastructure</p>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-white/5 mt-12">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Protocol Mechanics</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Decentralized Payments in 3 Steps</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            Seamlessly accept global digital assets directly inside your web application without manual intermediaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Register Merchant",
              desc: "Connect your self-custodial wallet and register your commercial identity onchain. Your data resides securely in contract state.",
              icon: UserPlus,
            },
            {
              step: "02",
              title: "Create Payment",
              desc: "Generate dynamic payment checkout links or grab the ready-to-use self-contained embedded web component widget for your website.",
              icon: CreditCard,
            },
            {
              step: "03",
              title: "Get Paid Instantly",
              desc: "Buyers pay with stablecoins from any chain. Assets are automatically bridged via Arc App Kit and settled natively into your address.",
              icon: Banknote,
            }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 relative group hover:border-violet-500/30 transition-all duration-500 flex flex-col justify-between">
              <div>
                <span className="absolute top-4 right-6 text-5xl font-black text-white/[0.03] group-hover:text-white/[0.08] transition-colors">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" /> Fully trustless operation
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features & Native Advantage ── */}
      <section className="w-full bg-white/[0.01] py-24 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 mb-6 uppercase tracking-widest">
              Unified Liquidity
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Payers from any chain, <br />
              <span className="gradient-text">Unified balance processing.</span>
            </h2>
            <p className="text-gray-400 text-base mb-8 leading-relaxed">
              Powered by the <span className="text-white font-semibold">Circle Arc App Kit</span>, UniPay identifies a user&apos;s USDC balance across arbitrary layer-2s and automatically bridges them instantly into the Arc Network for microsecond transaction checkout.
            </p>
            <div className="space-y-4">
              {[
                "Zero platform database requirements",
                "Instant programmatic cross-chain route detection",
                "Self-contained embeddable Web Component integration",
                "Built directly over robust Circle infrastructure",
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                  <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 blur-3xl -z-10 rounded-full" />
            <div className="w-full max-w-md glass-panel p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-gray-400">Payment Routing State</span>
                </div>
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">Arc Protocol</span>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Buyer Chain</span>
                  <span className="text-white font-medium">Arbitrum / Base / Ethereum</span>
                </div>
                <div className="text-sm font-bold text-violet-300">Auto-bridging via Unified Balance</div>
              </div>

              <div className="flex items-center justify-center text-gray-600 py-1">
                ↓
              </div>

              <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <div className="flex justify-between text-xs text-violet-400 mb-1">
                  <span>Target Chain</span>
                  <span className="text-white font-bold">Arc Network L1</span>
                </div>
                <div className="text-xs text-gray-300">Smart Contract <code className="bg-black/30 px-1 py-0.5 rounded text-violet-300 font-mono">pay()</code> execution</div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-gray-500">
                <span>Finality time</span>
                <span className="text-emerald-400 font-bold">&lt; 1,000ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="pt-24 flex flex-col items-center text-center px-4">
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight max-w-2xl">
          Start Accepting Next-Gen Digital Dollars Today.
        </h2>
        <p className="text-gray-400 max-w-xl text-sm md:text-base mb-8">
          Join the fully open source, immutable payment protocol built natively for borderless enterprise commerce.
        </p>
        <Link 
          href="/dashboard" 
          className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_25px_rgba(124,58,237,0.4)]"
        >
          Open Merchant Portal
        </Link>
      </section>
    </div>
  );
}
