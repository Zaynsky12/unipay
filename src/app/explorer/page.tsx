"use client";

import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Loader2
} from 'lucide-react';
import { useExplorer } from '@/lib/hooks/useExplorer';
import { formatUnits } from 'viem';

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { merchants, isLoading } = useExplorer(searchQuery);

  const totalRegisteredCount = merchants.length;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Protocol Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Merchant Explorer</h1>
          <p className="text-xs text-gray-500 mt-1">
            Browse and inspect verified commercial identities indexed by Goldsky Subgraph.
          </p>
        </div>

        <div className="glass-panel-sm px-4 py-2 flex items-center gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Search Index</p>
            <p className="text-sm font-black text-slate-900">{totalRegisteredCount} Profiles</p>
          </div>
          <div className="h-6 w-px bg-gray-100" />
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
            Goldsky Powered
          </span>
        </div>
      </div>

      {/* ── Search Module ── */}
      <div className="glass-panel p-4 sm:p-6 space-y-4">
        <label className="block text-xs font-bold text-gray-600">
          Query Commercial Data by Name
        </label>
        
        <div className="relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand name..."
            className="input-field py-3.5 pl-12 pr-4 text-sm font-sans"
          />
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
          {searchQuery ? 'Search Results' : 'Featured Platform Accounts'}
        </div>

        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-900 tracking-tight">Querying Goldsky Subgraph...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="p-8 text-center bg-black/30 rounded-2xl border border-gray-200">
            <p className="text-sm font-bold text-gray-500">No merchants found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {merchants.map((merchant: any, idx: number) => {
              const actualVol = merchant.totalReceived ? formatUnits(BigInt(merchant.totalReceived), 6) : '0';
              return (
                <div 
                  key={merchant.id || idx} 
                  className="card p-5 relative overflow-hidden group flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 group-hover:bg-violet-400 transition-colors" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge-violet text-[10px]">L1 Profile</span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {merchant.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-violet-300 transition-colors truncate">
                      {merchant.name || 'Unknown'}
                    </h3>
                    
                    <p className="text-xs text-gray-500 truncate mt-1 font-medium">
                      {merchant.metadata || 'No metadata'}
                    </p>

                    <p className="text-[10px] text-gray-600 font-mono truncate mt-3 bg-white p-1 rounded">
                      {merchant.id}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-gray-200 flex items-baseline justify-between">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Disclosed Vol</p>
                      <p className="text-xs font-black text-slate-900">${Number(actualVol).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Settles</p>
                      <p className="text-xs font-bold text-violet-400">{merchant.totalSessions} tx</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
