"use client";

import React, { useState } from 'react';
import { Key, Activity, Eye, EyeOff, ShieldCheck, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ComplianceHubPage() {
  const [activeTab, setActiveTab] = useState<'key' | 'network'>('key');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="glass-panel w-full p-4 mt-8 flex flex-col gap-4 shadow-2xl shadow-black/50">
      {/* Header Tabs */}
      <div className="flex bg-black/40 rounded-[20px] p-1 border border-white/5">
        <button
          onClick={() => setActiveTab('key')}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-[16px] transition-all flex items-center justify-center gap-2",
            activeTab === 'key' 
              ? "bg-white/10 text-white shadow-sm border border-white/5" 
              : "text-gray-500 hover:text-white"
          )}
        >
          <Key className="w-4 h-4" />
          View Key
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-[16px] transition-all flex items-center justify-center gap-2",
            activeTab === 'network' 
              ? "bg-white/10 text-white shadow-sm border border-white/5" 
              : "text-gray-500 hover:text-white"
          )}
        >
          <Activity className="w-4 h-4" />
          Network
        </button>
      </div>

      {activeTab === 'key' ? (
        <div className="flex flex-col gap-4 mt-2">
          <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5">
            <h3 className="text-white font-bold mb-2">View Key Manager</h3>
            <p className="text-sm font-medium text-gray-400 leading-relaxed">
              Share this key with third-party auditors to allow them to view your transaction history without giving them spending power.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
            <label className="text-xs font-bold text-gray-500 mb-2 block px-1">Your View Key</label>
            <div className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-[20px] border border-white/5">
              <span className="font-mono text-sm font-bold text-white overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                {showKey ? 'vk_arc1qxyz89jsdklf20934kasd9234lkjsdf90234kasdf' : 'vk_arc1••••••••••••••••••••••••••••••••••••••••'}
              </span>
              <button 
                onClick={() => setShowKey(!showKey)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl border border-white/5"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button className="w-full py-4 rounded-[20px] font-bold text-lg bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all flex items-center justify-center gap-2 mt-2">
            <Download className="w-5 h-5" />
            Export Audit Report
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="text-xs font-bold text-gray-500 mb-1">Status</div>
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Operational
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="text-xs font-bold text-gray-500 mb-1">Gas Price</div>
              <div className="text-white font-mono font-bold text-sm">1.2 Gwei</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="text-xs font-bold text-gray-500 mb-1">Block Height</div>
              <div className="text-white font-mono font-bold text-sm">14,205,930</div>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
              <div className="text-xs font-bold text-gray-500 mb-1">Shielded Txs</div>
              <div className="text-white font-mono font-bold text-sm">2,105,442</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 p-4 mt-2 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-sm font-bold text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
            End-to-End Encryption Active
          </div>
        </div>
      )}
    </div>
  );
}
