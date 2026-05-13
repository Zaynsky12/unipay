"use client";

import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  History as HistoryIcon, 
  ExternalLink, 
  Search, 
  Layers, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowUpRight,
  Coins,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');

  // Membaca identitas pedagang aktif
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { history, isLoading: isLoadingLogs, error } = useMerchantHistory(address);

  // Parse logs from Goldsky history
  const logs = history?.payments || [];

  const filteredLogs = logs.filter((l: any) => 
    (l.sessionId && l.sessionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (l.payer && l.payer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isConnected) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 animate-fade-in shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
        <HistoryIcon className="w-10 h-10 text-violet-400 mx-auto mb-4 relative z-10 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2 relative z-10 tracking-tight">Audit Trail Locked</h2>
        <p className="text-xs text-gray-400 mb-6 relative z-10 leading-relaxed max-w-xs mx-auto">
          Please connect your Web3 wallet provider to load immutable public order event archives associated with your credentials.
        </p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-violet-300 font-medium relative z-10">
          <span>Connect via the top right navbar button</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              Goldsky Subgraph
            </span>
            <span className="text-xs text-emerald-500 font-medium">• Indexed in Real-Time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Decentralized Audit Archives</h1>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            disabled={isLoadingLogs}
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-xs text-white font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>{isLoadingLogs ? 'Indexing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Panel Pencarian & Status ── */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Session ID or Payer..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-violet-500/50 transition-all font-mono placeholder:font-sans"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-violet-400" />
              <span>Showing: <strong className="text-white font-bold">{filteredLogs.length}</strong> dispatches</span>
            </span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-[11px] bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span>Layer: <code className="text-violet-300 font-mono">Subgraph API</code></span>
            </span>
          </div>

        </div>
      </div>

      {/* ── Area Tabel Arsip ── */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        {isLoadingLogs ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white tracking-tight">Querying Goldsky Subgraph...</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Scanning protocol history indexed on the graph network.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-400">No finalized settlement receipts indexed yet.</p>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
              Dispatches settled natively on the Arc Testnet via your universal checkout links will fully merge here immediately upon L1 fulfillment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <th className="pb-3.5 font-bold px-2">Session Spec</th>
                  <th className="pb-3.5 font-bold px-2">Payer Identity</th>
                  <th className="pb-3.5 font-bold px-2">Settlement Vol</th>
                  <th className="pb-3.5 font-bold px-2">Timestamp</th>
                  <th className="pb-3.5 font-bold text-right px-2">Verification Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                {filteredLogs.map((item: any, idx: number) => {
                  const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                  const timestampMs = Number(item.timestamp) * 1000;

                  return (
                    <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                      
                      <td className="py-4 px-2 font-mono text-violet-300 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none" title={item.sessionId || 'Unknown'}>
                            {item.sessionId ? `${item.sessionId.slice(0, 10)}...${item.sessionId.slice(-6)}` : 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-2 font-mono text-gray-400">
                        <span className="bg-white/[0.02] group-hover:bg-white/[0.05] px-2 py-0.5 rounded border border-white/5 transition-all">
                          {item.payer ? `${item.payer.slice(0, 8)}...${item.payer.slice(-4)}` : 'Unknown'}
                        </span>
                      </td>

                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1 font-bold text-white">
                          <Coins className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-sm tracking-tight">${formattedAmount}</span>
                          <span className="text-[10px] text-gray-500 font-normal">USDC</span>
                        </div>
                      </td>

                      <td className="py-4 px-2 text-gray-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-gray-300 font-medium">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="text-[10px] text-emerald-500 font-mono pl-4">
                            Goldsky Verified
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-2 text-right">
                        <a 
                          href={`https://testnet.arcscan.app/tx/${item.id}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.02] group-hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                        >
                          <span>ArcScan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
