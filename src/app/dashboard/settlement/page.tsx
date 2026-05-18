"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  RefreshCw, 
  Wallet, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  History,
  Info,
  Settings2,
  Lock,
  ArrowUpRight
} from 'lucide-react';

export default function SettlementPage() {
  const { address, isConnected } = useAccount();
  const [isAutoConsolidate, setIsAutoConsolidate] = useState(false);
  const [threshold, setThreshold] = useState('100');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Auto-Settlement</h1>
        <p className="text-[11px] text-gray-500 font-medium">
          Maximize liquidity by consolidating USDC across multiple chains into your Arc account.
        </p>
      </div>

      {/* ── CONNECTION ALERT BANNER (Only if not connected) ── */}
      {!isConnected && (
        <div className="p-6 rounded-3xl bg-[#fc5000]/6 border border-[#fc5000]/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in ">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#fc5000]/12 border border-[#fc5000]/25 flex items-center justify-center text-[#fc5000] shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manager Locked</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                Connect your Web3 identity to configure cross-chain consolidation routes and automated bridging parameters.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const kitBtn = document.querySelector('appkit-button');
              if (kitBtn) (kitBtn as any).click();
            }}
            className="btn-orange px-6 py-2.5 text-white text-xs font-black flex items-center gap-2 group whitespace-nowrap"
          >
            Connect Identity
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] space-y-8 relative overflow-hidden bg-[#0A0A0F]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#fc5000]/4 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#fc5000]/10 border border-[#fc5000]/20 flex items-center justify-center text-[#fc5000]">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Smart Bridge Consolidation</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Powered by Arc CCTP Engine</p>
                </div>
              </div>
              <button 
                onClick={() => isConnected && setIsAutoConsolidate(!isAutoConsolidate)}
                disabled={!isConnected}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                  isAutoConsolidate ? 'bg-[#fc5000]' : 'bg-gray-100'
                } ${!isConnected && 'opacity-20 cursor-not-allowed'}`}
              >
                <span
                  className={`${
                    isAutoConsolidate ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 shadow-lg`}
                />
              </button>
            </div>

            <div className="space-y-6 relative z-10 pt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Settings2 className="w-3.5 h-3.5" />
                    Consolidation Threshold
                  </label>
                  <span className="text-xs font-black text-slate-900">{threshold} USDC</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="1000" 
                  step="10"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  disabled={!isConnected}
                  className="w-full h-1.5 bg-gray-50 rounded-full appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 disabled:opacity-30 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[9px] font-bold text-gray-600 uppercase tracking-tighter">
                  <span>10 USDC</span>
                  <span>500 USDC</span>
                  <span>1000 USDC</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-tight">Auto-Fee Deduction Active</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Bridge fees will be automatically deducted from the bridged USDC amount. You do not need native gas (ETH) on other chains.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-[2rem] border border-gray-200 bg-[#0D0D11]">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Target Destination</h4>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#fc5000] flex items-center justify-center text-slate-900 shadow-lg">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Arc Network</p>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Main Settlement Chain</p>
                </div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-[2rem] border border-gray-200 bg-[#0D0D11]">
              <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Consolidation Cost</h4>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-sm font-black">$</span>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">~0.1% / tx</p>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Deducted from balance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Info & Status */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] bg-white/[0.01] border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-[#fc5000]" />
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">How it works</h4>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#fc5000]/15 text-[#fc5000] text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">System scans your USDC balances on Base, Arbitrum, and Polygon.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#fc5000]/15 text-[#fc5000] text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">If balance exceeds <span className="text-slate-900 font-bold">{threshold} USDC</span>, a cross-chain burn event is triggered.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#fc5000]/15 text-[#fc5000] text-[10px] font-black flex items-center justify-center shrink-0">3</div>
                <p className="text-[11px] text-gray-500 leading-relaxed">Tokens are minted directly on Arc Network minus the network fee.</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-[2rem] bg-gray-50 border border-white\/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System Status</h4>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Bridge Routes</span>
                <span className="text-slate-900 font-bold">12 Active</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Avg. Time</span>
                <span className="text-slate-900 font-bold">~45 Seconds</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500">Security Level</span>
                <span className="text-emerald-400 font-bold uppercase">Enterprise</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
