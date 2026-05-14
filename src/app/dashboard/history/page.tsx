"use client";

import React, { useState, useEffect } from 'react';
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
  Loader2,
  Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [createdSessions, setCreatedSessions] = useState<any[]>([]);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string | null>(null);

  // Membaca parameter URL kueri '?filter=ID' saat halaman pertama kali dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterSession = params.get('filter');
      if (filterSession) {
        setSelectedSessionFilter(filterSession);
      }
    }
  }, []);

  // Sinkronisasi daftar sesi yang aktif (non-deleted) milik merchant dari localStorage
  useEffect(() => {
    if (address) {
      try {
        // 1. Baca ID sesi yang telah dihapus
        const deletedKey = `unipay_deleted_sessions`;
        const existingDeleted = localStorage.getItem(deletedKey);
        const deletedSet = existingDeleted ? new Set(JSON.parse(existingDeleted)) : new Set();

        // 2. Baca seluruh sesi dari penyimpanan
        const storageKey = `unipay_sessions_${address.toLowerCase()}`;
        const existing = localStorage.getItem(storageKey);
        if (existing) {
          const allSessions = JSON.parse(existing);
          // 3. Filter keluar sesi yang memiliki tanda isDeleted atau terdaftar di set penghapusan
          const activeOnly = allSessions.filter((s: any) => {
            if (s.isDeleted) return false;
            if (deletedSet.has(s.id || s.sessionId)) return false;
            return true;
          });
          setCreatedSessions(activeOnly);
        }
      } catch (e) {}
    }
  }, [address]);

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

  // Filter log akhir berdasarkan pencarian teks ATAU tab filter sesi spesifik
  const filteredLogs = logs.filter((l: any) => {
    const matchesSearch = (l.sessionId && l.sessionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (l.payer && l.payer.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedSessionFilter) {
      const matchesSession = l.sessionId && (
        l.sessionId.toLowerCase() === selectedSessionFilter.toLowerCase() ||
        l.sessionId.toLowerCase().includes(selectedSessionFilter.toLowerCase()) ||
        selectedSessionFilter.toLowerCase().includes(l.sessionId.toLowerCase())
      );
      return matchesSearch && matchesSession;
    }

    return matchesSearch;
  });

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
      
      {/* ── Header Premium bergaya Vercel/Stripe ── */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/5">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Transactions
        </h1>

        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={() => alert("Outgoing multichain settlement records are synced directly into your target recipient address.")}
            className="text-[11px] text-violet-400 hover:text-violet-300 font-medium underline transition-colors hidden sm:inline"
          >
            Looking for outgoing transactions?
          </button>

          <button 
            onClick={() => {}}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Filter options"
          >
            <Filter className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`p-1.5 transition-colors ${showSearchInput || searchQuery ? 'text-violet-400' : 'text-gray-400 hover:text-white'}`}
            title="Search transactions"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toggleable Inline Search Input */}
      {(showSearchInput || searchQuery) && (
        <div className="animate-fade-in pt-1">
          <div className="relative max-w-md ml-auto">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Session ID or Payer..."
              className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs text-white outline-none focus:border-violet-500/50 transition-all font-mono placeholder:font-sans"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Area Tabel Arsip ── */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-[#0A0A0F]">
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        {isLoadingLogs ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white tracking-tight">Querying Transactions...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-24 text-center space-y-3 bg-[#0D0D11] rounded-3xl border border-white/[0.02]">
            {/* Premium 3D Metallic Chain Link representation exactly like screenshot */}
            <div className="relative w-20 h-20 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 bg-violet-600/15 rounded-full blur-xl animate-pulse" />
              <LinkIcon className="w-12 h-12 text-violet-500 drop-shadow-[0_10px_15px_rgba(124,58,237,0.6)] transform -rotate-45 relative z-10 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">Transactions</h3>
            <p className="text-xs text-gray-500">No transactions found.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* View 1: Master Grid Tautan Pembayaran (Muncul jika belum ada tautan yang diklik) */}
            {false ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Select Payment Endpoint to View Buyers
                  </span>
                  <span className="text-[10px] text-violet-400 font-mono bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5">
                    {createdSessions.length} Endpoints Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {createdSessions.map((cs: any, idx: number) => {
                    const actualId = cs.id || cs.sessionId;
                    const amtFormatted = cs.amount ? formatUnits(BigInt(cs.amount), 6) : '0.00';
                    const title = cs.description || cs.token || `Payment Endpoint #${idx + 1}`;
                    
                    // Hitung jumlah riwayat pembeli yang terikat pada tautan ini
                    const linkLogs = logs.filter((l: any) => 
                      l.sessionId && actualId && (
                        l.sessionId.toLowerCase() === actualId.toLowerCase() ||
                        l.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                        actualId.toLowerCase().includes(l.sessionId.toLowerCase())
                      )
                    );

                    return (
                      <div 
                        key={actualId || idx}
                        onClick={() => setSelectedSessionFilter(actualId)}
                        className="p-5 rounded-3xl bg-gradient-to-b from-white/[0.03] to-black/40 border border-white/5 hover:border-violet-500/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 group cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]"
                      >
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-violet-600/30 group-hover:bg-violet-600 transition-colors" />

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-2xl font-black text-white tracking-tight font-mono">
                              ${amtFormatted}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[9px] font-bold text-violet-400 uppercase tracking-widest border border-white/5">
                              {cs.token || 'USDC'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-300 truncate font-bold">
                            {title}
                          </p>
                          <span className="text-[10px] text-gray-500 font-mono block truncate">
                            ID: {actualId ? `${actualId.slice(0, 8)}...${actualId.slice(-6)}` : 'N/A'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {linkLogs.length} Buyer{linkLogs.length === 1 ? '' : 's'} Settled
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:text-violet-300 transition-colors">
                            <span>View Buyers</span>
                            <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Seksi Transaksi Log Eksternal/Lainnya jika ada yang tidak terikat pada link lokal */}
                {logs.length > 0 && (
                  <div className="pt-6 border-t border-white/[0.04] space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        All Raw Universal Audit Dispatches
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {filteredLogs.length} matches indexed
                      </span>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                            <th className="pb-3.5 font-bold px-3">Session Spec</th>
                            <th className="pb-3.5 font-bold px-3">Payer Identity</th>
                            <th className="pb-3.5 font-bold px-3">Settlement Vol</th>
                            <th className="pb-3.5 font-bold px-3">Timestamp</th>
                            <th className="pb-3.5 font-bold text-right px-3">Verification Registry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                          {filteredLogs.map((item: any, idx: number) => {
                            const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                            const timestampMs = Number(item.timestamp) * 1000;
                            return (
                              <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="py-4 px-3 font-mono text-violet-300 font-semibold">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{item.sessionId ? `${item.sessionId.slice(0, 10)}...${item.sessionId.slice(-6)}` : 'N/A'}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3 font-mono text-gray-400">
                                  <span className="bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/5">{item.payer ? `${item.payer.slice(0, 8)}...${item.payer.slice(-4)}` : 'Unknown'}</span>
                                </td>
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-1.5 font-bold text-white">
                                    <Coins className="w-4 h-4 text-violet-400" /><span className="text-sm">${formattedAmount}</span><span className="text-[10px] text-gray-500 font-normal">USDC</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-gray-400">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium"><Calendar className="w-3.5 h-3.5 text-gray-500" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    <div className="text-[10px] text-emerald-500 font-mono pl-5">Goldsky Verified</div>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/5"><span>ArcScan</span><ExternalLink className="w-3.5 h-3.5" /></a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden space-y-3">
                      {filteredLogs.map((item: any, idx: number) => {
                        const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                        const timestampMs = Number(item.timestamp) * 1000;
                        return (
                          <div key={item.id || idx} className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-black/30 border border-white/5 space-y-3">
                            <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2.5">
                              <div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Settlement Amount</span><div className="flex items-center gap-1 text-base font-black text-white mt-0.5"><span>${formattedAmount}</span><span className="text-[10px] font-bold text-violet-400">USDC</span></div></div>
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Settled</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]"><span>Session:</span><span className="text-violet-300 font-semibold truncate max-w-[150px]">{item.sessionId ? `${item.sessionId.slice(0, 6)}...${item.sessionId.slice(-4)}` : 'N/A'}</span></div>
                              <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]"><span>Payer:</span><span className="text-gray-300">{item.payer ? `${item.payer.slice(0, 6)}...${item.payer.slice(-4)}` : 'Unknown'}</span></div>
                            </div>
                            <div className="pt-2 border-t border-white/[0.03] flex justify-between items-center text-[11px]">
                              <div className="flex items-center gap-1 text-gray-500"><Calendar className="w-3 h-3" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                              <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-violet-400 font-bold bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5"><span>ArcScan</span><ExternalLink className="w-2.5 h-2.5" /></a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* View 2: Tampilan Spesifik Riwayat Pembeli pada Sesi Terpilih */
              <div className="space-y-4 animate-fade-in">
                {selectedSessionFilter && (() => {
                  const matchedSession = createdSessions.find((cs: any) => 
                    cs.id && selectedSessionFilter && (
                      cs.id.toLowerCase() === selectedSessionFilter.toLowerCase() ||
                      cs.sessionId?.toLowerCase() === selectedSessionFilter.toLowerCase() ||
                      cs.id.toLowerCase().includes(selectedSessionFilter.toLowerCase())
                    )
                  );
                  const title = matchedSession ? (matchedSession.description || matchedSession.token) : 'Selected Payment Link';
                  const amtFormatted = matchedSession?.amount ? formatUnits(BigInt(matchedSession.amount), 6) : null;

                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-600/10 to-transparent p-4 sm:p-5 rounded-2xl border border-violet-500/20 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-violet-500" />
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedSessionFilter(null)}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/5"
                          title="Back to all endpoints grid"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Isolating Buyers For Endpoint</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <h3 className="text-base font-bold text-white truncate max-w-[180px] sm:max-w-md">
                              {title}
                            </h3>
                            {amtFormatted && (
                              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                ${amtFormatted}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto text-xs">
                        <span className="text-gray-400">
                          Total Buyers: <strong className="text-white font-bold">{filteredLogs.length}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedSessionFilter(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-[11px] text-violet-300 font-semibold transition-all"
                        >
                          Show All Grid
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Tampilan Desktop (Tabel Elegan) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                        <th className="pb-3.5 font-bold px-3">Session Spec</th>
                        <th className="pb-3.5 font-bold px-3">Payer Identity</th>
                        <th className="pb-3.5 font-bold px-3">Settlement Vol</th>
                        <th className="pb-3.5 font-bold px-3">Timestamp</th>
                        <th className="pb-3.5 font-bold text-right px-3">Verification Registry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                      {filteredLogs.map((item: any, idx: number) => {
                        const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                        const timestampMs = Number(item.timestamp) * 1000;

                        return (
                          <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-3 font-mono text-violet-300 font-semibold">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[150px]">{item.sessionId ? `${item.sessionId.slice(0, 10)}...${item.sessionId.slice(-6)}` : 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-mono text-gray-400">
                              <span className="bg-white/[0.02] px-2.5 py-1 rounded-lg border border-white/5">{item.payer ? `${item.payer.slice(0, 8)}...${item.payer.slice(-4)}` : 'Unknown'}</span>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-1.5 font-bold text-white">
                                <Coins className="w-4 h-4 text-violet-400" /><span className="text-sm">${formattedAmount}</span><span className="text-[10px] text-gray-500 font-normal">USDC</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-gray-400">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium"><Calendar className="w-3.5 h-3.5 text-gray-500" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                <div className="text-[10px] text-emerald-500 font-mono pl-5">Goldsky Verified</div>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.02] px-3 py-1.5 rounded-xl border border-white/5"><span>ArcScan</span><ExternalLink className="w-3.5 h-3.5" /></a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Tampilan Mobile (Daftar Kartu) */}
                <div className="md:hidden space-y-3">
                  {filteredLogs.map((item: any, idx: number) => {
                    const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                    const timestampMs = Number(item.timestamp) * 1000;

                    return (
                      <div key={item.id || idx} className="p-4 rounded-2xl bg-gradient-to-b from-white/[0.03] to-black/30 border border-white/5 space-y-3">
                        <div className="flex justify-between items-start gap-2 border-b border-white/5 pb-2.5">
                          <div><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Settlement Amount</span><div className="flex items-center gap-1 text-base font-black text-white mt-0.5"><span>${formattedAmount}</span><span className="text-[10px] font-bold text-violet-400">USDC</span></div></div>
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Settled</span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]"><span>Session:</span><span className="text-violet-300 font-semibold truncate max-w-[150px]">{item.sessionId ? `${item.sessionId.slice(0, 6)}...${item.sessionId.slice(-4)}` : 'N/A'}</span></div>
                          <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]"><span>Payer:</span><span className="text-gray-300">{item.payer ? `${item.payer.slice(0, 6)}...${item.payer.slice(-4)}` : 'Unknown'}</span></div>
                        </div>
                        <div className="pt-2 border-t border-white/[0.03] flex justify-between items-center text-[11px]">
                          <div className="flex items-center gap-1 text-gray-500"><Calendar className="w-3 h-3" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                          <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-violet-400 font-bold bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5"><span>ArcScan</span><ExternalLink className="w-2.5 h-2.5" /></a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
