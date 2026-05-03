"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, Zap, ArrowRight, ShieldCheck, Globe, Fingerprint } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col gap-20 py-10 animate-fade-in">
      
      {/* ── Hero Section ── */}
      <section className="relative flex flex-col items-center text-center px-4 pt-16 md:pt-24 min-h-[70vh] flex justify-center">
        <div className="absolute top-0 -z-10 w-full h-[600px] bg-gradient-to-b from-cyan-500/15 via-transparent to-transparent opacity-60 blur-3xl" />
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-sm font-bold text-cyan-400 mb-8 animate-bounce-subtle">
          <Zap className="w-4 h-4 fill-current" />
          Built on Arc
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
          Invisible Finance on <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Arc Network
          </span>
        </h1>
        
        <p className="max-w-2xl text-lg text-gray-400 leading-relaxed mb-10">
          Morphic is the premier privacy platform on Arc Network, enabling fully confidential assets and shielded transfers through advanced Zero-Knowledge technology.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            href="/dashboard" 
            className="group relative px-8 py-4 bg-cyan-500 text-black font-bold rounded-2xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            Launch Morphic App
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#features" 
            className="px-8 py-4 bg-white/5 text-white font-bold rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
          >
            How it works
          </a>
        </div>
      </section>

      {/* ── Feature Cards (Vertical Stack) ── */}
      <section id="features" className="w-full max-w-4xl mx-auto px-6 py-16 flex flex-col gap-6">
        
        {/* Shielded Assets */}
        <div className="glass-panel p-8 md:p-10 group hover:border-cyan-500/30 transition-all duration-300 bg-white/5 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Shielded Assets</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Break the link between your public identity and your on-chain assets. Convert public tokens into private shielded assets instantly.
            </p>
          </div>
        </div>

        {/* ZK-Transfers */}
        <div className="glass-panel p-8 md:p-10 group hover:border-blue-500/30 transition-all duration-300 bg-white/5 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-400 group-hover:scale-110 transition-transform">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">ZK-Transfers</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              Send assets privately to any address without revealing the sender, receiver, or amount on the public ledger.
            </p>
          </div>
        </div>

        {/* Selective Disclosure */}
        <div className="glass-panel p-8 md:p-10 group hover:border-violet-500/30 transition-all duration-300 bg-white/5 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400 group-hover:scale-110 transition-transform">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Selective Disclosure</h3>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              You own your data. Use viewing keys to selectively share transaction history with auditors or for compliance needs.
            </p>
          </div>
        </div>

      </section>

      {/* ── Stats / Trust ── */}
      <section className="glass-panel mx-4 p-10 flex flex-col md:flex-row items-center justify-around gap-10 text-center">
        <div>
          <p className="text-3xl font-bold text-white">0%</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Leakage Rate</p>
        </div>
        <div className="w-px h-10 bg-white/5 hidden md:block" />
        <div>
          <p className="text-3xl font-bold text-white">Arc</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Native Network</p>
        </div>
        <div className="w-px h-10 bg-white/5 hidden md:block" />
        <div>
          <p className="text-3xl font-bold text-white">ZK-STARK</p>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Proof Technology</p>
        </div>
      </section>

      {/* ── Footer Link ── */}
      <footer className="flex flex-col items-center pb-20">
        <p className="text-gray-500 text-sm mb-6 italic">Ready to take back your financial privacy?</p>
        <Link 
          href="/dashboard" 
          className="px-10 py-5 rounded-full border border-white/10 hover:border-cyan-500/40 text-white font-bold transition-all bg-white/5 backdrop-blur-xl"
        >
          Enter the Platform
        </Link>
      </footer>

    </div>
  );
}
