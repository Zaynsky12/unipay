"use client";

import React, { useState } from 'react';
import { 
  Globe, 
  Search, 
  Loader2,
  Building2,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Users,
  AlertCircle
} from 'lucide-react';
import { useExplorer } from '@/lib/hooks/useExplorer';
import { formatUnits } from 'viem';

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { merchants, isLoading } = useExplorer(searchQuery);

  const totalRegisteredCount = merchants.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in pb-24 font-sans relative">
      
      {/* Background Glows */}
      <div className="fixed top-20 -left-1/4 w-[600px] h-[600px] bg-[#fc5000]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Header Premium ── */}
      <div className="mb-8 sm:mb-12 relative z-10">
        <div className="flex flex-row items-center justify-between gap-3 sm:gap-6">
          <div className="space-y-1 sm:space-y-3 text-left">
            <h1 className="text-2xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fc5000] to-[#ff8040]">Merchants</span>
            </h1>
            <p className="hidden sm:block text-sm text-gray-500 font-medium max-w-xl leading-relaxed">
              Discover and interact with commercial identities powered by LumiPay protocol on the blockchain.
            </p>
          </div>

          {/* Stats Badge - Sejajar di mobile */}
          <div className="flex items-center gap-3 sm:gap-4 bg-white/80 backdrop-blur-md p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-gray-200/60 shadow-sm shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-violet-50 flex items-center justify-center border border-violet-100 shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 pr-1 sm:pr-0">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-black tracking-widest">Indexed Profiles</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">{totalRegisteredCount}</p>
            </div>
          </div>
        </div>
        <p className="sm:hidden text-[10px] text-gray-500 font-medium mt-3 leading-relaxed max-w-[250px]">
          Discover commercial identities powered by LumiPay on the blockchain.
        </p>
      </div>

      {/* ── Search Bar Modern ── */}
      <div className="relative z-10 mb-8 sm:mb-10 group max-w-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#fc5000]/20 to-violet-500/20 rounded-2xl sm:rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl sm:rounded-[2rem] p-1 sm:p-2 flex items-center shadow-lg transition-all focus-within:border-[#fc5000]/50 focus-within:ring-4 focus-within:ring-[#fc5000]/10">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands, names..."
            className="w-full bg-transparent border-none py-2.5 sm:py-3 pr-4 sm:pr-6 text-[11px] sm:text-sm font-bold text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
          <div className="hidden sm:flex shrink-0 pr-2">
            <span className="px-3 py-1.5 bg-gray-100 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-200">
              Goldsky Subgraph
            </span>
          </div>
        </div>
      </div>

      {/* ── Results Area ── */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1 sm:px-2">
          <h2 className="text-[10px] sm:text-xs font-black text-gray-800 uppercase tracking-widest">
            {searchQuery ? 'Search Results' : 'Registered Accounts'}
          </h2>
        </div>

        {isLoading ? (
          <div className="py-24 sm:py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 relative flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-[#fc5000] rounded-full border-t-transparent animate-spin" />
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-[#fc5000]" />
            </div>
            <p className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-widest animate-pulse">Syncing L1 Data...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="py-20 sm:py-24 text-center bg-white/50 backdrop-blur-sm rounded-2xl sm:rounded-[2.5rem] border border-gray-200 border-dashed mx-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">No Merchants Found</h3>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1.5 sm:mt-2">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
            {merchants.map((merchant: any, idx: number) => {
              const actualVol = merchant.totalReceived ? formatUnits(BigInt(merchant.totalReceived), 6) : '0';
              
              const isVerified = merchant.name && merchant.name !== 'Anonymous';
              const displayName = merchant.name || 'Anonymous';

              let logoUrl = null;
              let website = null;
              if (merchant.metadata && merchant.metadata.includes('{')) {
                try {
                  const metaObj = JSON.parse(merchant.metadata.substring(merchant.metadata.indexOf('{')));
                  logoUrl = metaObj.logo;
                  website = metaObj.website;
                } catch(e) {}
              }

              return (
                <div 
                  key={merchant.id || idx} 
                  className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-200/80 shadow-sm hover:shadow-[0_8px_30px_rgba(252,80,0,0.08)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col"
                >
                  {/* Top Orange Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-[#fc5000] to-[#ff8040] opacity-80 group-hover:opacity-100 transition-opacity" />

                  <div className="p-3 sm:p-6 flex-1 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[#fc5000]/30 transition-colors">
                          {logoUrl ? (
                            <img src={logoUrl} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                          )}
                        </div>
                        {merchant.active && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full" title="Active Account" />
                        )}
                      </div>
                      
                      {/* Badge Klasifikasi */}
                      {isVerified ? (
                        <span className="self-start px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5 shrink-0">
                          <ShieldCheck className="w-2 h-2 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Verified</span>
                        </span>
                      ) : (
                        <span className="self-start px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-md sm:rounded-lg text-[7px] sm:text-[9px] font-black uppercase tracking-widest flex items-center gap-0.5 shrink-0">
                          <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3" /> <span className="hidden sm:inline">Unverified</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-[#fc5000] transition-colors line-clamp-1 mb-1">
                      {displayName}
                    </h3>
                    
                    {website && isVerified && (
                      <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-bold text-gray-500 hover:text-[#fc5000] uppercase tracking-widest transition-colors w-fit line-clamp-1">
                        {website.replace('https://','').replace('http://','')} <ExternalLink className="w-2 h-2 shrink-0 hidden sm:block" />
                      </a>
                    )}

                    <div className="mt-auto pt-3 sm:pt-5">
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 border-t border-gray-100 pt-2 sm:pt-4">
                        <div>
                          <p className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vol</p>
                          <p className="text-[10px] sm:text-sm font-black text-slate-900 flex items-center gap-0.5 sm:gap-1 line-clamp-1">
                            <span className="text-[#fc5000]">$</span>
                            {Number(actualVol).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </div>
                        <div className="text-right sm:text-left">
                          <p className="text-[7px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tx</p>
                          <p className="text-[10px] sm:text-sm font-black text-slate-900 flex items-center justify-end sm:justify-start gap-0.5 sm:gap-1 line-clamp-1">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-emerald-500" />
                            {merchant.totalSessions}
                          </p>
                        </div>
                      </div>
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
