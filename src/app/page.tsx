"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Zap, 
  ArrowRight, 
  Globe, 
  Layers, 
  CheckCircle2, 
  UserPlus, 
  CreditCard, 
  Banknote,
  ShieldCheck,
  ArrowDown,
  RefreshCw,
  Cpu,
  Activity,
  Shield,
  Puzzle,
  Sparkles
} from 'lucide-react';
import { useProtocolStats } from '@/lib/hooks/useProtocolStats';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { stats, isLoading } = useProtocolStats();
  const { totalMerchants, totalVolume, totalTransactions } = stats;

  // Format volume dengan desimal 2 digit yang sempurna
  const formattedVolume = totalVolume.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  return (
    <div className="flex flex-col gap-0 pb-24 animate-fade-in overflow-hidden">
      
      {/* ── Hero Section ── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-32 md:pt-20">
        {/* Latar Belakang & Efek Cahaya Premium */}
        <div className="absolute top-0 -z-10 w-full h-full bg-[#0A0A0F]" />
        <div className="absolute top-1/4 -left-1/4 -z-10 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-1/3 -right-1/4 -z-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs md:text-sm font-bold text-violet-400 mb-8 backdrop-blur-md animate-fade-in-down">
          <Zap className="w-4 h-4 fill-current text-violet-400 shrink-0" />
          <span>Stateless Payment Protocol build on Arc</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[1.05] mb-8 max-w-5xl animate-fade-in-up">
          Accept USDC from any chain, <br />
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-white bg-clip-text text-transparent">
            settle in &lt; 1 second.
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed mb-12 animate-fade-in-up delay-100 px-2">
          UniPay is the decentralized Stripe of Web3. Intercept multi-chain stablecoin settlements directly into your self-custodial sovereign matrix. Real-time on-chain indexing for absolute transaction transparency.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up delay-200">
          <button 
            onClick={() => {
              if (isConnected) {
                router.push('/dashboard');
              } else {
                open();
              }
            }}
            className="group relative px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_35px_rgba(124,58,237,0.4)]"
          >
            <span>{isConnected ? 'Launch Merchant App' : 'Connect to Launch App'}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#how-it-works" 
            className="px-8 py-4 bg-white/[0.03] hover:bg-white/[0.08] text-white font-bold rounded-xl border border-white/10 transition-all flex items-center justify-center backdrop-blur-xl"
          >
            Explore System Architecture
          </a>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-24 border-t border-white/5 mt-12">
        <div className="text-center mb-16">
          <div className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-3">Protocol Mechanics</div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Decentralized Checkout in 4 Phases</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Instantly accept cross-chain stablecoins inside any dynamic frontend architecture without handling raw keys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              title: "Merchant Identity",
              desc: "Establish a permanent business profile with your brand logo, website, and socials stored directly on the blockchain.",
              icon: Shield,
            },
            {
              step: "02",
              title: "Stateless Routing",
              desc: "Payments are processed without centralized servers. Your revenue is settled directly to your self-custody wallet.",
              icon: Zap,
            },
            {
              step: "03",
              title: "Unified Assets",
              desc: "Monitor and manage your USDC liquidity across Arc, Base, Arbitrum, and Optimism in one consolidated dashboard.",
              icon: RefreshCw,
            },
            {
              step: "04",
              title: "Developer Ready",
              desc: "Integrate custom checkout flows into your store with our upcoming SDK and webhook integration system.",
              icon: Puzzle,
            }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl relative group hover:border-violet-500/30 transition-all duration-500 flex flex-col justify-between">
              <div>
                <span className="absolute top-4 right-6 text-5xl font-black text-white/[0.02] group-hover:text-white/[0.08] transition-colors font-mono">
                  {item.step}
                </span>
                <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400 group-hover:scale-110 transition-transform">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" /> Fully On-chain Identity Verified
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Unified Liquidity Cross-Chain Architecture (Dirombak Total Tampilannya Penuh WOW) ── */}
      <section className="w-full bg-gradient-to-b from-white/[0.01] via-black to-white/[0.01] py-24 border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Sisi Kiri: Penjelasan Teks Wibawa (6 Kolom) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs font-black text-violet-400 uppercase tracking-widest shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Unified Liquidity Engine
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
              Payers from any chain, <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                Unified balance processing.
              </span>
            </h2>
            
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              Powered by the <span className="text-white font-bold">Circle Arc App Kit</span>, UniPay identifies a user&apos;s USDC balance across arbitrary layer-2 networks and automatically bridges them instantly into the Arc Network for microsecond transaction checkout.
            </p>
            
            <div className="space-y-3 pt-2">
              {[
                "On-chain Merchant Profile (Logo, Website, Email)",
                "Consolidated Multi-Chain Asset Management",
                "Real-time Business Performance Analytics",
                "Direct On-chain Finality & SDK Ready",
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-gray-300 font-bold bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sisi Kanan: Visualisasi Animasi Interaktif State Routing Canggih (6 Kolom) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-violet-500/20 shadow-[0_0_50px_rgba(124,58,237,0.1)] relative overflow-hidden backdrop-blur-xl">
              
              {/* Header Label Matriks */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                  <span className="text-xs font-black text-white tracking-wider uppercase">Payment Routing State</span>
                </div>
                <span className="text-[10px] font-mono bg-violet-500/10 text-violet-300 px-2.5 py-1 rounded-lg border border-violet-500/20 font-bold">
                  Arc Protocol Kit
                </span>
              </div>

              {/* Langkah 1: Rantai Asal Pembeli */}
              <div className="mt-6 space-y-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Source Origin</span>
                
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-gray-400 font-bold">Buyer Chain Instances</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-white font-bold">Arbitrum</span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-white font-bold">Base</span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-white font-bold">Ethereum</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-black text-violet-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Auto-bridging via Unified Balance
                  </div>
                </div>
              </div>

              {/* Penghubung Jalur Jembatan dengan Animasi Aliran Indah */}
              <div className="py-4 flex flex-col items-center justify-center relative">
                <div className="w-0.5 h-10 bg-gradient-to-b from-blue-500 via-violet-500 to-emerald-500 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white animate-ping" />
                </div>
                <div className="absolute bg-black/80 border border-white/10 px-3 py-1 rounded-full text-[9px] font-mono text-violet-300 font-bold tracking-widest shadow-lg uppercase">
                  Cross-Chain Intercept
                </div>
              </div>

              {/* Langkah 2: Rantai Tujuan L1 */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Target Execution Destination</span>
                
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900/20 to-black border border-violet-500/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-violet-300 font-bold">Target Settlement L1</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-xs font-black">
                      Arc Network
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-300 font-medium flex items-center gap-1.5">
                    <span>Smart Contract</span> 
                    <code className="bg-black/60 px-2 py-0.5 rounded border border-white/5 text-violet-300 font-mono font-bold">pay()</code> 
                    <span>execution trigger</span>
                  </div>
                </div>
              </div>

              {/* Rekap Durasi Eksekusi Finalitas */}
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01] p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Finality validation speed</span>
                </div>
                <span className="text-xs font-mono font-black text-emerald-400 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                  &lt; 1,000ms
                </span>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── CTA Bottom ── */}
      <section className="pt-24 flex flex-col items-center text-center px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight max-w-2xl leading-tight">
          Start Accepting Stateless Stablecoins Today.
        </h2>
        <p className="text-gray-400 max-w-xl text-xs sm:text-sm mb-8 leading-relaxed">
          Deploy native cryptographic commercial verification mapping straight into your Web3 application interface. Zero platform counterparty risks.
        </p>
        <Link 
          href="/dashboard" 
          className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl transition-all shadow-[0_0_30px_rgba(124,58,237,0.3)] text-sm tracking-wide"
        >
          Access Merchant Dashboard
        </Link>
      </section>

      {/* ── Ultra-Premium Precision Footer ── */}
      <footer className="w-full max-w-6xl mx-auto mt-32 pt-14 pb-10 border-t border-white/5 px-6 relative z-10">
        {/* Ambient background glow inside footer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[150px] bg-gradient-to-r from-violet-600/5 via-indigo-600/10 to-violet-600/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between">
          
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left space-y-3.5">
            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-white/[0.01] border border-white/5 backdrop-blur-md shadow-inner">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] shrink-0 animate-pulse">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-orbitron font-bold tracking-widest text-white bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-transparent text-base">
                UNIPAY
              </span>
            </div>
            
            <p className="text-xs text-gray-400 max-w-sm mx-auto md:mx-0 leading-relaxed font-medium">
              Stateless stablecoin processing engine. Direct peer-to-peer liquidity finality optimized natively for sovereign Web3 applications.
            </p>
          </div>

          {/* Social Navigation Links as Tactile Micro-interactive Buttons */}
          <div className="md:col-span-7 w-full md:w-auto flex items-center justify-center md:justify-end gap-2 sm:gap-4 text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-4 md:mt-0">
            <a 
              href="https://x.com/owsnpidc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.02] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 text-gray-400 hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center gap-1 group"
            >
              <span>Twitter</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-violet-400 hidden sm:inline-block shrink-0" />
            </a>
            <a 
              href="https://discord.gg/buildonarc" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.02] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 text-gray-400 hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center gap-1 group"
            >
              <span>Discord</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-violet-400 hidden sm:inline-block shrink-0" />
            </a>
            <a 
              href="https://docs.arc.network/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.02] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 text-gray-400 hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center gap-1 group"
            >
              <span className="sm:hidden">Docs</span>
              <span className="hidden sm:inline">Documentation</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-violet-400 hidden sm:inline-block shrink-0" />
            </a>
            <a 
              href="https://github.com/Zaynsky12/unipay" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.02] hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 transition-all duration-300 text-gray-400 hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.15)] flex items-center gap-1 group"
            >
              <span>GitHub</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-violet-400 hidden sm:inline-block shrink-0" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.03] flex flex-col items-center justify-center gap-2 text-center">
          <p className="text-[11px] text-gray-600 font-medium tracking-widest uppercase">
            &copy; 2026 UniPay Protocol. Built natively on Arc Network.
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent mt-1" />
        </div>
      </footer>
    </div>
  );
}
