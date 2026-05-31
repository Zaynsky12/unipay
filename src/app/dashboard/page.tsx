"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, padHex } from 'viem';
import { 
  Building2, 
  Wallet, 
  Coins, 
  Eye,
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
  ArrowRight,
  Shield,
  TrendingUp,
  Activity,
  Globe2,
  Sparkles,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, EURC_ADDRESS } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';
import { usePrivy } from '@privy-io/react-auth';
import { InlineAuth } from '@/components/dashboard/InlineAuth';

// Helper: translate token address to readable symbol
function resolveTokenSymbol(tokenAddr: string): string {
  const addr = tokenAddr?.toLowerCase();
  if (addr === USDC_ADDRESS.toLowerCase()) return 'USDC';
  if (addr === EURC_ADDRESS.toLowerCase()) return 'EURC';
  return 'Payment Link';
}

// Helper: get saved description from localStorage
function getSavedDescription(sessionId: string, fallback?: string): string {
  if (typeof window === 'undefined') return fallback || '';
  try {
    const descs = JSON.parse(localStorage.getItem('lumipay_descriptions') || '{}');
    return descs[sessionId] || fallback || '';
  } catch { return fallback || ''; }
}

export function parseSessionDescription(descString: string) {
  const str = descString || '';
  const match = str.match(/^\[(.*?)\]\s*(.*)$/);
  if (match) {
    return {
      type: match[1],
      cleanDesc: match[2]
    };
  }
  const lower = str.toLowerCase();
  if (lower.startsWith('invoice')) return { type: 'Invoice', cleanDesc: str };
  if (lower.startsWith('checkout')) return { type: 'Checkout', cleanDesc: str };
  if (lower.startsWith('subscription')) return { type: 'Subscription', cleanDesc: str };
  if (lower.startsWith('tip')) return { type: 'Tip', cleanDesc: str };
  return { type: 'Payment', cleanDesc: str };
}

