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
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { useMerchantHistory } from '@/lib/hooks/useMerchantHistory';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const createdSessions = history?.sessions || [];
  const recentPayments = history?.payments || [];

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

  // Kalkulasi total murni berbasis data onchain aktual L1
  const displayTotalReceived = Number(formatUnits(totalReceivedRaw, 6));
  const displayTotalTx = Number(totalTransactionsRaw);

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

      {/* ── State Terdaftar / Metrik Operasional ── */}
      <div className="space-y-8 animate-fade-in">
        
        {/* Kartu Metrik Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settled Revenue</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Auto Bridged
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-4xl font-black text-white tracking-tight">
                ${displayTotalReceived.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-violet-400">USDC</span>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
              <span>Finality routing</span>
              <span className="text-gray-400 font-semibold">&lt; 1s settlement</span>
            </div>
          </div>

          <div className="card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed Orders</span>
              <div className="p-1 rounded-lg bg-white/[0.04] text-violet-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-4xl font-black text-white tracking-tight mt-1">
              {displayTotalTx}
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
              <span>Verification source</span>
              <span className="text-gray-400 font-semibold">Contract Intercepted</span>
            </div>
          </div>

          <div className="card p-6 relative overflow-hidden group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Store Profile Spec</span>
                <span className="badge-violet">Decentralized</span>
              </div>
              <div className="text-sm font-bold text-white mt-2 leading-snug line-clamp-2">
                {metadata || 'Standard Unified Checkout Gateway'}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
              <span>Memory layer</span>
              <span className="text-violet-400/90 font-mono">Goldsky Subgraph</span>
            </div>
          </div>

        </div>

        {/* ── ETALASE DAFTAR SESI PEMBAYARAN YANG DIBUAT (CREATION HISTORY) ── */}
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Active Payment Endpoints</h3>
                <span className="text-xs font-bold bg-violet-600/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                  {createdSessions.length} Endpoints
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Issued smart dispatches dynamically indexed from Goldsky Subgraph.
              </p>
            </div>

            {isRegistered && (
              <Link 
                href="/dashboard/create"
                className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5 self-start sm:self-auto font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 text-violet-400" /> Issue Smart Endpoint
              </Link>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">Loading indexed endpoints...</p>
            </div>
          ) : createdSessions.length === 0 ? (
            <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5">
              <LinkIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400">No payment link endpoints instantiated yet.</p>
              <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
                {isRegistered ? (
                  <>Click <span className="text-violet-400 font-semibold">Issue Smart Endpoint</span> above to publish decentralized billings.</>
                ) : (
                  <>Verify your account first to generate active dispatch URLs.</>
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {createdSessions.map((s: any, idx: number) => {
                const amtFormatted = s.amount ? formatUnits(BigInt(s.amount), 6) : '0.00';
                
                return (
                  <div 
                    key={s.id || idx} 
                    className={`p-4 rounded-2xl bg-black/40 border transition-all relative overflow-hidden flex flex-col justify-between space-y-3 ${
                      s.paid 
                        ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.02] to-transparent' 
                        : 'border-white/5 hover:border-violet-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                          <span>${amtFormatted}</span>
                          <span className="text-[10px] text-violet-400 font-bold">USDC</span>
                        </span>
                        <p className="text-[11px] text-gray-400 truncate font-medium mt-0.5">
                          Decentralized Gateway Order
                        </p>
                      </div>

                      <div className="shrink-0">
                        {s.paid ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Settled ✓
                          </span>
                        ) : (
                          <span className="bg-white/[0.03] text-gray-400 border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-violet-400" /> Active
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.02] flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-gray-600 truncate max-w-[150px]" title={s.id}>
                        ID: {s.id ? `${s.id.slice(0, 10)}...` : '0x...'}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => copySessionUrl(s.id)}
                          className="px-2.5 py-1 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/5 text-[11px] text-violet-300 font-bold transition-all flex items-center gap-1"
                        >
                          {copiedId === s.id ? (
                            <span className="text-emerald-400 font-bold">Copied!</span>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-gray-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <Link
                          href={`/pay/${s.id}`}
                          target="_blank"
                          className="p-1.5 bg-violet-600/10 hover:bg-violet-600/20 rounded-lg border border-violet-500/20 text-violet-400 transition-all"
                          title="Open Universal Checkout Link"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* ── TABEL RIWAYAT KUITANSI PEMBELI (LIVE SETTLEMENT RECEIPTS) ── */}
        <div className="glass-panel p-6 sm:p-8 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Live Settlement Receipts</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Auto-capturing completed peer-to-peer transfers from Goldsky.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs text-violet-300 self-start sm:self-auto">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              <span className="font-bold text-[11px]">Goldsky Synchronized</span>
            </div>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/5">
              <Layers className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-400">No incoming buyer settlement receipts verified yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                    <th className="pb-3 font-bold px-2">Session Hash</th>
                    <th className="pb-3 font-bold px-2">Payer Hash Identity</th>
                    <th className="pb-3 font-bold px-2">Settled Asset</th>
                    <th className="pb-3 font-bold px-2">Timestamp</th>
                    <th className="pb-3 font-bold text-right px-2">Verification Registry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                  {recentPayments.slice(0, 10).map((p: any, idx: number) => {
                    const pAmountFormatted = p.amount ? formatUnits(BigInt(p.amount), 6) : '0.00';
                    const txHash = p.id || '';
                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        
                        <td className="py-3.5 px-2 font-mono text-violet-300/90 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p.sessionId ? `${p.sessionId.slice(0, 10)}...${p.sessionId.slice(-4)}` : 'N/A'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-2 font-mono text-gray-400">
                          <span className="bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                            {p.payer ? `${p.payer.slice(0, 8)}...${p.payer.slice(-4)}` : 'Unknown'}
                          </span>
                        </td>

                        <td className="py-3.5 px-2">
                          <span className="font-black text-white">${pAmountFormatted}</span>
                          <span className="text-[10px] text-violet-400 font-bold ml-1">USDC</span>
                        </td>

                        <td className="py-3.5 px-2 text-gray-500">
                          <span>{new Date(Number(p.timestamp) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>

                        <td className="py-3.5 px-2 text-right">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                          >
                            <span>ArcScan L1</span>
                            <ExternalLink className="w-3 h-3" />
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
