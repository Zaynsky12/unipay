"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Zap, ArrowRight, ShieldCheck, Globe, Fingerprint, Coins, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-0 pb-20 animate-fade-in overflow-hidden">
      
      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20">
        {/* Background Effects */}
        <div className="absolute top-0 -z-10 w-full h-full bg-[#030305]" />
        <div className="absolute top-1/4 -left-1/4 -z-10 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-1/4 -right-1/4 -z-10 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] opacity-50" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-sm font-bold text-cyan-400 mb-8 backdrop-blur-md animate-fade-in-down">
          <Zap className="w-4 h-4 fill-current" />
          Native Privacy on Arc Network
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-8 max-w-5xl animate-fade-in-up">
          THE FUTURE OF <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600">
            PRIVATE ASSETS
          </span>
        </h1>
        
        <p className="max-w-2xl text-xl text-gray-400 leading-relaxed mb-12 animate-fade-in-up delay-100 px-4">
          Morphic is a high-performance privacy layer for the Arc Network. Shield your USDC and EURC, transfer them with zero trace, and maintain absolute financial sovereignty.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto animate-fade-in-up delay-200">
          <Link 
            href="/dashboard" 
            className="group relative px-10 py-5 bg-white text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            Launch Morphic App
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#how-it-works" 
            className="px-10 py-5 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-xl"
          >
            How it works
          </a>
        </div>

        {/* Hero Image Mockup */}
        <div className="mt-20 relative w-full max-w-5xl aspect-video rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-fade-in-up delay-300">
          <img 
            src="/morphic_vault_hero_1777834223698.png" 
            alt="Morphic Vault" 
            className="w-full h-full object-cover grayscale-[0.2] contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent" />
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="w-full max-w-6xl mx-auto px-6 py-32">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Three Steps to Freedom</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Our streamlined workflow ensures your assets are protected from end-to-end.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Deposit",
              desc: "Move your public USDC or EURC into the Morphic Vault. Our smart contracts break the public link to your wallet.",
              icon: Coins,
              color: "text-cyan-400",
              bg: "bg-cyan-500/10",
              border: "border-cyan-500/20"
            },
            {
              step: "02",
              title: "Private Send",
              desc: "Transfer shielded assets to any recipient. The amount and address are encrypted with Zero-Knowledge proofs.",
              icon: Send,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20"
            },
            {
              step: "03",
              title: "Withdraw",
              desc: "Exit the vault into a fresh public wallet. Your assets emerge 'clean' without any traceable history.",
              icon: Unlock,
              color: "text-emerald-400",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20"
            }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 relative group hover:border-white/20 transition-all duration-500">
              <span className="absolute top-4 right-6 text-6xl font-black text-white/5 group-hover:text-white/10 transition-colors">{item.step}</span>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border", item.bg, item.border, item.color)}>
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Highlight ── */}
      <section className="w-full bg-white/[0.02] py-32 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs font-bold text-violet-400 mb-6 uppercase tracking-widest">
              Multi-Asset Support
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Privacy for both <br />
              <span className="text-cyan-400">USDC</span> and <span className="text-emerald-400">EURC</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Morphic is the first platform on Arc Network to support multiple stablecoins natively. Switch between assets with a single click and maintain a diversified private portfolio.
            </p>
            <div className="space-y-4">
              {[
                { text: "1:1 Backed assets in the vault", icon: CheckCircle2 },
                { text: "No slippage on shielding/unshielding", icon: CheckCircle2 },
                { text: "Universal Vault interface", icon: CheckCircle2 }
              ].map((point, i) => (
                <div key={i} className="flex items-center gap-3 text-white font-medium">
                  <point.icon className="w-5 h-5 text-emerald-400" />
                  {point.text}
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-[80px] -z-10" />
            <div className="glass-panel p-8 rounded-3xl border-white/10 shadow-2xl scale-105">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Asset Distribution</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[65%] bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                </div>
                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[35%] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Shielded USDC</p>
                  <p className="text-xl font-bold text-white">65%</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Shielded EURC</p>
                  <p className="text-xl font-bold text-white">35%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="pt-32 flex flex-col items-center text-center">
        <h2 className="text-5xl md:text-7xl font-black text-white mb-10 tracking-tighter">
          BECOME INVISIBLE.
        </h2>
        <Link 
          href="/dashboard" 
          className="group relative px-12 py-6 bg-white text-black font-black text-xl rounded-full hover:scale-110 transition-all flex items-center justify-center gap-3 overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]"
        >
          Enter the Platform
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </Link>
        <div className="mt-20 flex gap-8 text-gray-600 font-bold uppercase tracking-tighter text-sm">
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">Github</a>
        </div>
        <p className="mt-10 text-gray-700 text-xs font-medium uppercase tracking-[0.2em]">
          &copy; 2026 Morphic Privacy Protocol. Built on Arc Network.
        </p>
      </footer>

    </div>
  );
}

// Helper icons needed but missing from original import
function Send(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

function Unlock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  )
}