export function getBadgeStyles(type: string) {
  switch (type.toLowerCase()) {
    case 'invoice':
      return {
        bg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-600',
        emoji: '🧾'
      };
    case 'checkout':
      return {
        bg: 'bg-violet-500/10 border-violet-500/25 text-violet-600',
        emoji: '💳'
      };
    case 'subscription':
      return {
        bg: 'bg-amber-500/10 border-amber-500/25 text-amber-600',
        emoji: '⚡'
      };
    case 'tip':
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600',
        emoji: '📲'
      };
    default:
      return {
        bg: 'bg-gray-500/10 border-gray-500/25 text-gray-600',
        emoji: '🔗'
      };
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { login, authenticated, ready, user } = usePrivy();
  const { address, isConnected } = useAccount();
  const embeddedWallet = user?.linkedAccounts?.find((account: any) => account.type === 'wallet' && account.walletClientType === 'privy');
  const userAddress = address || (user?.wallet?.address as `0x${string}`) || ((embeddedWallet as any)?.address as `0x${string}`) || undefined;
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Membaca identitas merchant onchain
  const { data: merchantData, isLoading: isLoadingRead, refetch: refetchMerchant } = useReadContract({
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress }
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
  const { history, isLoading: isLoadingHistory, refetch: refetchHistory } = useMerchantHistory(userAddress);
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
      const stored = JSON.parse(localStorage.getItem('lumipay_optimistic_sessions') || '[]');
      
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
          localStorage.setItem('lumipay_optimistic_sessions', JSON.stringify(pending));
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
    if (!userAddress) return;
    setIsDeactivating(sessionId);
    const formattedId = padHex((sessionId.startsWith('0x') ? sessionId : `0x${sessionId}`) as `0x${string}`, { size: 32 });
    writeContract({
      address: LUMIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'deactivateSession',
      args: [formattedId],
      gas: 500000n,
    });
  };



  // Tombol penyalinan tautan
  const copySessionUrl = (s: any) => {
    const actualId = s.id || s.sessionId;
    const rawDesc = getSavedDescription(actualId, s.description);
    const parsed = parseSessionDescription(rawDesc);
    const typeLower = parsed.type.toLowerCase();
    
    let url = '';
    if (typeLower === 'subscription') {
      url = `${window.location.origin}/subscribe/${actualId}`;
    } else {
      let routePath = 'pay';
      if (typeLower === 'invoice') routePath = 'invoice';
      else if (typeLower === 'checkout') routePath = 'checkout';
      else if (typeLower === 'tip') routePath = 'tip';
      url = `${window.location.origin}/${routePath}/${actualId}`;
    }

    navigator.clipboard.writeText(url);
    setCopiedId(actualId);
    setTimeout(() => setCopiedId(null), 2000);
  };

      {/* ── CONNECTION ALERT BANNER (Only if not connected) ── */}
  const [authPhase, setAuthPhase] = useState<'email' | 'otp' | 'done'>('email');

  if (!ready) return null;
  if (!authenticated && !isConnected) return (
    <div className="fixed inset-0 z-[100] bg-[#FEF7ED] flex items-center justify-center p-6 animate-fade-in overflow-hidden pixel-grid">
      {/* Background glows */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#fc5000]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#fc5000]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full caldera-card p-8 md:p-10 text-center relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-pop-in border border-gray-200/50 overflow-hidden">
        {/* Top Right Home Link (Close) inside the card */}
        <Link href="/" className="absolute top-5 right-5 p-2 text-gray-400 hover:text-slate-900 transition-colors z-[110] rounded-full hover:bg-gray-100" title="Back to Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Link>
        {/* Orange accent top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc5000] via-[#fc5000] to-transparent" />

        {/* Brand Icon - hide during OTP phase */}
        {authPhase === 'email' && (
          <div className="w-20 h-20 bg-[#fc5000]/10 rounded-[2rem] border border-[#fc5000]/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(252,80,0,0.15)] mt-4">
            <Eye className="w-9 h-9 text-[#fc5000]" />
          </div>
        )}

        {/* Title - hide during OTP phase */}
        {authPhase === 'email' && (
          <>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Welcome to LumiPay Commerce
            </h2>
            
            {/* Subtitle */}
            <p className="text-[11px] text-gray-500 leading-relaxed mb-8 font-semibold uppercase tracking-wider">
              Decentralized Payment Checkout & Streaming Protocol
            </p>
          </>
        )}

        {/* Inline Login UI Trigger */}
        <InlineAuth onPhaseChange={setAuthPhase} />

      </div>
    </div>
  );

  // Kalkulasi total murni menggabungkan baseline onchain L1 dengan akumulasi pelunasan sinkronisasi lokal/gasless
  const localRevenueSum = filteredRecentPayments.reduce((sum: number, p: any) => {
    try {
      const amtNum = p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0;
      return sum + amtNum;
    } catch(e) {
      return sum;
    }
  }, 0);

    const displayTotalReceived = Number(formatUnits(totalReceivedRaw, 6));
  const displayTotalTx = Number(totalTransactionsRaw);

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* ── DASHBOARD HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-40">
        <div className="flex flex-col gap-1">
          {/* Status tag — Caldera pill style */}
          {isRegistered && (
            <div className="flex items-center gap-2 mb-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-[#34D399]/10 border-[#34D399]/25 text-[#34D399]">
                <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#34D399]" />
                Verified Merchant
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '-0.02em' }}>
              {isLoadingRead ? (
                <div className="h-8 w-28 bg-white/[0.05] animate-pulse rounded-2xl" />
              ) : (
                <>
                  {isRegistered ? name : 'Anonymous'}
                  {isRegistered && <BadgeCheck className="w-5 h-5 sm:w-7 sm:h-7 text-[#34D399] shrink-0" />}
                </>
              )}
            </h1>

            {!isLoadingRead && !isRegistered && (
              <Link
                href="/dashboard/account?tab=Merchant Setting"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fc5000]/10 border border-[#fc5000]/25 rounded-full text-[#fc5000] text-[10px] font-black uppercase tracking-widest hover:bg-[#fc5000] hover:text-white transition-all shrink-0"
              >
                <ShieldAlert className="w-3 h-3" />
                Register
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            href="/dashboard/create"
            className="flex-1 md:flex-none btn-orange px-5 py-2.5 sm:px-6 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-black"
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
            className="p-2.5 bg-gray-50 hover:bg-white/[0.07] rounded-full border border-white/[0.07] text-gray-500 hover:text-slate-900 transition-all flex items-center justify-center h-[40px] w-[40px] disabled:opacity-60"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 transition-all ${isRefreshing ? 'animate-spin text-[#fc5000]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── OPERATIONAL METRICS ── */}
      <div className={`space-y-6 animate-fade-in transition-opacity duration-300 ${isRefreshing ? 'opacity-40' : 'opacity-100'}`}>
        
        {/* UPPER PANE: Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-30">

          {/* Payments Card — Caldera chunky */}
          <div className="lg:col-span-12 caldera-card p-6 flex flex-col justify-between relative z-30 overflow-visible">
            {/* Orange top accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#fc5000]/60 via-[#fc5000]/40 to-transparent rounded-t-3xl" />
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Payments</h2>
              
              {/* DESKTOP & TABLET VIEW: 12-Column Grid Table */}
              <div className="hidden md:block overflow-visible">
                {/* Header Kolom Mini */}
                <div className="grid grid-cols-12 text-[9px] font-black text-gray-500 uppercase tracking-widest pb-2 border-b border-gray-200">
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
                      const rawDescForCount = getSavedDescription(actualId, s.description);
                      const isSub = parseSessionDescription(rawDescForCount).type.toLowerCase() === 'subscription';

                      let linkBuyers = [];
                      if (isSub) {
                        let interval = s.interval;
                        if (!interval) {
                          const match = rawDescForCount.match(/\(Every\s+(\d+)\s+Days\)/i);
                          interval = match ? match[1] : '30';
                        }
                        linkBuyers = (history?.subscriptions || []).filter((sub: any) => 
                          sub.sessionId && actualId && (
                            sub.sessionId.toLowerCase() === actualId.toLowerCase() ||
                            sub.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                            actualId.toLowerCase().includes(sub.sessionId.toLowerCase())
                          )
                        );
                      } else {
                        linkBuyers = filteredRecentPayments.filter((p: any) => 
                          p.sessionId && actualId && (
                            p.sessionId.toLowerCase() === actualId.toLowerCase() ||
                            p.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                            actualId.toLowerCase().includes(p.sessionId.toLowerCase())
                          )
                        );
                      }
                      const salesSum = linkBuyers.reduce((acc: number, p: any) => acc + (p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0), 0);
                      const isNakedAmt = s.amount ? `$${formatUnits(BigInt(s.amount), 6)}` : 'N/A';

                      return (
                        <div key={actualId || idx} className={`grid grid-cols-12 items-center gap-2 group py-2 border-b border-white/[0.03] last:border-0 relative ${activeDropdown === actualId ? 'z-50' : 'z-10'}`}>
                          {/* 1. PAYMENTS */}
                          <Link
                            href={(() => {
                                const rawDesc = getSavedDescription(actualId, s.description);
                                const parsed = parseSessionDescription(rawDesc);
                                const typeLower = parsed.type.toLowerCase();
                                if (typeLower === 'subscription') {
                                  return `/subscribe/${actualId}`;
                                }
                                if (typeLower === 'invoice') return `/invoice/${actualId}`;
                                if (typeLower === 'checkout') return `/checkout/${actualId}`;
                                if (typeLower === 'tip') return `/tip/${actualId}`;
                                return `/pay/${actualId}`;
                            })()}
                            target="_blank"
                            className="col-span-5 flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80"
                            title="Open Live Payment Link (Checkout Page)"
                          >
                            <div className="w-8 h-8 rounded-2xl bg-[#fc5000] flex items-center justify-center text-slate-900 shrink-0 shadow-[0_0_12px_rgba(104,54,232,0.35)] group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(104,54,232,0.50)] transition-all">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                {(() => {
                                  const rawDesc = getSavedDescription(actualId, s.description);
                                  const parsed = parseSessionDescription(rawDesc);
                                  const badge = getBadgeStyles(parsed.type);
                                  return (
                                    <>
                                      <span className={`shrink-0 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border ${badge.bg}`}>
                                        {badge.emoji} {parsed.type}
                                      </span>
                                      <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#fc5000] transition-colors">
                                          {parsed.cleanDesc.replace(/\(Every.*Days\)/i, '').trim() || resolveTokenSymbol(s.token) + ' Paylink'}
                                        </p>
                                        {(s.interval || parsed.cleanDesc.includes('(Every')) && (
                                          <span className="text-[9px] text-[#fc5000] font-bold uppercase tracking-widest block bg-[#fc5000]/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                            {s.interval ? `Every ${s.interval} Days` : parsed.cleanDesc.match(/\((Every.*Days)\)/i)?.[1] || ''}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <p className="text-[9px] text-gray-500 truncate">
                                Created {s.createdAt ? new Date(Number(s.createdAt) * 1000).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </Link>

                          {/* 2. PRICE */}
                          <div className="col-span-2 text-center">
                            <span className="text-xs font-bold text-gray-500">
                              {s.amount ? `$${formatUnits(BigInt(s.amount), 6)} ${resolveTokenSymbol(s.token)}` : 'N/A'}
                            </span>
                          </div>

                          {/* 3. VOLUME */}
                          <div className="col-span-2 text-center leading-tight">
                            <span className="text-xs font-bold text-slate-900 block">${salesSum.toFixed(2)}</span>
                            <span className="text-[8px] text-[#fc5000] font-bold block">{resolveTokenSymbol(s.token)}</span>
                          </div>

                          {/* 4. SALES */}
                          <div className="col-span-2 text-center leading-tight">
                            <span className="text-xs font-bold text-gray-600 block font-mono">{linkBuyers.length}</span>
                            <span className="text-[8px] text-gray-500 font-bold block">{isSub ? 'subscribers' : 'orders'}</span>
                          </div>

                          {/* 5. MANAGE */}
                          <div className="col-span-1 flex items-center justify-end gap-0.5 relative z-50">
                            <button
                              onClick={() => {
                                const linkName = getSavedDescription(actualId, s.description) || resolveTokenSymbol(s.token) + ' Paylink';
                                router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                              }}
                              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-[#fc5000] transition-all rounded-xl hover:bg-[#fc5000]/10"
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
                              className={`w-7 h-7 flex items-center justify-center transition-all rounded-xl border cursor-pointer ${
                                activeDropdown === actualId
                                  ? 'bg-[#fc5000]/15 text-[#fc5000] border-[#fc5000]/30 shadow-sm'
                                  : 'text-gray-500 hover:text-slate-900 border-transparent hover:bg-white/[0.07]'
                              }`}
                              title="Manage Paylink Options"
                            >
                              <span className="text-sm font-black leading-none block">⋮</span>
                            </button>

                            {/* DROPDOWN MENU — Caldera dark panel */}
                            {activeDropdown === actualId && (
                              <div className="absolute right-0 top-9 w-52 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 py-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left pointer-events-auto cursor-default">
                                <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                                  <span className="text-[9px] font-black text-[#fc5000] uppercase tracking-widest block">Manage Paylink</span>
                                  <span className="text-[8px] font-mono text-gray-400 truncate block mt-0.5">{actualId}</span>
                                </div>

                                <div className="p-1.5 space-y-1">
                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const linkName = getSavedDescription(actualId, s.description) || resolveTokenSymbol(s.token) + ' Paylink';
                                      router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-[#fc5000] hover:bg-[#fc5000]/5 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer group"
                                  >
                                    <Users className="w-4 h-4 text-gray-400 group-hover:text-[#fc5000] transition-colors shrink-0" />
                                    <span>View Buyers</span>
                                  </button>

                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copySessionUrl(s);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-[#fc5000] hover:bg-[#fc5000]/5 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer group"
                                  >
                                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#fc5000] transition-colors shrink-0" />
                                    <span>{copiedId === actualId ? 'Copied!' : 'Copy Paylink'}</span>
                                  </button>

                                  <button 
                                    type="button"
                                    disabled={isDeactivating === actualId || isConfirmingDeactivate}
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (window.confirm("Are you sure you want to delete this payment link? This action cannot be undone on the blockchain.")) {
                                        handleDeleteSession(actualId);
                                      }
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer disabled:opacity-50 group"
                                  >
                                    {isDeactivating === actualId || isConfirmingDeactivate ? (
                                      <Loader2 className="w-4 h-4 text-red-500 animate-spin shrink-0" />
                                    ) : (
                                      <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors shrink-0" />
                                    )}
                                    <span>{isDeactivating === actualId || isConfirmingDeactivate ? 'Deleting...' : 'Delete Paylink'}</span>
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
                    const rawDescForCount = getSavedDescription(actualId, s.description);
                    const isSub = parseSessionDescription(rawDescForCount).type.toLowerCase() === 'subscription';

                    let linkBuyers = [];
                    if (isSub) {
                      let interval = s.interval;
                      if (!interval) {
                        const match = rawDescForCount.match(/\(Every\s+(\d+)\s+Days\)/i);
                        interval = match ? match[1] : '30';
                      }
                      linkBuyers = (history?.subscriptions || []).filter((sub: any) => 
                        (!s.amount || sub.amount === s.amount) &&
                        (!s.token || sub.token?.toLowerCase() === s.token?.toLowerCase()) &&
                        sub.interval === interval
                      );
                    } else {
                      linkBuyers = filteredRecentPayments.filter((p: any) => 
                        p.sessionId && actualId && (
                          p.sessionId.toLowerCase() === actualId.toLowerCase() ||
                          p.sessionId.toLowerCase().includes(actualId.toLowerCase()) ||
                          actualId.toLowerCase().includes(p.sessionId.toLowerCase())
                        )
                      );
                    }
                    const salesSum = linkBuyers.reduce((acc: number, p: any) => acc + (p.amount ? Number(formatUnits(BigInt(p.amount), 6)) : 0), 0);
                    const isNakedAmt = s.amount ? `$${formatUnits(BigInt(s.amount), 6)}` : 'N/A';

                    return (
                      <div key={`mob-${actualId || idx}`} className={`p-4 rounded-2xl bg-white border border-white/[0.04] space-y-3 relative group ${activeDropdown === actualId ? 'z-50 ring-1 ring-violet-500/30' : 'z-10'}`}>
                        {/* Top Bar: Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                           <Link 
                            href={(() => {
                                const rawDesc = getSavedDescription(actualId, s.description);
                                const parsed = parseSessionDescription(rawDesc);
                                const typeLower = parsed.type.toLowerCase();
                                if (typeLower === 'subscription') {
                                  return `/subscribe/${actualId}`;
                                }
                                if (typeLower === 'invoice') return `/invoice/${actualId}`;
                                if (typeLower === 'checkout') return `/checkout/${actualId}`;
                                if (typeLower === 'tip') return `/tip/${actualId}`;
                                return `/pay/${actualId}`;
                            })()}
                            target="_blank"
                            className="flex items-center gap-3 min-w-0 transition-opacity hover:opacity-80 flex-1"
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#fc5000] flex items-center justify-center text-slate-900 shrink-0 shadow-md">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1 max-w-full">
                                {(() => {
                                  const rawDesc = getSavedDescription(actualId, s.description);
                                  const parsed = parseSessionDescription(rawDesc);
                                  const badge = getBadgeStyles(parsed.type);
                                  return (
                                    <>
                                      <span className={`shrink-0 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest rounded border ${badge.bg}`}>
                                        {badge.emoji} {parsed.type}
                                      </span>
                                      <div className="flex flex-col min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                          {parsed.cleanDesc.replace(/\(Every.*Days\)/i, '').trim() || resolveTokenSymbol(s.token) + ' Paylink'}
                                        </p>
                                        {(s.interval || parsed.cleanDesc.includes('(Every')) && (
                                          <span className="text-[9px] text-[#fc5000] font-bold uppercase tracking-widest block bg-[#fc5000]/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                            {s.interval ? `Every ${s.interval} Days` : parsed.cleanDesc.match(/\((Every.*Days)\)/i)?.[1] || ''}
                                          </span>
                                        )}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                              <p className="text-[9px] text-gray-500 truncate">
                                Created {s.createdAt ? new Date(Number(s.createdAt) * 1000).toLocaleDateString() : 'recently'}
                              </p>
                            </div>
                          </Link>

                          {/* Manage Shortcuts */}
                          <div className="flex items-center gap-0.5 shrink-0 relative z-50">
                            <button 
                              onClick={() => {
                                const linkName = getSavedDescription(actualId, s.description) || resolveTokenSymbol(s.token) + ' Paylink';
                                router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#fc5000] transition-all rounded-xl hover:bg-white/[0.05]"
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
                                  ? 'bg-[#fc5000]/20 text-[#fc5000] border-violet-500/30 shadow-sm' 
                                  : 'text-gray-500 hover:text-slate-900 border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base font-black leading-none block">⋮</span>
                            </button>

                            {/* Dropdown Mobile */}
                            {activeDropdown === actualId && (
                              <div className="absolute right-0 top-9 w-52 rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 py-1 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left pointer-events-auto cursor-default">
                                <div className="px-3.5 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                                  <span className="text-[9px] font-black text-[#fc5000] uppercase tracking-widest block">Manage Paylink</span>
                                  <span className="text-[8px] font-mono text-gray-400 truncate block mt-0.5">{actualId}</span>
                                </div>

                                <div className="p-1.5 space-y-1">
                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const linkName = getSavedDescription(actualId, s.description) || resolveTokenSymbol(s.token) + ' Paylink';
                                      router.push(`/dashboard/history?filter=${actualId}&name=${encodeURIComponent(linkName)}`);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-[#fc5000] hover:bg-[#fc5000]/5 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer group"
                                  >
                                    <Users className="w-4 h-4 text-gray-400 group-hover:text-[#fc5000] transition-colors shrink-0" />
                                    <span>View Buyers</span>
                                  </button>

                                  <button 
                                    type="button"
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      copySessionUrl(s);
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-gray-700 hover:text-[#fc5000] hover:bg-[#fc5000]/5 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer group"
                                  >
                                    <Copy className="w-4 h-4 text-gray-400 group-hover:text-[#fc5000] transition-colors shrink-0" />
                                    <span>{copiedId === actualId ? 'Copied!' : 'Copy Paylink'}</span>
                                  </button>

                                  <button 
                                    type="button"
                                    disabled={isDeactivating === actualId || isConfirmingDeactivate}
                                    onPointerDown={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (window.confirm("Are you sure you want to delete this payment link? This action cannot be undone on the blockchain.")) {
                                        handleDeleteSession(actualId);
                                      }
                                      setTimeout(() => setActiveDropdown(null), 10);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-500/10 flex items-center gap-2.5 font-bold transition-all text-left cursor-pointer disabled:opacity-50 group"
                                  >
                                    {isDeactivating === actualId || isConfirmingDeactivate ? (
                                      <Loader2 className="w-4 h-4 text-red-500 animate-spin shrink-0" />
                                    ) : (
                                      <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors shrink-0" />
                                    )}
                                    <span>{isDeactivating === actualId || isConfirmingDeactivate ? 'Deleting...' : 'Delete Paylink'}</span>
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
                            <span className="text-xs font-bold text-gray-600 mt-0.5 block">
                              {s.amount ? `$${formatUnits(BigInt(s.amount), 6)} ${resolveTokenSymbol(s.token)}` : 'N/A'}
                            </span>
                          </div>
                          <div className="bg-white/[0.01] p-2 rounded-xl text-center border border-white/[0.02]">
                            <span className="text-[8px] font-bold text-[#fc5000] block uppercase tracking-wider">Volume ({resolveTokenSymbol(s.token)})</span>
                            <span className="text-xs font-black text-slate-900 mt-0.5 block">${salesSum.toFixed(2)}</span>
                          </div>
                          <div className="bg-white/[0.01] p-2 rounded-xl text-center border border-white/[0.02]">
                            <span className="text-[8px] font-bold text-gray-500 block uppercase tracking-wider">{isSub ? 'Subscribers' : 'Orders'}</span>
                            <span className="text-xs font-bold text-gray-600 mt-0.5 block">{linkBuyers.length}</span>
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

        {/* BOTTOM PANE: Transactions */}
        <div className="w-full caldera-card p-8 text-center relative overflow-hidden">
          {/* Orange-purple accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#fc5000]/30 to-[#fc5000]/40 rounded-t-[2.5rem]" />
          {/* Ikon Rantai 3D Bergradasi Ungu/Metalik di Tengah */}
          <div className="w-16 h-16 mx-auto mb-3 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-[#fc5000]/8 rounded-full blur-xl animate-pulse" />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#fc5000]/20 via-gray-50 to-[#fc5000]/10 border border-[#fc5000]/25 flex items-center justify-center shadow-lg relative z-10 rotate-12 group-hover:rotate-0 transition-transform">
              <LinkIcon className="w-5 h-5 text-[#fc5000] stroke-[2.5]" />
            </div>
          </div>

          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight" style={{ fontFamily: 'var(--font-dm-sans)' }}>History Transaction</h3>

          {filteredRecentPayments.length === 0 ? (
            <p className="text-xs text-gray-500 mt-1 font-semibold">No history transactions found.</p>
          ) : (
            <div className="mt-6 text-left overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider text-[9px] border-b border-gray-200 text-center">
                    <th className="pb-3 font-bold px-2">Item Details</th>
                    <th className="pb-3 font-bold px-2">Customer</th>
                    <th className="pb-3 font-bold px-2">Amount</th>
                    <th className="pb-3 font-bold px-2">Date & Time</th>
                    <th className="pb-3 font-bold px-2">Explorer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-600">
                  {filteredRecentPayments.slice(0, 10).map((p: any, idx: number) => {
                    const pAmountFormatted = p.amount ? formatUnits(BigInt(p.amount), 6) : '0.00';
                    const txHash = p.id || '';
                    
                    const matchedSession = rawCreatedSessions.find((s: any) => 
                      s.id?.toLowerCase() === p.sessionId?.toLowerCase() || 
                      s.sessionId?.toLowerCase() === p.sessionId?.toLowerCase()
                    );
                    const rawTitle = matchedSession ? (matchedSession.description || matchedSession.token) : null;
                    const parsedTitle = rawTitle ? parseSessionDescription(rawTitle) : null;
                    const cleanTitle = parsedTitle ? parsedTitle.cleanDesc : null;
                    const badge = parsedTitle ? getBadgeStyles(parsedTitle.type) : null;

                    return (
                      <tr key={idx} className="hover:bg-white transition-colors group">
                        <td className="py-3 px-2 font-mono text-[#fc5000]/90 font-semibold text-center">
                          <div className="flex flex-col items-center space-y-0.5">
                            {cleanTitle && (
                              <div className="flex items-center justify-center gap-1">
                                {badge && (
                                  <span className={`shrink-0 px-1 py-0.2 text-[6px] font-black uppercase tracking-wider rounded border ${badge.bg}`}>
                                    {badge.emoji} {parsedTitle?.type}
                                  </span>
                                )}
                                <span className="text-[9px] font-bold text-slate-900 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 block font-sans w-fit truncate max-w-[120px] mx-auto">
                                  {cleanTitle}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-center gap-1.5 pt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{p.sessionId ? `${p.sessionId.slice(0, 10)}...${p.sessionId.slice(-4)}` : 'N/A'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-2 font-mono text-gray-500 text-center">
                          <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 inline-block">
                            {p.payer ? `${p.payer.slice(0, 8)}...${p.payer.slice(-4)}` : 'Unknown'}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1 font-bold">
                            <span className="text-slate-900">${pAmountFormatted}</span>
                            <span className="text-[9px] text-[#fc5000] ml-0.5">
                              {matchedSession ? resolveTokenSymbol(matchedSession.token) : 'USDC'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-2 text-gray-500 text-[10px] text-center">
                          <span>{new Date(Number(p.timestamp) * 1000).toLocaleDateString()} {new Date(Number(p.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>

                        <td className="py-3 px-2 text-center">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1 text-[11px] text-[#fc5000] hover:text-[#fc5000] font-bold bg-white/[0.03] hover:bg-white px-2 py-0.5 rounded border border-gray-200 transition-all mx-auto"
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
                <Link href="/dashboard/history" className="text-xs text-[#fc5000] hover:text-[#fc5000] font-bold hover:underline">
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
