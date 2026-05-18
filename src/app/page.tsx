"use client";

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Eye,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Activity,
  Shield,
  Puzzle,
  Sparkles,
  Store
} from 'lucide-react';
import { useProtocolStats } from '@/lib/hooks/useProtocolStats';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const { open } = useAppKit();
  const { stats, isLoading } = useProtocolStats();
  const { totalMerchants, totalVolume, totalTransactions } = stats;

  const formattedVolume = totalVolume.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div className="flex flex-col gap-0 pb-24 animate-fade-in overflow-hidden">

      {/* ── Hero Section ── */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="relative min-h-[92vh] flex flex-col items-center justify-center text-center px-4 pt-32 md:pt-20"
      >
        {/* Background blocks */}
        <div className="absolute top-0 -z-10 w-full h-full bg-gray-50" />
        {/* Top purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[700px] h-[500px] bg-[#6836e8]/10 rounded-full blur-[140px] pointer-events-none" />
        {/* Orange bottom-right accent */}
        <div className="absolute bottom-0 right-0 -z-10 w-[400px] h-[400px] bg-[#fc5000]/6 rounded-full blur-[120px] pointer-events-none" />

        {/* Chip badge — Caldera style orange */}
        <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#fc5000]/10 border border-[#fc5000]/25 text-[10px] sm:text-xs font-black text-[#fc5000] mb-8 backdrop-blur-md animate-fade-in-down uppercase tracking-wider max-w-[90vw] text-center leading-snug">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
          <span>Payment Protocol Built on Arc Network</span>
        </div>

        {/* H1 — chunky display */}
        <h1
          className="text-5xl sm:text-7xl md:text-8xl text-slate-900 tracking-tight leading-none mb-8 max-w-5xl animate-fade-in-up uppercase"
          style={{ fontFamily: 'var(--font-dm-sans)', fontWeight: 900, letterSpacing: '-0.02em' }}
        >
          Accept USDC from<br />
          <span className="gradient-text-orange">any chain.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed mb-4 animate-fade-in-up px-2"
          style={{ animationDelay: '0.1s', fontWeight: 500 }}
        >
          Settle in{' '}
          <span className="text-slate-900 font-black">&lt; 1 second.</span>
        </p>
        <p
          className="max-w-xl text-sm text-gray-500 leading-relaxed mb-12 animate-fade-in-up px-2"
          style={{ animationDelay: '0.15s' }}
        >
          UniPay is the decentralized Stripe of Web3. Intercept multi-chain stablecoin settlements directly into your self-custodial wallet. Real-time on-chain indexing for absolute transparency.
        </p>

        {/* CTA Buttons — pill shape */}
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Link
            href="/dashboard"
            className="group btn-orange px-8 py-4 text-white font-black text-sm flex items-center justify-center gap-3 hover:gap-4 transition-all"
          >
            <span>Launch Merchant App</span>
            <ArrowRight className="w-5 h-5 transition-all" />
          </Link>
          <a
            href="https://docs.arc.network/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-slate-700 hover:text-slate-900 font-bold text-sm flex items-center justify-center rounded-full transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto"
          >
            Documentation
          </a>
        </div>

      </motion.section>

      {/* Premium Stats Ticker Belt (Perfect 3D transition between sections) */}
      <div className="w-full overflow-hidden bg-gray-50/90 backdrop-blur-md border-y border-gray-200/80 py-5 sm:py-6 shadow-[0_4px_30px_rgba(0,0,0,0.02)] z-20 pointer-events-auto relative mt-16 sm:mt-24">
        {/* Gradient fade on edges for smooth scrolling effect */}
        <div className="absolute top-0 left-0 bottom-0 w-16 sm:w-40 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 bottom-0 w-16 sm:w-40 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee-quarter gap-4 sm:gap-6 py-2">
          {[
            { label: 'Active Merchants', value: isLoading ? '...' : totalMerchants.toString(), desc: 'Verified on-chain profiles', icon: Store },
            { label: 'Total Volume', value: isLoading ? '...' : `$${formattedVolume}`, desc: 'Across USDC & EURC', icon: Activity },
            { label: 'Global Transactions', value: isLoading ? '...' : totalTransactions.toString(), desc: 'Direct P2P settlements', icon: Zap },
            // Duplicate 2
            { label: 'Active Merchants', value: isLoading ? '...' : totalMerchants.toString(), desc: 'Verified on-chain profiles', icon: Store },
            { label: 'Total Volume', value: isLoading ? '...' : `$${formattedVolume}`, desc: 'Across USDC & EURC', icon: Activity },
            { label: 'Global Transactions', value: isLoading ? '...' : totalTransactions.toString(), desc: 'Direct P2P settlements', icon: Zap },
            // Duplicate 3
            { label: 'Active Merchants', value: isLoading ? '...' : totalMerchants.toString(), desc: 'Verified on-chain profiles', icon: Store },
            { label: 'Total Volume', value: isLoading ? '...' : `$${formattedVolume}`, desc: 'Across USDC & EURC', icon: Activity },
            { label: 'Global Transactions', value: isLoading ? '...' : totalTransactions.toString(), desc: 'Direct P2P settlements', icon: Zap },
            // Duplicate 4
            { label: 'Active Merchants', value: isLoading ? '...' : totalMerchants.toString(), desc: 'Verified on-chain profiles', icon: Store },
            { label: 'Total Volume', value: isLoading ? '...' : `$${formattedVolume}`, desc: 'Across USDC & EURC', icon: Activity },
            { label: 'Global Transactions', value: isLoading ? '...' : totalTransactions.toString(), desc: 'Direct P2P settlements', icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="caldera-card p-3.5 sm:p-5 flex flex-row items-center gap-3 sm:gap-4 hover:-translate-y-1 transition-transform relative overflow-hidden group w-[240px] sm:w-[320px] shrink-0 bg-white/80">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#fc5000]/5 rounded-full blur-[40px] group-hover:bg-[#fc5000]/10 transition-colors pointer-events-none" />
              
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#fc5000]/10 border border-[#fc5000]/20 flex items-center justify-center shrink-0 shadow-inner">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#fc5000]" />
              </div>
              
              <div className="flex-1 flex flex-col items-center text-center sm:pr-6">
                <div className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  {stat.value}
                </div>
                <div className="text-[9px] sm:text-[11px] font-bold text-[#fc5000] uppercase tracking-widest mt-1 mb-0.5">{stat.label}</div>
                <div className="text-[8px] sm:text-[10px] text-gray-500 font-medium leading-tight">{stat.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works Section ── */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        id="how-it-works" 
        className="w-full max-w-6xl mx-auto px-6 py-24 mt-4"
      >
        <div className="text-center mb-16">
          {/* Orange section tag */}
          <div className="inline-flex items-center gap-2 caldera-tag mb-4">
            <span>Protocol Mechanics</span>
          </div>
          <h2
            className="text-3xl md:text-5xl font-black text-slate-900 mb-5 uppercase tracking-tight"
            style={{ fontFamily: 'var(--font-dm-sans)' }}
          >
            Decentralized Checkout in <br className="block sm:hidden" /> <span className="gradient-text-orange">4 Phases</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed font-medium">
            Instantly accept cross-chain stablecoins inside any dynamic frontend architecture without handling raw keys.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden xl:block absolute top-[48px] left-[12%] right-[12%] h-[2px] bg-gray-200 z-0">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#fc5000] via-[#fc5000] to-transparent w-full opacity-30" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 relative z-10">
            {[
              {
                step: "1",
                title: "Merchant Identity",
                desc: "Establish a permanent business profile with your brand logo, website, and socials stored directly on the blockchain.",
              },
              {
                step: "2",
                title: "Stateless Routing",
                desc: "Payments are processed without centralized servers. Your revenue is settled directly to your self-custody wallet.",
              },
              {
                step: "3",
                title: "Unified Assets",
                desc: "Monitor and manage your USDC liquidity across Arc, Base, Arbitrum, and Optimism in one consolidated dashboard.",
              },
              {
                step: "4",
                title: "Developer Ready",
                desc: "Integrate custom checkout flows into your store with our upcoming SDK and webhook integration system.",
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                {/* Connecting line for mobile (vertical) */}
                {i !== 3 && (
                  <div className="md:hidden absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-[#fc5000]/30 to-transparent z-0" />
                )}

                <div className="caldera-card p-8 flex flex-col items-center text-center group hover-lift bg-white relative overflow-hidden h-full">
                  <div className="relative z-10 w-14 h-14 rounded-full bg-white border-2 border-[#fc5000]/40 flex items-center justify-center mb-6 transition-all duration-300 shadow-[0_0_15px_rgba(252,80,0,0.05)] group-hover:shadow-[0_0_20px_rgba(252,80,0,0.2)] group-hover:bg-[#fc5000]">
                    <span className="text-xl font-black text-[#fc5000] group-hover:text-white transition-colors font-mono">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-3 uppercase tracking-tight">{item.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium">{item.desc}</p>
                  
                  <div className="mt-6 pt-4 border-t border-gray-100 w-full flex justify-center items-center gap-2 text-[10px] text-gray-500 font-bold group-hover:border-[#fc5000]/20 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#fc5000]" />
                    Fully On-chain Verified
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Cross-Chain Architecture Section ── */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="w-full bg-[#FEF7ED] py-24 border-y border-gray-200 relative overflow-hidden"
      >
        {/* Background accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[200px] bg-[#fc5000]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-slate-900/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left: Text */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Orange section tag */}
            <div className="inline-flex items-center gap-2 caldera-tag">
              <Sparkles className="w-3 h-3" />
              Unified Liquidity Engine
            </div>

            <h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight uppercase tracking-tight"
              style={{ fontFamily: 'var(--font-dm-sans)' }}
            >
              Payers from any chain,<br className="hidden sm:block" />{' '}
              <span className="gradient-text-orange">Unified settlement.</span>
            </h2>

            <p className="text-gray-500 text-sm sm:text-base leading-relaxed font-medium">
              Powered by the{' '}
              <span className="text-slate-900 font-bold">Circle Arc App Kit</span>
              , UniPay identifies a user&apos;s USDC balance across arbitrary layer-2 networks and automatically bridges them instantly into the Arc Network for microsecond transaction checkout.
            </p>

            <div className="space-y-3 pt-2 w-full">
              {[
                "On-chain Merchant Profile (Logo, Website, Email)",
                "Consolidated Multi-Chain Asset Management",
                "Real-time Business Performance Analytics",
                "Direct On-chain Finality & SDK Ready",
              ].map((point, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 font-bold caldera-card-sm p-3.5"
                >
                  <ShieldCheck className="w-4 h-4 text-[#fc5000] shrink-0" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visualization */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-lg caldera-card p-6 sm:p-8 border-[#fc5000]/20 relative overflow-hidden">
              {/* Orange top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000] via-[#fc5000] to-transparent" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fc5000] animate-pulse" />
                  <span className="text-xs font-black text-slate-900 tracking-wider uppercase">Payment Routing State</span>
                </div>
                <span className="caldera-tag text-[10px] border-[#fc5000]/30 bg-[#fc5000]/10 text-[#fc5000]">
                  Arc Protocol Kit
                </span>
              </div>

              {/* Source */}
              <div className="mt-6 space-y-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Source Origin</span>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#111827] rounded-l-full" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-900 font-bold">Buyer Chain Instances</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['Arbitrum', 'Base', 'Ethereum'].map(c => (
                        <span key={c} className="px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-mono text-slate-900 font-bold border border-gray-200">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" /> Auto-bridging via Unified Balance
                  </div>
                </div>
              </div>

              {/* Bridge connector */}
              <div className="py-4 flex flex-col items-center justify-center relative">
                <div className="w-0.5 h-10 bg-gradient-to-b from-[#111827] via-gray-400 to-[#fc5000] relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#fc5000] animate-ping opacity-70" />
                </div>
                <div className="absolute bg-white border border-gray-200 px-3 py-1 rounded-full text-[9px] font-mono text-[#fc5000] font-bold tracking-widest shadow-lg uppercase">
                  Cross-Chain Intercept
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Target Execution Destination</span>
                <div className="p-4 rounded-2xl bg-white border border-gray-200 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#34D399] rounded-l-full" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-900 font-bold">Target Settlement L1</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#34D399]/10 text-[#34D399] font-mono text-xs font-black border border-[#34D399]/20">
                      Arc Network
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    <span>Smart Contract</span>
                    <code className="bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200 text-slate-900 font-mono font-bold">pay()</code>
                    <span>execution trigger</span>
                  </div>
                </div>
              </div>

              {/* Footer metric */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/60 p-3 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                  <Activity className="w-3.5 h-3.5 text-[#34D399]" />
                  <span>Finality validation speed</span>
                </div>
                <span className="text-xs font-mono font-black text-[#34D399] px-3 py-1 rounded-full bg-[#34D399]/10 border border-[#34D399]/20">
                  &lt; 1,000ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── CTA Bottom ── */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, margin: "-50px" }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="pt-28 flex flex-col items-center text-center px-4"
      >
        {/* Orange decorative tag */}
        <div className="caldera-tag mb-6">Start Today</div>

        <h2
          className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 mb-5 uppercase tracking-tight max-w-3xl leading-none"
          style={{ fontFamily: 'var(--font-dm-sans)' }}
        >
          Accept Stateless{' '}
          <span className="gradient-text-orange">Stablecoins</span>
          {' '}Today.
        </h2>
        <p className="text-gray-500 max-w-md text-sm mb-10 leading-relaxed font-medium">
          Deploy native cryptographic commercial verification mapping straight into your Web3 application. Zero platform counterparty risks.
        </p>
        <Link
          href="/dashboard"
          className="btn-orange px-10 py-4 text-white font-black text-sm flex items-center gap-3 hover:gap-4 transition-all"
        >
          Access Merchant Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="w-full max-w-6xl mx-auto mt-32 pt-14 pb-10 border-t border-gray-200 px-6 relative z-10">
        {/* Footer subtle glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[100px] bg-gradient-to-r from-[#fc5000]/4 via-transparent to-[#fc5000]/4 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start justify-between">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-5 max-w-sm">
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-2xl bg-[#fc5000] flex items-center justify-center shadow-[0_0_18px_rgba(252,80,0,0.45)] group-hover:shadow-[0_0_24px_rgba(252,80,0,0.65)] transition-all">
                <Eye className="w-5 h-5 text-slate-900" fill="currentColor" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                Uni<span className="text-[#fc5000]">Pay</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 leading-relaxed font-medium px-4 md:px-0">
              Stateless stablecoin processing engine. Direct peer-to-peer liquidity finality optimized natively for sovereign Web3 applications.
            </p>
          </div>

          {/* Nav links — Caldera pill style */}
          <div className="w-full md:w-auto flex flex-wrap items-center justify-center md:justify-end gap-3 mt-4 md:mt-0">
            {[
              { label: 'Twitter', href: 'https://x.com/owsnpidc' },
              { label: 'Discord', href: 'https://discord.gg/buildonarc' },
              { label: 'GitHub', href: 'https://github.com/Zaynsky12/unipay' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm transition-all duration-300 text-gray-600 hover:text-slate-900 text-xs font-bold"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-gray-200 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold tracking-widest uppercase px-4 leading-relaxed">
            &copy; 2026 UniPay Protocol. Built natively on Arc Network.
          </p>
          <div className="w-16 h-1 bg-[#fc5000]/20 rounded-full mt-1" />
        </div>
      </footer>
    </div>
  );
}
