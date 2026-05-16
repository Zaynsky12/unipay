"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  Building2, 
  Wallet, 
  Coins, 
  CheckCircle2, 
  PlusCircle, 
  Loader2,
  RefreshCw,
  ExternalLink,
  Layers,
  Link as LinkIcon,
  Copy,
  Clock,
  ArrowUpRight as ArrowUpRightIcon,
  UserCheck,
  ShieldAlert,
  Trash2,
  BadgeCheck,
  Plus,
  Users,
  Layout,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, EURC_ADDRESS } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';

// Helper: translate token address to readable symbol
function resolveTokenSymbol(tokenAddr: string): string {
  const addr = tokenAddr?.toLowerCase();
  if (addr === USDC_ADDRESS.toLowerCase()) return 'USDC';
  if (addr === EURC_ADDRESS.toLowerCase()) return 'EURC';
  return 'Payment Link';
}

// Helper: get saved description from localStorage
function getSavedDescription(sessionId: string): string {
  if (typeof window === 'undefined') return '';
  try {
    const descs = JSON.parse(localStorage.getItem('unipay_descriptions') || '{}');
    return descs[sessionId] || '';
  } catch { return ''; }
}

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Membaca identitas merchant onchain
  const { data: merchantData, isLoading: isLoadingRead, refetch: refetchMerchant } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  // Contract Write for Deactivation
  const { writeContract, data: txHashDeactivate } = useWriteContract();
  const { isLoading: isConfirmingDeactivate, isSuccess: isDeactivateSuccess } = useWaitForTransactionReceipt({
    hash: txHashDeactivate,
  });

  // Refetch when deactivation is successful
  React.useEffect(() => {
    if (isDeactivateSuccess) {
      refetchMerchant();
      setIsDeactivating(null);
      // Auto-refresh history after deletion
      setTimeout(() => refetchHistory(), 2000);
    }
  }, [isDeactivateSuccess, refetchMerchant]);

  const isRegisteredOnchain = merchantData ? merchantData[2] : false;
  const rawName = isRegisteredOnchain ? (merchantData?.[0] || '') : '';
  const isRegistered = isRegisteredOnchain && rawName !== '' && rawName !== 'Anonymous';
  const name = isRegistered ? rawName : 'Anonymous';
  const metadata = merchantData?.[1] || '';
  const totalReceivedRaw = merchantData?.[3] || 0n;
  const totalTransactionsRaw = merchantData?.[4] || 0n;

  // Goldsky Subgraph hook
  const { history, isLoading: isLoadingHistory, refetch: refetchHistory } = useMerchantHistory(address);
  const rawCreatedSessions = history?.sessions || [];
  const recentPayments = history?.payments || [];

  // Memoize goldskyActiveSessions to prevent infinite loop in useEffect
  const goldskyActiveSessions = useMemo(() => {
    return (history?.sessions || []).filter((s: any) => s.active !== false);
  }, [history?.sessions]);
  
  // Use a more robust deduplication for optimistic sessions
  const [optimisticSessions, setOptimisticSessions] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('unipay_optimistic_sessions') || '[]');
      
      const goldskyIds = new Set(goldskyActiveSessions.map((s: any) => (s.id || s.sessionId || '').toLowerCase()));
      
      // Filter out sessions that are already in Goldsky
      const pending = stored.filter((s: any) => {
        const id = (s.id || s.sessionId || '').toLowerCase();
        return id && !goldskyIds.has(id);
      });

      // Update state and localStorage ONLY if pending items have changed
      if (JSON.stringify(pending) !== JSON.stringify(optimisticSessions)) {
        setOptimisticSessions(pending);
        if (pending.length !== stored.length) {
          localStorage.setItem('unipay_optimistic_sessions', JSON.stringify(pending));
        }
      }
    } catch (e) {
      console.error("Failed to sync optimistic sessions:", e);
    }
  }, [goldskyActiveSessions, optimisticSessions]);

  const createdSessions = React.useMemo(() => {
    const combined = [...optimisticSessions, ...goldskyActiveSessions];
    // Final safety check: filter unique IDs again
    const seen = new Set();
    return combined.filter(s => {
      const id = (s.id || s.sessionId || '').toLowerCase();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).sort((a: any, b: any) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  }, [optimisticSessions, goldskyActiveSessions]);

  const filteredRecentPayments = history?.payments || [];

  // Handler penghapusan link mutlak (Deactivate di Smart Contract)
  const handleDeleteSession = (sessionId: string) => {
    if (!address) return;
    setIsDeactivating(sessionId);
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'deactivateSession',
      args: [sessionId as `0x${string}`],
    });
  };



  // Tombol penyalinan tautan
  const copySessionUrl = (sessionId: string) => {
    const url = `${window.location.origin}/pay/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

      {/* ── CONNECTION ALERT BANNER (Only if not connected) ── */}
      {!isConnected && (
        <div className="p-6 rounded-3xl bg-violet-600/10 border border-violet-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-[0_0_40px_rgba(124,58,237,0.1)]">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">Wallet Connection Required</h3>
              <p className="text-[11px] text-gray-400 leading-relaxed max-w-sm">
                Connect your Web3 identity to access real-time onchain metrics, manage active payment endpoints, and review settlements.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const kitBtn = document.querySelector('appkit-button');
              if (kitBtn) (kitBtn as any).click();
            }}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-violet-600/20 transition-all flex items-center gap-2 group whitespace-nowrap"
          >
            Connect Identity
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

  // Kalkulasi total murni menggabungkan baseline onchain L1 dengan akumulasi pelunasan sinkronisasi lokal/gasless
  const localRevenueSum = filteredRecentPayments.reduce((sum: number, p: any) => {
    try {
      const amtNum = p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0;
      return sum + amtNum;
    } catch(e) {
      return sum;
    }
  }, 0);

  const displayTotalReceived = Number(formatUnits(totalReceivedRaw, 6)) + localRevenueSum;
  const displayTotalTx = Number(totalTransactionsRaw) + filteredRecentPayments.length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* ── DASHBOARD HEADER (SLIM MOBILE) ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-40">
        <div className="flex flex-col gap-1">
          <p className="text-[8px] font-black text-violet-400 uppercase tracking-[0.3em] ml-1 opacity-70">
            {isRegistered ? 'Verified Merchant' : 'Unverified Identity'}
          </p>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-2">
              {isLoadingRead ? (
                <div className="h-7 w-24 bg-white/5 animate-pulse rounded-lg" />
              ) : (
                <>
                  {isRegistered ? name : 'Anonymous'}
                  {isRegistered && <BadgeCheck className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400 shrink-0" />}
                </>
              )}
            </h1>

            {!isLoadingRead && !isRegistered && (
              <Link 
                href="/dashboard/account?tab=Merchant Setting"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-[8px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all shrink-0"
              >
                <ShieldAlert className="w-2.5 h-2.5" />
                Register
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
           <Link 
             href="/dashboard/create"
             className="flex-1 md:flex-none btn-primary px-4 py-2.5 sm:px-6 rounded-xl flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black shadow-lg shadow-violet-600/20 transition-all hover:-translate-y-0.5 active:scale-95"
           >
             <Plus className="w-3.5 h-3.5" />
             <span>New Paylink</span>
           </Link>

           <button 
             onClick={async () => {
               setIsRefreshing(true);
               refetchMerchant();
               await refetchHistory();
               setTimeout(() => setIsRefreshing(false), 600);
             }}
             disabled={isRefreshing}
             className="p-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center h-[40px] w-[40px] disabled:opacity-60"
             title="Refresh"
           >
             <RefreshCw className={`w-3.5 h-3.5 transition-all ${isRefreshing ? 'animate-spin text-violet-400' : ''}`} />
           </button>
        </div>
      </div>

      {/* ── OPERATIONAL METRICS ── */}
      <div className={`space-y-6 animate-fade-in transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* UPPER PANE: Wadah Tunggal Etalase Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30">
          
          {/* Kolom Penuh: Payments Card */}
          <div className="lg:col-span-12 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col justify-between relative z-30 bg-gradient-to-b from-white/[0.03] via-[#0A0A0F] to-[#0A0A0F]">
            <div>
              <h2 className="text-lg font-black text-white tracking-tight mb-4">Payments</h2>
              
              {/* DESKTOP & TABLET VIEW: 12-Column Grid Table */}
              <div className="hidden md:block overflow-visible">
                {/* Header Kolom Mini */}
                <div className="grid grid-cols-12 text-[9px] font-black text-gray-500 uppercase tracking-widest pb-2 border-b border-white/5">
                  <span className="col-span-5">PAYMENTS</span>
                  <span className="col-span-2 text-center">PRICE</span>
                  <span className="col-span-2 text-center">VOLUME</span>
                  <span className="col-span-2 text-center">SALES</span>
                  <span className="col-span-1 text-right">MANAGE</span>
                </div>

                {/* Daftar Tautan Pembayaran Lengkap */}
                <div className="space-y-3 pt-3">
                  {createdSessions.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500">
                      No active payment endpoints created yet.
                    </div>
                  ) : (
                    createdSessions.map((s: any, idx: number) => {
                      const actualId = s.id || s.sessionId;
                      const linkBuyers = filteredRecentPayments.filter((p: any) => 
                        p.sessionId && actualId && (
                          p.sessionId.toLowerCase() === actualId.toLowerCase() ||
                          p.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                          actualId.toLowerCase().includes(p.sessionId.toLowerCase())
                        )
                      );
                      const salesSum = linkBuyers.reduce((acc: number, p: any) => acc + (p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0), 0);
                      const isNakedAmt = s.amount ? `$${formatUnits(BigInt(s.amount), 6)}` : 'N/A';

                      return (
                        <div key={actualId || idx} className={`grid grid-cols-12 items-center gap-2 group py-1.5 border-b border-white/[0.02] last:border-0 relative ${activeDropdown === actualId ? 'z-50' : 'z-10'}`}>
                          {/* 1. PAYMENTS */}
                          <Link 
                            href={`/pay/${actualId}`}
                            target="_blank"
                            className="col-span-5 flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                            title="Open Live Payment Link (Checkout Page)"
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                                {getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink'}
                              </p>
                              <p className="text-[9px] text-gray-500 truncate">
                                {resolveTokenSymbol(s.token)} · Created {s.createdAt ? new Date(Number(s.createdAt) * 1000).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </Link>

                          {/* 2. PRICE */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs font-bold text-gray-400">{isNakedAmt}</span>
                          </div>

                          {/* 3. VOLUME */}
                          <div className="col-span-2 text-center leading-tight">
                            <span className="text-xs font-bold text-white block">${salesSum.toFixed(0)}</span>
                            <span className="text-[8px] text-violet-400 font-bold block">USDC</span>
                          </div>

                          {/* 4. SALES */}
                          <div className="col-span-2 text-center leading-tight">
                            <span className="text-xs font-bold text-gray-300 block font-mono">{linkBuyers.length}</span>
                            <span className="text-[8px] text-gray-500 font-bold block">orders</span>
                          </div>

                          {/* 5. MANAGE */}
                          <div className="col-span-1 flex items-center justify-end gap-0.5 relative z-50">
                            <button 
                              onClick={() => {
                                const linkName = getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink';
                                router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-violet-400 transition-all rounded-lg hover:bg-white/[0.05]"
                              title="View Buyers / History"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdown(prev => prev === actualId ? null : actualId);
                              }} 
                              className={`w-7 h-7 flex items-center justify-center transition-all rounded-lg border cursor-pointer ${
                                activeDropdown === actualId 
                                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-sm' 
                                  : 'text-gray-400 hover:text-white border-transparent hover:bg-white/[0.08]'
                              }`}
                              title="Manage Paylink Options"
                            >
                              <span className="text-sm font-black leading-none block">⋮</span>
                            </button>

                            {/* DROPDOWN MENU PREMIUM GLASSMORPHISM DENGAN HOVER MULTI-WARNA */}
                            {activeDropdown === actualId && (
                              <div className="absolute right-0 top-9 w-52 rounded-2xl bg-[#0B0B12]/95 backdrop-blur-2xl border border-violet-500/30 ring-1 ring-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] py-2 z-[100] animate-fade-in text-left divide-y divide-white/[0.04] pointer-events-auto cursor-default">
                                <div className="px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-transparent">
                                  <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest block">Manage Paylink</span>
                                  <span className="text-[9px] font-mono text-gray-400 truncate block mt-0.5">{actualId}</span>
                                </div>

                                <div className="py-1.5 space-y-0.5 px-1.5">
                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const linkName = getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink';
                                      router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-gray-300 hover:text-violet-300 hover:bg-violet-500/10 flex items-center gap-2.5 font-semibold transition-all text-left cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-violet-400 text-sm block">👥</span> 
                                    <span>View Buyers</span>
                                  </button>

                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copySessionUrl(actualId);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2.5 font-semibold transition-all text-left cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-emerald-400 text-sm block">📋</span> 
                                    <span>{copiedId === actualId ? 'Copied!' : 'Copy Link'}</span>
                                  </button>
                                </div>

                                  <button 
                                    type="button"
                                    disabled={isDeactivating === actualId || isConfirmingDeactivate}
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteSession(actualId);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/20 flex items-center gap-2.5 font-semibold transition-all text-left group/btn cursor-pointer pointer-events-auto disabled:opacity-50"
                                  >
                                    <span className="text-sm block group-hover/btn:scale-110 transition-transform">
                                      {(isDeactivating === actualId || isConfirmingDeactivate) ? '⏳' : '🗑️'}
                                    </span> 
                                    <span>{(isDeactivating === actualId || isConfirmingDeactivate) ? 'Deactivating...' : 'Archive Paylink'}</span>
                                  </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* MOBILE VIEW: Stacked Native Cards (Tanpa Geser Horizontal) */}
              <div className="block md:hidden space-y-3 pt-2">
                {createdSessions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-500">
                    No active payment endpoints created yet.
                  </div>
                ) : (
                  createdSessions.map((s: any, idx: number) => {
                    const actualId = s.id || s.sessionId;
                    const linkBuyers = filteredRecentPayments.filter((p: any) => 
                      p.sessionId && actualId && (
                        p.sessionId.toLowerCase() === actualId.toLowerCase() ||
                        p.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                        actualId.toLowerCase().includes(p.sessionId.toLowerCase())
                      )
                    );
                    const salesSum = linkBuyers.reduce((acc: number, p: any) => acc + (p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0), 0);
                    const isNakedAmt = s.amount ? `$${formatUnits(BigInt(s.amount), 6)}` : 'N/A';

                    return (
                      <div key={`mob-${actualId || idx}`} className={`p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] space-y-3 relative group ${activeDropdown === actualId ? 'z-50 ring-1 ring-violet-500/30' : 'z-10'}`}>
                        {/* Top Bar: Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                          <Link 
                            href={`/pay/${actualId}`}
                            target="_blank"
                            className="flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink'}
                              </p>
                              <p className="text-[9px] text-gray-500 truncate">
                                {resolveTokenSymbol(s.token)} · {isNakedAmt}
                              </p>
                            </div>
                          </Link>

                          {/* Manage Shortcuts */}
                          <div className="flex items-center gap-0.5 shrink-0 relative z-50">
                            <button 
                              onClick={() => {
                                const linkName = getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink';
                                router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-400 transition-all rounded-xl hover:bg-white/[0.05]"
                            >
                              <Users className="w-3.5 h-3.5" />
                            </button>

                            <button 
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdown(prev => prev === actualId ? null : actualId);
                              }} 
                              className={`w-8 h-8 flex items-center justify-center transition-all rounded-xl border cursor-pointer ${
                                activeDropdown === actualId 
                                  ? 'bg-violet-500/20 text-violet-300 border-violet-500/30 shadow-sm' 
                                  : 'text-gray-400 hover:text-white border-transparent hover:bg-white/[0.08]'
                              }`}
                            >
                              <span className="text-base font-black leading-none block">⋮</span>
                            </button>

                            {/* Dropdown Mobile */}
                            {activeDropdown === actualId && (
                              <div className="absolute right-0 top-9 w-52 rounded-2xl bg-[#0B0B12]/98 backdrop-blur-3xl border border-violet-500/30 ring-1 ring-white/5 shadow-2xl py-2 z-[100] animate-fade-in text-left divide-y divide-white/[0.04] pointer-events-auto cursor-default">
                                <div className="px-3 py-1.5 bg-gradient-to-r from-violet-500/10 to-transparent">
                                  <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest block">Manage Paylink</span>
                                  <span className="text-[9px] font-mono text-gray-400 truncate block mt-0.5">{actualId}</span>
                                </div>

                                <div className="py-1.5 space-y-0.5 px-1.5">
                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const linkName = getSavedDescription(actualId) || resolveTokenSymbol(s.token) + ' Paylink';
                                      router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-gray-300 hover:text-violet-300 hover:bg-violet-500/10 flex items-center gap-2.5 font-semibold transition-all text-left cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-violet-400 text-sm block">👥</span> 
                                    <span>View Buyers</span>
                                  </button>

                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copySessionUrl(actualId);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-gray-300 hover:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-2.5 font-semibold transition-all text-left cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-emerald-400 text-sm block">📋</span> 
                                    <span>{copiedId === actualId ? 'Copied!' : 'Copy Link'}</span>
                                  </button>
                                </div>

                                <div className="pt-1.5 px-1.5">
                                  <button 
                                    type="button"
                                    disabled={isDeactivating === actualId || isConfirmingDeactivate}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (window.confirm("Are you sure you want to archive this payment link? This action cannot be undone on the blockchain.")) {
                                        handleDeleteSession(actualId);
                                      }
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/20 flex items-center gap-2.5 font-semibold transition-all text-left group/btn cursor-pointer pointer-events-auto disabled:opacity-50"
                                  >
                                    <span className="text-sm block group-hover/btn:scale-110 transition-transform">
                                      {(isDeactivating === actualId || isConfirmingDeactivate) ? '⏳' : '🗑️'}
                                    </span> 
                                    <span>{(isDeactivating === actualId || isConfirmingDeactivate) ? 'Deactivating...' : 'Archive Paylink'}</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Bar: Badges for Price, Volume, Sales */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.02]">
                          <div className="bg-white/[0.01] p-2 rounded-xl text-center border border-white/[0.02]">
                            <span className="text-[8px] font-bold text-gray-500 block uppercase tracking-wider">Price</span>
                            <span className="text-xs font-bold text-gray-300 mt-0.5 block">{isNakedAmt}</span>
                          </div>
                          <div className="bg-white/[0.01] p-2 rounded-xl text-center border border-white/[0.02]">
                            <span className="text-[8px] font-bold text-violet-400 block uppercase tracking-wider">Volume</span>
                            <span className="text-xs font-black text-white mt-0.5 block">${salesSum.toFixed(0)}</span>
                          </div>
                          <div className="bg-white/[0.01] p-2 rounded-xl text-center border border-white/[0.02]">
                            <span className="text-[8px] font-bold text-gray-500 block uppercase tracking-wider">Orders</span>
                            <span className="text-xs font-bold text-gray-300 mt-0.5 block">{linkBuyers.length}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM PANE: Transactions Container */}
        <div className="w-full glass-panel p-8 rounded-3xl border border-white/5 bg-[#0A0A0F] text-center relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Ikon Rantai 3D Bergradasi Ungu/Metalik di Tengah */}
          <div className="w-16 h-16 mx-auto mb-3 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-violet-600/10 rounded-full blur-xl animate-pulse" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/20 via-black to-violet-400/10 border border-violet-500/30 flex items-center justify-center shadow-lg relative z-10 rotate-12 group-hover:rotate-0 transition-transform">
              <LinkIcon className="w-5 h-5 text-violet-400 stroke-[2.5]" />
            </div>
          </div>

          <h3 className="text-base font-black text-white tracking-tight">History Transaction</h3>

          {filteredRecentPayments.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1 font-semibold">No history transactions found.</p>
          ) : (
            <div className="mt-6 text-left overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider text-[9px] border-b border-white/5">
                    <th className="pb-3 font-bold px-2">Session Hash</th>
                    <th className="pb-3 font-bold px-2">Payer Identity</th>
                    <th className="pb-3 font-bold px-2">Settled Asset</th>
                    <th className="pb-3 font-bold px-2">Timestamp</th>
                    <th className="pb-3 font-bold text-right px-2">Verification Registry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                  {filteredRecentPayments.slice(0, 10).map((p: any, idx: number) => {
                    const pAmountFormatted = p.amount ? formatUnits(BigInt(p.amount), 6) : '0.00';
                    const txHash = p.id || '';
                    
                    const matchedSession = rawCreatedSessions.find((s: any) => 
                      s.id?.toLowerCase() === p.sessionId?.toLowerCase() || 
                      s.sessionId?.toLowerCase() === p.sessionId?.toLowerCase()
                    );
                    const customTitle = matchedSession ? (matchedSession.description || matchedSession.token) : null;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-2 font-mono text-violet-300/90 font-semibold">
                          <div className="space-y-0.5">
                            {customTitle && (
                              <span className="text-[9px] font-bold text-white bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5 block font-sans w-fit truncate max-w-[120px]">
                                {customTitle}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{p.sessionId ? `${p.sessionId.slice(0, 10)}...${p.sessionId.slice(-4)}` : 'N/A'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 font-mono text-gray-400">
                          <span className="bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                            {p.payer ? `${p.payer.slice(0, 8)}...${p.payer.slice(-4)}` : 'Unknown'}
                          </span>
                        </td>

                        <td className="py-3 px-2">
                          <span className="font-black text-white">${pAmountFormatted}</span>
                          <span className="text-[9px] text-violet-400 font-bold ml-1">USDC</span>
                        </td>

                        <td className="py-3 px-2 text-gray-500">
                          <span>{new Date(Number(p.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>

                        <td className="py-3 px-2 text-right">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 font-bold bg-white/[0.03] hover:bg-white/[0.06] px-2 py-0.5 rounded border border-white/5 transition-all"
                          >
                            <span>ArcScan L1</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-center">
                <Link href="/dashboard/history" className="text-xs text-violet-400 hover:text-violet-300 font-bold hover:underline">
                  View Complete History →
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>



    </div>
  );
}
