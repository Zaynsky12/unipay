"use client";

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { 
  Zap, 
  Send, 
  Bot, 
  LineChart, 
  TrendingUp, 
  Clock, 
  Users,
  MessageSquare,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function InsightsPage() {
  const { address, isConnected } = useAccount();
  const [query, setQuery] = useState('');

  const aiSuggestions = [
    "How was my sales performance this week?",
    "Identify my most loyal customer addresses.",
    "Predict next week's volume based on current trends.",
    "Which paylink has the highest conversion rate?"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-[#fc5000]/10 border border-[#fc5000]/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-[#fc5000]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase" style={{ fontFamily: 'var(--font-dm-sans)' }}>AI Sales Assistant</h1>
        </div>
        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Intelligent On-chain Commerce Analytics</p>
      </div>

      {/* ── CONNECTION ALERT BANNER ── */}
      {!isConnected && (
        <div className="p-6 rounded-[2rem] bg-[#fc5000]/6 border border-[#fc5000]/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#fc5000]/12 border border-[#fc5000]/25 flex items-center justify-center text-[#fc5000] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">AI Agent Offline</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-sm">
                Please connect your identity to allow the UniPay AI Agent to index and analyze your commercial transaction history.
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

      {/* ── AI INSIGHTS CARDS (Simulated) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-[2rem] bg-white border border-gray-200 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Growth Prediction</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">Sales expected to rise by 12% next week.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] bg-white border border-gray-200 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Loyalty Insight</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">3 new repeat buyers detected today.</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] bg-white border border-gray-200 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Peak Activity</p>
            <p className="text-sm font-bold text-slate-900 leading-tight">Buyers are most active at 7:00 PM UTC.</p>
          </div>
        </div>
      </div>

      {/* ── CHAT INTERFACE ── */}
      <div className="caldera-card rounded-[2.5rem] overflow-hidden flex flex-col h-[400px] shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000]/40 via-[#fc5000]/30 to-transparent" />
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-[#fc5000]/10 border border-[#fc5000]/20 flex items-center justify-center text-[#fc5000] animate-bounce">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Ask your Sales Assistant</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
              Query your on-chain commerce data using natural language powered by Arc AI Agents.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-200 relative z-10">
          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            {aiSuggestions.map((text, i) => (
              <button 
                key={i}
                onClick={() => setQuery(text)}
                className="text-[9px] font-black uppercase tracking-tighter bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5 text-gray-500 hover:text-[#fc5000] transition-all"
              >
                {text}
              </button>
            ))}
          </div>
          
          <div className="relative group">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your question about your commerce data..."
              className="w-full bg-gray-50 border-[1.5px] border-gray-200 rounded-2xl py-4 pl-6 pr-14 text-sm text-slate-900 placeholder:text-gray-600 outline-none focus:border-[#fc5000]/50 focus:shadow-[0_0_0_3px_rgba(252,80,0,0.10)] transition-all"
              disabled={!isConnected}
            />
            <button 
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                query ? 'bg-[#fc5000] text-slate-900 shadow-[0_0_16px_rgba(252,80,0,0.35)]' : 'bg-gray-50 text-gray-600'
              } disabled:opacity-30`}
              disabled={!isConnected || !query}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
