"use client";

import React, { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
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
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';

export default function DashboardPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletedSessionIds, setDeletedSessionIds] = useState<Set<string>>(new Set());
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [statsTab, setStatsTab] = useState('7 Days');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [localCachedSessions, setLocalCachedSessions] = useState<any[]>([]);

  // Membaca identitas merchant onchain
  const { data: merchantData, isLoading: isLoadingRead, refetch: refetchMerchant } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegistered = merchantData ? merchantData[2] : false;
  const name = merchantData?.[0] || '';
  const metadata = merchantData?.[1] || '';
  const totalReceivedRaw = merchantData?.[3] || 0n;
  const totalTransactionsRaw = merchantData?.[4] || 0n;

  // Goldsky Subgraph hook
  const { history, isLoading: isLoadingHistory } = useMerchantHistory(address);
  const rawCreatedSessions = history?.sessions || [];
  const recentPayments = history?.payments || [];

  // Sinkronisasi status penghapusan link dari LocalStorage (Unconditional on mount)
  React.useEffect(() => {
    try {
      const deletedKey = `unipay_deleted_sessions`;
      const existingDeleted = localStorage.getItem(deletedKey);
      if (existingDeleted) {
        setDeletedSessionIds(new Set(JSON.parse(existingDeleted)));
      }
    } catch(e) {}
  }, []);

  // Sinkronisasi cache deskripsi lokal dari LocalStorage
  React.useEffect(() => {
    if (!address) return;
    try {
      const storageKey = `unipay_sessions_${address.toLowerCase()}`;
      const existingSessions = localStorage.getItem(storageKey);
      if (existingSessions) {
        setLocalCachedSessions(JSON.parse(existingSessions));
      }
    } catch(e) {}
  }, [address]);

  // Handler penghapusan link mutlak (Erase dari storage & filter multi-parameter aktif)
  const handleDeleteSession = (sessionId: string) => {
    if (!sessionId) return;
    const lowerTargetId = sessionId.toLowerCase().trim();
    try {
      if (address) {
        // 1. Hapus fisik secara absolut dari memori array sesi lokal berdasarkan ID atau Deskripsi
        const storageKey = `unipay_sessions_${address.toLowerCase()}`;
        const existing = localStorage.getItem(storageKey);
        if (existing) {
          let sessionsArray = JSON.parse(existing);
          sessionsArray = sessionsArray.filter((s: any) => {
            const actId = s.sessionId || s.id;
            const matchId = actId && actId.toLowerCase().trim() === lowerTargetId;
            const matchDesc = s.description && s.description.toLowerCase().trim() === lowerTargetId;
            return !matchId && !matchDesc;
          });
          localStorage.setItem(storageKey, JSON.stringify(sessionsArray));
          setLocalCachedSessions(sessionsArray);
        }
      }

      // 2. Masukkan ke dalam daftar global deleted link IDs jika belum ada
      const deletedKey = `unipay_deleted_sessions`;
      const existingDeleted = localStorage.getItem(deletedKey);
      const deletedArray: string[] = existingDeleted ? JSON.parse(existingDeleted) : [];
      if (!deletedArray.some(id => id?.toLowerCase().trim() === lowerTargetId)) {
        localStorage.setItem(deletedKey, JSON.stringify([...deletedArray, sessionId.trim()]));
      }

      // 3. Update React state untuk seketika menyembunyikannya dari antarmuka
      setDeletedSessionIds(prev => new Set([...Array.from(prev), sessionId.trim()]));
    } catch(e) {}
  };

  // ── GABUNGKAN SESI SUBGRAPH & CACHE LOKAL AGAR DESKRIPSI & LINK BARU TERISI SEMPURNA ──
  const mergedSessionsMap = new Map<string, any>();

  // 1. Masukkan data dasar dari Goldsky Subgraph terlebih dahulu
  rawCreatedSessions.forEach((s: any, idx: number) => {
    const actId = s.id || s.sessionId || `subgraph_link_${idx}`;
    mergedSessionsMap.set(actId.toLowerCase(), { ...s, id: actId, sessionId: actId });
  });

  // 2. Perkaya dengan cache deskripsi lokal dari localStorage saat pembuatan
  localCachedSessions.forEach((s: any, idx: number) => {
    const actId = s.sessionId || s.id || `local_link_${idx}`;
    const existing = mergedSessionsMap.get(actId.toLowerCase());
    if (existing) {
      // Terapkan deskripsi kustom jika onchain kosong
      existing.description = s.description || existing.description;
      // Tandai status terhapus jika tersimpan di cache
      if (s.isDeleted) existing.isDeleted = true;
    } else {
      // Sesi yang baru saja dibuat & belum diindeks Subgraph
      mergedSessionsMap.set(actId.toLowerCase(), {
        id: actId,
        sessionId: actId,
        // Ubah format amount desimal dari localStorage ke satuan onchain string (e.g. "15" -> "15000000")
        amount: s.amount ? (Number(s.amount.replace('$', '')) * 1e6).toString() : '0',
        token: s.token || 'USDC',
        description: s.description || 'Paylink',
        createdAt: s.createdAt ? Math.floor(s.createdAt / 1000) : Math.floor(Date.now() / 1000),
        isDeleted: s.isDeleted || false
      });
    }
  });

  const allCombinedSessions = Array.from(mergedSessionsMap.values());

  // Himpunan penampung seluruh ID yang terhapus dalam format huruf kecil (case-insensitive)
  const lowercasedDeletedIds = new Set(Array.from(deletedSessionIds).map(id => id?.toLowerCase().trim()));

  // Filter out link yang telah dihapus atau sampah
  const createdSessions = allCombinedSessions.filter((s: any) => {
    if (s.isDeleted) return false;
    const actId = s.id || s.sessionId;
    if (!actId || typeof actId !== 'string') return false;
    const cleanId = actId.trim();
    
    // Periksa pencocokan ID mutlak terhadap daftar hapus
    if (lowercasedDeletedIds.has(cleanId.toLowerCase())) return false;
    // Periksa juga jika deskripsinya bertindak sebagai pseudo-ID yang dihapus pengguna
    if (s.description && lowercasedDeletedIds.has(s.description.toLowerCase().trim())) return false;
    
    // Izinkan jika merupakan link otentik (0x atau subplan_) ATAU link custom buatan user yang belum dihapus
    return true;
  });

  // Filter out receipts/payments yang terikat pada link yang telah dihapus
  const filteredRecentPayments = recentPayments.filter((p: any) => {
    if (!p.sessionId) return true;
    if (lowercasedDeletedIds.has(p.sessionId.toLowerCase())) return false;
    const matchedSession = allCombinedSessions.find((s: any) => 
      s.id?.toLowerCase() === p.sessionId.toLowerCase() || 
      s.sessionId?.toLowerCase() === p.sessionId.toLowerCase()
    );
    if (matchedSession?.isDeleted) return false;
    return true;
  });

  // Tombol penyalinan tautan
  const copySessionUrl = (sessionId: string) => {
    const url = `${window.location.origin}/pay/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Tampilan terkunci saat belum konek dompet
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative">
        <div className="absolute w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/30 flex items-center justify-center mb-6 text-violet-400 relative shadow-[0_0_30px_rgba(124,58,237,0.15)] animate-pulse">
          <Wallet className="w-8 h-8 relative z-10" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">Merchant Portal Access</h1>
        <p className="text-gray-400 max-w-md text-xs sm:text-sm leading-relaxed mb-6">
          Your decentralized enterprise dashboard state is directly keyed to your Web3 identity.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-violet-300 font-medium">
          <span>Click the wallet button in the top right navbar</span>
          <ArrowUpRightIcon className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    );
  }

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
      
      {/* ── Banner/Header Dashboard Premium ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/20 via-indigo-900/10 to-black border border-white/5 p-6 sm:p-8 shadow-[0_0_40px_rgba(124,58,237,0.05)]">
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-violet-500/10 rounded-full blur-3xl" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                Workspace Identity
              </span>
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Arc Testnet
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {isLoadingRead ? (
                <span className="shimmer inline-block w-48 h-8 rounded" />
              ) : isRegistered ? (
                name
              ) : (
                'Unverified Workspace'
              )}
            </h1>

            <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate max-w-md">
              <span className="text-gray-500">Owner:</span> 
              <span className="font-mono text-violet-300/80 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">{address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {isRegistered ? (
              <Link 
                href="/dashboard/create" 
                className="btn-primary px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-105 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> New Payment Link
              </Link>
            ) : (
              <Link 
                href="/dashboard/account" 
                className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold flex items-center gap-2 transition-all hover:bg-amber-500/20"
              >
                <UserCheck className="w-4 h-4" /> Verify Account Now
              </Link>
            )}
            <button 
              onClick={() => { refetchMerchant(); window.location.reload(); }} 
              className="p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center"
              title="Refresh Protocol State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRead ? 'animate-spin text-violet-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── SPANDUK PERINGATAN JIKA BELUM TERVERIFIKASI (SANGAT BERSIH & RAPI) ── */}
      {!isLoadingRead && !isRegistered && (
        <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.02] to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-200">Account Verification Required</h3>
              <p className="text-xs text-gray-400 mt-0.5 max-w-xl leading-relaxed">
                Your store namespace has not been claimed on the Arc L1 Network. To publish automated payment dispatches and unlock zero-gas Meta-transactions, please register your brand profile.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/account"
            className="btn-primary py-2.5 px-4 text-xs font-bold whitespace-nowrap self-start sm:self-center"
          >
            Go to Account Verification →
          </Link>
        </div>
      )}

      {/* ── State Terdaftar / Metrik Operasional (Dirombak Sempurna Sesuai Mockup UI Premium) ── */}
      <div className="space-y-6 animate-fade-in">
        
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
                            href={`/dashboard/history?filter=${actualId}`}
                            className="col-span-5 flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                            title="View specific transaction history for this endpoint"
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform">
                              <LinkIcon className="w-3.5 h-3.5 rotate-45" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate group-hover:text-violet-400 transition-colors">
                                {s.description || s.token || 'Paylink'}
                              </p>
                              <p className="text-[9px] text-gray-500 truncate">
                                Deposit collection for {s.description ? s.description.toLowerCase() : 'paylink'}
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
                            <Link 
                              href={`/pay/${actualId}`}
                              target="_blank"
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-violet-400 transition-all rounded-lg hover:bg-white/[0.05]"
                              title="Open Live Gateway"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

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
                                      router.push(`/dashboard/history?filter=${actualId}`);
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
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSessionToDelete(actualId);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/20 flex items-center gap-2.5 font-semibold transition-all text-left group/btn cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-sm block group-hover/btn:scale-110 transition-transform">🗑️</span> 
                                    <span>Delete Payment Link</span>
                                  </button>
                                </div>
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
                            href={`/dashboard/history?filter=${actualId}`}
                            className="flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                          >
                            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white shrink-0 shadow-md">
                              <LinkIcon className="w-3.5 h-3.5 rotate-45" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {s.description || s.token || 'Paylink'}
                              </p>
                              <p className="text-[9px] text-gray-500 truncate">
                                {s.description ? s.description.toLowerCase() : 'paylink'}
                              </p>
                            </div>
                          </Link>

                          {/* Manage Shortcuts */}
                          <div className="flex items-center gap-0.5 shrink-0 relative z-50">
                            <Link 
                              href={`/pay/${actualId}`}
                              target="_blank"
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-violet-400 transition-all rounded-xl hover:bg-white/[0.05]"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>

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
                                      router.push(`/dashboard/history?filter=${actualId}`);
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
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSessionToDelete(actualId);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-xs text-red-400 hover:text-red-200 hover:bg-red-500/20 flex items-center gap-2.5 font-semibold transition-all text-left group/btn cursor-pointer pointer-events-auto"
                                  >
                                    <span className="text-sm block group-hover/btn:scale-110 transition-transform">🗑️</span> 
                                    <span>Delete Payment Link</span>
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

          <h3 className="text-base font-black text-white tracking-tight">Transactions</h3>

          {filteredRecentPayments.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1 font-semibold">No transactions found.</p>
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

      {/* ── MODAL KONFIRMASI PENGHAPUSAN LINK (PREMIUM GLASSMORPHISM) ── */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 sm:p-8 rounded-3xl border border-red-500/30 bg-[#0A0A0F] space-y-6 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            {/* Ambient Red Glow Accent */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center space-y-3 relative z-10">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Deactivate & Delete Link?</h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                Are you sure you want to permanently decommission this settlement link endpoint? 
                <span className="block mt-1 text-red-400 font-medium">Customers trying to pay via this URL will be automatically blocked.</span>
              </p>
              <div className="p-2 rounded-xl bg-black/50 border border-white/5 font-mono text-[10px] text-gray-500 max-w-full truncate px-3">
                ID: {sessionToDelete}
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10 pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs text-gray-300 font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (sessionToDelete) handleDeleteSession(sessionToDelete);
                  setSessionToDelete(null);
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-xs text-white font-black transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              >
                Yes, Delete Link
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
