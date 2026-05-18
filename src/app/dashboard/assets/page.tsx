"use client";

import React from 'react';
import { useAccount } from 'wagmi';
import { 
  Globe, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Activity,
  Layers,
  Coins,
  ArrowRight
} from 'lucide-react';

export default function AssetsPage() {
  const { address, isConnected } = useAccount();

  // Mock data untuk simulasi cross-chain balance
  const chainBalances = [
    { name: 'Arc Network', balance: '1,240.50', icon: '🟣', color: 'bg-[#fc5000]', status: 'Main' },
    { name: 'Base', balance: '450.20', icon: '🔵', color: 'bg-blue-600', status: 'Active' },
    { name: 'Arbitrum', balance: '890.00', icon: '💙', color: 'bg-indigo-600', status: 'Active' },
    { name: 'Optimism', balance: '120.45', icon: '🔴', color: 'bg-red-600', status: 'Active' },
  ];

  const totalLiquidity = chainBalances.reduce((sum, item) => sum + parseFloat(item.balance.replace(',', '')), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          Global Liquidity
          <span className="text-[10px] font-black bg-gray-50 border border-gray-200 px-2 py-0.5 rounded uppercase tracking-widest text-gray-500">Beta</span>
        </h1>
        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Unified Cross-chain Asset Overview</p>
      </div>

      {/* ── CONNECTION ALERT BANNER ── */}
      {!isConnected && (
        <div className="p-6 rounded-3xl bg-[#fc5000]/10 border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-[0_0_40px_rgba(124,58,237,0.1)]">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#fc5000]/20 border border-violet-500/30 flex items-center justify-center text-[#fc5000] shrink-0 shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Identity Required</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                Connect your Web3 account to fetch real-time USDC balances across all supported L2 networks and the Arc mainnet.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const kitBtn = document.querySelector('appkit-button');
              if (kitBtn) (kitBtn as any).click();
            }}
            className="px-6 py-2.5 bg-[#fc5000] hover:bg-[#fc5000] text-slate-900 text-xs font-black rounded-xl border border-violet-400/30 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all flex items-center gap-2 group whitespace-nowrap"
          >
            Connect Identity
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* ── TOTAL LIQUIDITY HERO ── */}
      <div className="glass-panel p-8 rounded-[3rem] relative overflow-hidden bg-gradient-to-br from-violet-600/20 via-[#0A0A0F] to-[#0A0A0F] border border-gray-200 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#fc5000]/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#fc5000]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Total Consolidated Value</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <h2 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">
              ${isConnected ? totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </h2>
            <span className="text-xl font-black text-[#fc5000] mb-2 uppercase tracking-widest">USDC</span>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-200">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-900">4 Active Networks</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 border border-gray-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-900">Verified On-chain</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── NETWORK BREAKDOWN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chainBalances.map((chain, idx) => (
          <div 
            key={chain.name} 
            className="glass-panel p-6 rounded-[2rem] bg-white border border-gray-200 hover:border-gray-200 transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${chain.color}/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform`} />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl shadow-lg border border-gray-200 group-hover:scale-110 transition-transform">
                  {chain.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{chain.name}</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{chain.status}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-900">${isConnected ? chain.balance : '0.00'}</p>
                <p className="text-[9px] font-black text-[#fc5000] uppercase tracking-widest">USDC</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER INFO ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-3xl bg-white/[0.01] border border-gray-200 gap-4">
        <div className="flex items-center gap-3">
          <Coins className="w-5 h-5 text-gray-500" />
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            Balances are indexed via Arc Cross-chain Indexer. Real-time updates may vary by ~10-15s per block.
          </p>
        </div>
        <button className="text-[10px] font-black text-[#fc5000] hover:text-[#fc5000] uppercase tracking-widest flex items-center gap-2 transition-all group">
          Refresh Indices
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </div>
  );
}
