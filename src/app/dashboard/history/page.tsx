"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  History as HistoryIcon, 
  ExternalLink, 
  Search, 
  ArrowLeft,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Coins,
  Link as LinkIcon,
  Eye,
  ArrowRight,
  Loader2,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';
import { useCustomerHistory } from '@/lib/hooks/useCustomerHistory';
import { parseSessionDescription, getBadgeStyles } from '@/app/dashboard/page';
import { usePrivy } from '@privy-io/react-auth';
import { InlineAuth } from '@/components/dashboard/InlineAuth';

export default function HistoryPage() {
  const { login, authenticated, ready } = usePrivy();
  const { address, isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [viewMode, setViewMode] = useState<'merchant' | 'customer'>('merchant');

  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string | null>(null);
  const [selectedSessionName, setSelectedSessionName] = useState<string | null>(null);

  // Membaca parameter URL kueri '?filter=ID&name=NAME' saat halaman pertama kali dimuat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filterSession = params.get('filter');
      const filterName = params.get('name');
      if (filterSession) {
        setSelectedSessionFilter(filterSession);
        setSelectedSessionName(filterName ? decodeURIComponent(filterName) : null);
      }
    }
  }, []);

  // Membaca identitas pedagang aktif
  const { data: merchantData } = useReadContract({
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const { history: merchantHistory, isLoading: isLoadingMerchant, error } = useMerchantHistory(address);
  const { history: customerHistory, isLoading: isLoadingCustomer } = useCustomerHistory(address);

  const activeHistory = viewMode === 'merchant' ? merchantHistory : customerHistory;
  const isLoadingLogs = viewMode === 'merchant' ? isLoadingMerchant : isLoadingCustomer;

  // Sessions are now managed via the database (history hook)
  const createdSessions = merchantHistory?.sessions || [];

  // Parse logs from Goldsky history
  let regularPayments = [];
  let subPayments = [];

  if (viewMode === 'merchant') {
    regularPayments = activeHistory?.payments || [];
    subPayments = (activeHistory?.subscriptionPayments || []).map((sp: any) => {
      const relatedPlan = (activeHistory?.subscriptions || []).find((s: any) => s.id.toLowerCase() === sp.subId.toLowerCase());
      return {
        ...sp,
        sessionId: relatedPlan ? relatedPlan.sessionId : sp.subId,
        token: relatedPlan ? relatedPlan.token : "0x3600000000000000000000000000000000000000",
        payer: sp.subscriber
      };
    });
  } else {
    regularPayments = activeHistory?.transactions || [];
    subPayments = (activeHistory?.subscriptionPayments || []).map((sp: any) => {
      return {
        ...sp,
        sessionId: sp.subId,
        token: "0x3600000000000000000000000000000000000000",
        payer: sp.subscriber
      };
    });
  }
  
  const logs = [...regularPayments, ...subPayments].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

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

  if (!ready) return null;
  if (!authenticated && !isConnected) return (
    <div className="fixed inset-0 z-[100] bg-[#FEF7ED] flex items-center justify-center p-6 animate-fade-in overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#fc5000]/10 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/3 -right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="max-w-md w-full glass-panel p-10 rounded-[3rem] border border-gray-200 text-center relative z-10 shadow-xl shadow-gray-200">
        {/* Top Right Home Link (Close) inside the card */}
        <Link href="/" className="absolute top-5 right-5 p-2 text-gray-400 hover:text-slate-900 transition-colors z-[110] rounded-full hover:bg-gray-100" title="Back to Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Link>
        <div className="w-20 h-20 bg-[#fc5000]/20 rounded-[2rem] border border-gray-200 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-#fc5000/10 mt-4">
          <Eye className="w-10 h-10 text-[#fc5000]" />
        </div>
        
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
          Welcome to LumiPay Commerce
        </h2>
        
        <p className="text-[11px] text-gray-500 leading-relaxed mb-8 font-semibold uppercase tracking-wider">
          Decentralized Payment Checkout & Streaming Protocol
        </p>
        
        {/* Inline Login UI Trigger */}
        <InlineAuth />

      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header Premium ── */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200">
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb aktif saat ada filter */}
          {selectedSessionFilter ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setSelectedSessionFilter(null); setSelectedSessionName(null); }}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-600 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  All Transactions
                </button>
                <span className="text-gray-600 text-[10px]">/</span>
                <span className="text-[10px] font-bold text-[#fc5000] truncate max-w-[160px] sm:max-w-xs">
                  {selectedSessionName || `${selectedSessionFilter?.slice(0, 10)}...${selectedSessionFilter?.slice(-6)}`}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                {selectedSessionName || 'Payment History'}
                <span className="text-xs font-bold text-[#fc5000] bg-[#fc5000]/10 border border-gray-200 px-2.5 py-1 rounded-full">
                  Filtered
                </span>
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                Showing all buyers for this specific payment link
              </p>
            </>
          ) : (
            <div className="w-full">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                History Transaction
              </h1>
              <p className="text-[11px] text-gray-500 font-medium">
                {viewMode === 'merchant' ? 'Incoming settlements to your payment links' : 'Outgoing payments to other merchants'}
              </p>
              
              <div className="flex items-center gap-2 mt-4 bg-gray-100 p-1 rounded-xl w-fit border border-gray-200 shadow-inner">
                <button
                  onClick={() => setViewMode('merchant')}
                  className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${viewMode === 'merchant' ? 'bg-white text-slate-900 shadow border border-gray-200' : 'text-gray-500 hover:text-slate-700'}`}
                >
                  💰 Income (Merchant)
                </button>
                <button
                  onClick={() => setViewMode('customer')}
                  className={`px-4 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${viewMode === 'customer' ? 'bg-white text-slate-900 shadow border border-gray-200' : 'text-gray-500 hover:text-slate-700'}`}
                >
                  💸 Expenses (Customer)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 mt-1">

          <button 
            onClick={() => setShowSearchInput(!showSearchInput)}
            className={`p-1.5 transition-colors ${showSearchInput || searchQuery ? 'text-[#fc5000]' : 'text-gray-500 hover:text-slate-900'}`}
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
              className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-xs text-slate-900 outline-none focus:border-[#fc5000]/50 transition-all font-mono placeholder:font-sans"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-slate-900 text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Area Tabel Arsip ── */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden bg-[#FEF7ED]">
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-[#fc5000]/5 rounded-full blur-3xl pointer-events-none" />

        {isLoadingLogs ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#fc5000] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-900 tracking-tight">Querying Transactions...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-16 h-16 mx-auto mb-3 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[#fc5000]/10 rounded-full blur-xl animate-pulse" />
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-lg relative z-10 rotate-12">
                <LinkIcon className="w-5 h-5 text-[#fc5000] stroke-[2.5]" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">History Transaction</h3>
            <p className="text-xs text-gray-500 font-semibold">No history transactions found.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* View 1: Master Grid Tautan Pembayaran (Muncul jika belum ada tautan yang diklik) */}
            {false ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Select Payment Endpoint to View Buyers
                  </span>
                  <span className="text-[10px] text-[#fc5000] font-mono bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
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
                        className="p-5 rounded-3xl bg-white border border-gray-200 hover:border-[#fc5000]/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 group cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(252,80,0,0.15)]"
                      >
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-[#fc5000]/30 group-hover:bg-[#fc5000] transition-colors" />

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                              ${amtFormatted}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-50 text-[9px] font-bold text-[#fc5000] uppercase tracking-widest border border-gray-200">
                              {cs.token || 'USDC'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate font-bold">
                            {title.replace(/\(Every.*Days\)/i, '').trim()}
                          </p>
                          {(cs.interval || title.includes('(Every')) && (
                            <span className="text-[10px] text-[#fc5000] font-bold uppercase tracking-widest block bg-[#fc5000]/10 px-2 py-0.5 rounded-md w-fit">
                              {cs.interval ? `Every ${cs.interval} Days` : title.match(/\((Every.*Days)\)/i)?.[1] || ''}
                            </span>
                          )}
                          <span className="text-[10px] text-gray-500 font-mono block truncate">
                            ID: {actualId ? `${actualId.slice(0, 8)}...${actualId.slice(-6)}` : 'N/A'}
                          </span>
                        </div>

                        <div className="pt-3 border-t border-gray-200 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {linkLogs.length} Buyer{linkLogs.length === 1 ? '' : 's'} Settled
                          </span>

                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#fc5000] group-hover:text-[#fc5000] transition-colors">
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
                  <div className="pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                        All Raw Universal Audit Dispatches
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">
                        {filteredLogs.length} matches indexed
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                        <th className="pb-3.5 font-bold px-3">Session Spec</th>
                        <th className="pb-3.5 font-bold px-3">{viewMode === 'merchant' ? 'Payer Identity' : 'Merchant Identity'}</th>
                        <th className="pb-3.5 font-bold px-3">Settlement Vol</th>
                        <th className="pb-3.5 font-bold px-3">Timestamp</th>
                        <th className="pb-3.5 font-bold text-right px-3">Verification Registry</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 font-medium text-gray-600">
                          {filteredLogs.map((item: any, idx: number) => {
                            const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                            const timestampMs = Number(item.timestamp) * 1000;
                            return (
                              <tr key={item.id || idx} className="hover:bg-white transition-colors group">
                                <td className="py-4 px-3 font-mono text-[#fc5000] font-semibold">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="truncate max-w-[150px]">{item.sessionId ? `${item.sessionId.slice(0, 10)}...${item.sessionId.slice(-6)}` : 'N/A'}</span>
                                  </div>
                                </td>
                            <td className="py-4 px-3 font-mono text-gray-500">
                              <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                                {viewMode === 'merchant' 
                                  ? (item.payer ? `${item.payer.slice(0, 8)}...${item.payer.slice(-4)}` : 'Unknown')
                                  : (item.merchant ? `${item.merchant.slice(0, 8)}...${item.merchant.slice(-4)}` : 'Unknown')
                                }
                              </span>
                            </td>
                                <td className="py-4 px-3">
                                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                    <Coins className="w-4 h-4 text-[#fc5000]" /><span className="text-sm">${formattedAmount}</span><span className="text-[10px] text-gray-500 font-normal">USDC</span>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-gray-500">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium"><Calendar className="w-3.5 h-3.5 text-gray-500" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                  </div>
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#fc5000] hover:text-[#fc5000] font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200"><span>ArcScan</span><ExternalLink className="w-3.5 h-3.5" /></a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#fc5000]" />
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedSessionFilter(null)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-slate-900 transition-colors border border-gray-200"
                          title="Back to all endpoints grid"
                        >
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                          <span className="text-[10px] font-bold text-[#fc5000] uppercase tracking-widest block">Isolating Buyers For Endpoint</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <h3 className="text-base font-bold text-slate-900 truncate max-w-[180px] sm:max-w-md">
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
                        <span className="text-gray-500">
                          Total Buyers: <strong className="text-slate-900 font-bold">{filteredLogs.length}</strong>
                        </span>
                        <button
                          onClick={() => setSelectedSessionFilter(null)}
                          className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-white border border-gray-200 text-[11px] text-[#fc5000] font-semibold transition-all"
                        >
                          Show All Grid
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
                        <th className="pb-3.5 font-bold px-3">Session Spec</th>
                        <th className="pb-3.5 font-bold px-3">{viewMode === 'merchant' ? 'Payer Identity' : 'Merchant Identity'}</th>
                        <th className="pb-3.5 font-bold px-3">Settlement Vol</th>
                        <th className="pb-3.5 font-bold px-3">Timestamp</th>
                        <th className="pb-3.5 font-bold text-right px-3">Verification Registry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium text-gray-600">
                      {filteredLogs.map((item: any, idx: number) => {
                        const formattedAmount = item.amount ? formatUnits(BigInt(item.amount), 6) : '0.00';
                        const timestampMs = Number(item.timestamp) * 1000;

                        const matchedSession = createdSessions.find((cs: any) => 
                          cs.id?.toLowerCase() === item.sessionId?.toLowerCase() ||
                          cs.sessionId?.toLowerCase() === item.sessionId?.toLowerCase()
                        );
                        const rawTitle = matchedSession ? (matchedSession.description || matchedSession.token) : null;
                        const parsedTitle = rawTitle ? parseSessionDescription(rawTitle) : null;
                        const cleanTitle = parsedTitle ? parsedTitle.cleanDesc : null;
                        const badge = parsedTitle ? getBadgeStyles(parsedTitle.type) : null;

                        return (
                          <tr key={item.id || idx} className="hover:bg-white transition-colors group">
                            <td className="py-4 px-3 font-mono text-[#fc5000] font-semibold">
                              <div className="space-y-0.5">
                                {cleanTitle && (
                                  <div className="flex items-center gap-1">
                                    {badge && (
                                      <span className={`shrink-0 px-1 py-0.2 text-[8px] font-black uppercase tracking-wider rounded border ${badge.bg}`}>
                                        {badge.emoji} {parsedTitle?.type}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold text-slate-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 block font-sans w-fit truncate max-w-[150px]">
                                      {cleanTitle}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 opacity-80">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span className="truncate max-w-[120px] text-xs">{item.sessionId ? `${item.sessionId.slice(0, 10)}...${item.sessionId.slice(-6)}` : 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-mono text-gray-500">
                              <span className="bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                                {viewMode === 'merchant' 
                                  ? (item.payer ? `${item.payer.slice(0, 8)}...${item.payer.slice(-4)}` : 'Unknown')
                                  : (item.merchant ? `${item.merchant.slice(0, 8)}...${item.merchant.slice(-4)}` : 'Unknown')
                                }
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                <Coins className="w-4 h-4 text-[#fc5000]" /><span className="text-sm">${formattedAmount}</span><span className="text-[10px] text-gray-500 font-normal">USDC</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-gray-500">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium"><Calendar className="w-3.5 h-3.5 text-gray-500" /><span>{new Date(timestampMs).toLocaleDateString()} {new Date(timestampMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <a href={`https://testnet.arcscan.app/tx/${item.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#fc5000] hover:text-[#fc5000] font-bold bg-white px-3 py-1.5 rounded-xl border border-gray-200"><span>ArcScan</span><ExternalLink className="w-3.5 h-3.5" /></a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
