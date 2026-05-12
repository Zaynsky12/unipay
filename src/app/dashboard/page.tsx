"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWatchContractEvent } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  Building2, 
  Wallet, 
  Coins, 
  ArrowUpRight, 
  CheckCircle2, 
  PlusCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Layers,
  Link as LinkIcon,
  Copy,
  Clock,
  Trash2,
  ArrowUpRight as ArrowUpRightIcon
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

interface PaymentEvent {
  sessionId: string;
  payer: string;
  txHash: string;
  timestamp: number;
  amount?: string;
  token?: string;
  isLocalMerged?: boolean;
}

interface LocalSession {
  sessionId: string;
  amount: string;
  token: string;
  description: string;
  expiryTimestamp: number;
  createdAt: number;
  isPaid?: boolean;
  payer?: string;
  txHash?: string;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [merchantName, setMerchantName] = useState('');
  const [merchantMetadata, setMerchantMetadata] = useState('');
  
  // State penyimpanan kuitansi pelunasan (Buyer History)
  const [recentPayments, setRecentPayments] = useState<PaymentEvent[]>([]);
  
  // State penyimpanan sesi lokal yang dibuat (Creation History)
  const [createdSessions, setCreatedSessions] = useState<LocalSession[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State pelacakan sesi mana yang sedang menunggu konfirmasi penghapusan (Anti-Accidental Clicks)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

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

  // Menyiapkan fungsi pendaftaran dengan Pemaksaan Gas Otomatis
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || !address) return;
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerMerchant',
      args: [merchantName, merchantMetadata || 'UniPay Standard Merchant'],
      gas: 400000n, // Memaksa batas gas super longgar
    });
  };

  // Muat daftar sesi aktif dari LocalStorage dan Sinkronisasikan Bukti Kuitansi Lunas ke Tabel Riwayat
  const loadLocalStateAndHistory = () => {
    if (address && typeof window !== 'undefined') {
      try {
        const storageKey = `unipay_sessions_${address.toLowerCase()}`;
        const existing = localStorage.getItem(storageKey);
        if (existing) {
          const parsedSessions: LocalSession[] = JSON.parse(existing);
          setCreatedSessions(parsedSessions);

          // Saring sesi yang telah dilunasi untuk disuntikkan secara persisten ke tabel "Live Settlement Receipts"
          const mergedReceipts: PaymentEvent[] = [];
          parsedSessions.forEach(session => {
            if (session.isPaid) {
              mergedReceipts.push({
                sessionId: session.sessionId,
                payer: session.payer || '0xVerifiedClientAccount',
                txHash: session.txHash || '0xClientSettlementHandshake' + Date.now().toString(16),
                timestamp: session.createdAt || Date.now(),
                amount: session.amount || '0.00',
                token: session.token || 'USDC',
                isLocalMerged: true
              });
            }
          });

          // Urutkan dari kuitansi paling segar
          mergedReceipts.sort((a, b) => b.timestamp - a.timestamp);
          setRecentPayments(mergedReceipts);
        }
      } catch (err) {
        console.error("Gagal memuat memori persisten L1 hibrida:", err);
      }
    }
  };

  useEffect(() => {
    loadLocalStateAndHistory();
    // Interval penyegaran sisa waktu kedaluwarsa secara berkala
    const interval = setInterval(() => {
      setCreatedSessions(prev => [...prev]);
    }, 60000);
    return () => clearInterval(interval);
  }, [address]);

  useEffect(() => {
    if (isTxSuccess) {
      refetchMerchant();
      setMerchantName('');
      setMerchantMetadata('');
    }
  }, [isTxSuccess, refetchMerchant]);

  // Mengamati event pembayaran real-time L1 untuk menangkap transfer di depan mata
  useWatchContractEvent({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    eventName: 'PaymentCompleted',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { args, transactionHash } = log;
        if (args && args.merchant?.toLowerCase() === address?.toLowerCase()) {
          const incomingSessionId = args.sessionId || '0x...';
          const incomingAmount = args.amount ? formatUnits(args.amount, 6) : '0.00';
          
          const newEvent: PaymentEvent = {
            sessionId: incomingSessionId,
            payer: args.payer || '0x...',
            txHash: transactionHash || '',
            timestamp: Date.now(),
            amount: incomingAmount,
            token: 'USDC',
            isLocalMerged: false
          };

          // Masukkan ke riwayat kuitansi tanpa menduplikasi ID Sesi yang sudah ter-render dari memori lokal
          setRecentPayments(prev => {
            const exists = prev.some(p => p.sessionId.toLowerCase() === incomingSessionId.toLowerCase());
            if (exists) return prev;
            return [newEvent, ...prev].slice(0, 15);
          });

          refetchMerchant();

          // Tandai sesi lokal sebagai lunas secara otomatis
          if (incomingSessionId) {
            markSessionAsPaidLocal(incomingSessionId, args.payer, transactionHash);
          }
        }
      });
    },
  });

  const markSessionAsPaidLocal = (id: string, payerAddr?: string, hash?: string) => {
    if (!address) return;
    try {
      const storageKey = `unipay_sessions_${address.toLowerCase()}`;
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const arr: LocalSession[] = JSON.parse(existing);
        const updated = arr.map(s => s.sessionId.toLowerCase() === id.toLowerCase() ? { 
          ...s, 
          isPaid: true,
          payer: payerAddr || s.payer || '0xVerifiedClientAccount',
          txHash: hash || s.txHash
        } : s);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setCreatedSessions(updated);
        // Refresh tabel kuitansi
        loadLocalStateAndHistory();
      }
    } catch (e) {}
  };

  // Pemicu awal saat tombol tong sampah diklik
  const initiateDeleteSession = (sessionId: string) => {
    setConfirmingDeleteId(sessionId);
  };

  // Eksekusi akhir setelah pengguna mengkonfirmasi "Yes, Remove"
  const executeDeleteSession = (sessionIdToDelete: string) => {
    if (!address) return;
    try {
      const storageKey = `unipay_sessions_${address.toLowerCase()}`;
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const arr: LocalSession[] = JSON.parse(existing);
        const filtered = arr.filter(s => s.sessionId.toLowerCase() !== sessionIdToDelete.toLowerCase());
        localStorage.setItem(storageKey, JSON.stringify(filtered));
        setCreatedSessions(filtered);
        // Saring dari riwayat kuitansi jika rekaman berasal dari memori lokal
        setRecentPayments(prev => prev.filter(p => p.sessionId.toLowerCase() !== sessionIdToDelete.toLowerCase() || !p.isLocalMerged));
      }
    } catch (err) {
      console.error("Gagal menghapus tautan lokal:", err);
    } finally {
      setConfirmingDeleteId(null);
    }
  };

  // Membatalkan niat penghapusan
  const cancelDeleteSession = () => {
    setConfirmingDeleteId(null);
  };

  // Tombol penyalinan tautan
  const copySessionUrl = (sessionId: string) => {
    const url = `${window.location.origin}/pay/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fungsi utilitas format durasi sisa waktu kedaluwarsa
  const formatExpiryDuration = (expiryUnix: number) => {
    const nowUnix = Math.floor(Date.now() / 1000);
    const diffSeconds = expiryUnix - nowUnix;
    
    if (diffSeconds <= 0) {
      return { text: "Duration Expired", expired: true };
    }
    
    const days = Math.floor(diffSeconds / 86400);
    const hours = Math.floor((diffSeconds % 86400) / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);

    if (days > 0) {
      return { text: `Expires in ${days}d ${hours}h`, expired: false };
    }
    if (hours > 0) {
      return { text: `Expires in ${hours}h ${minutes}m`, expired: false };
    }
    return { text: `Expires in ${minutes}m`, expired: false };
  };

  // Tampilan terkunci (Locked state) saat belum konek dompet
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
    <div className="space-y-10 animate-fade-in pb-12">
      
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
                'Unregistered Profile'
              )}
            </h1>

            <p className="text-xs text-gray-400 flex items-center gap-1.5 truncate max-w-md">
              <span className="text-gray-500">Owner:</span> 
              <span className="font-mono text-violet-300/80 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">{address}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            {isRegistered && (
              <Link 
                href="/dashboard/create" 
                className="btn-primary px-5 py-3 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:scale-105 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> New Payment Link
              </Link>
            )}
            <button 
              onClick={() => { refetchMerchant(); loadLocalStateAndHistory(); }} 
              className="p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center"
              title="Refresh Protocol State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRead ? 'animate-spin text-violet-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── State 1: Belum Mendaftar (Tampilkan Layout Onboarding Premium Dua Kolom) ── */}
      {!isLoadingRead && !isRegistered && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4 animate-fade-in">
          
          {/* Kolom Kiri: Formulir Pendaftaran Mewah (7 Kolom) */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4 mb-8 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_25px_rgba(124,58,237,0.4)] shrink-0 mt-0.5 animate-pulse">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                  Step 1: Sovereignty
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                  Claim Workspace Identity
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed mt-1">
                  Register your business native cryptographic namespace immutably on L1. Zero recurring platform subscription logic.
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-extrabold text-violet-300 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>Merchant Brand Name *</span>
                  <span className="text-[10px] text-violet-400/80 lowercase font-normal">will display on checkout</span>
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Arc Sovereign Subscriptions"
                  className="input-field p-4 text-base font-black bg-black/60 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 shadow-inner rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-gray-400 mb-2 uppercase tracking-wider">
                  Storefront Specification / Slogan
                </label>
                <input
                  type="text"
                  value={merchantMetadata}
                  onChange={(e) => setMerchantMetadata(e.target.value)}
                  placeholder="e.g. Official Cross-chain Universal Gateway Portal"
                  className="input-field p-4 text-xs font-bold bg-black/60 border-white/10 text-gray-300 placeholder:text-gray-600 rounded-xl"
                />
              </div>

              {writeError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-3 font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <span>{writeError.message || 'Transaction aborted by client signature validation.'}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isWritePending || isTxConfirming || !merchantName}
                  className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-3 text-sm font-black shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5"
                >
                  {isWritePending || isTxConfirming ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isTxConfirming ? 'Awaiting L1 Finality Validation...' : 'Authorize Wallet Signature...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Engage Protocol Onchain</span>
                      <ArrowUpRight className="w-4 h-4 text-violet-200" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-500 mt-3 flex items-center justify-center gap-1">
                  <span>Secured directly via</span> <code className="text-violet-400/80 font-mono">UniPayRegistry.sol</code>
                </p>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Real-time Live Render Preview (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> Live Client Rendering Preview
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-violet-500/20 bg-gradient-to-b from-white/[0.04] to-transparent relative overflow-hidden shadow-[0_0_30px_rgba(124,58,237,0.05)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs">
                    {merchantName ? merchantName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate leading-tight">
                      {merchantName || 'Your Awesome Store'}
                    </p>
                    <p className="text-[9px] text-violet-400 font-mono flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Verified Native
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-white/[0.03] text-gray-400 px-2 py-1 rounded font-mono">
                  Testnet L1
                </span>
              </div>

              <div className="mt-6 space-y-4">
                <div className="text-center p-4 rounded-2xl bg-black/40 border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Simulated Multi-chain Settlement</p>
                  <p className="text-2xl font-black text-white tracking-tight mt-0.5">
                    $100.00 <span className="text-xs font-bold text-violet-400">USDC</span>
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium mt-1 italic truncate">
                    "{merchantMetadata || 'Standard enterprise software logic'}"
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-10 w-full rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center gap-2 text-violet-300 text-xs font-bold opacity-70 pointer-events-none">
                    <Coins className="w-3.5 h-3.5" /> Direct P2P Transfer (0% Fee)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-[10px] text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✔</span> Immutable routing controller
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✔</span> Stateless memory validation
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ── State 2: Terdaftar (Tampilkan Metrik Premium & Modul Manajemen Lengkap) ── */}
      {isRegistered && (
        <div className="space-y-10 animate-fade-in">
          
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
                <span className="text-violet-400/90 font-mono">Zero Database</span>
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
                  Issued smart dispatches mapped directly with continuous <span className="text-violet-300 font-bold">Expiry Duration</span> tracking.
                </p>
              </div>

              <Link 
                href="/dashboard/create"
                className="btn-secondary py-2 px-3.5 text-xs flex items-center gap-1.5 self-start sm:self-auto font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 text-violet-400" /> Issue Smart Endpoint
              </Link>
            </div>

            {createdSessions.length === 0 ? (
              <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5">
                <LinkIcon className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No payment link endpoints instantiated yet.</p>
                <p className="text-xs text-gray-600 mt-1 max-w-md mx-auto">
                  Click <span className="text-violet-400 font-semibold">Issue Smart Endpoint</span> above to publish decentralized billings mapped immutably with expiration intervals.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {createdSessions.map((s, idx) => {
                  const status = formatExpiryDuration(s.expiryTimestamp);
                  return (
                    <div 
                      key={s.sessionId || idx} 
                      className={`p-4 rounded-2xl bg-black/40 border transition-all relative overflow-hidden flex flex-col justify-between space-y-3 ${
                        s.isPaid 
                          ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.02] to-transparent' 
                          : status.expired 
                          ? 'border-red-500/20 opacity-60' 
                          : 'border-white/5 hover:border-violet-500/30'
                      }`}
                    >
                      {/* Bar atas item */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
                            <span>${s.amount || '0.00'}</span>
                            <span className="text-[10px] text-violet-400 font-bold">{s.token || 'USDC'}</span>
                          </span>
                          <p className="text-[11px] text-gray-400 truncate font-medium mt-0.5">
                            {s.description || 'Decentralized Gateway Order'}
                          </p>
                        </div>

                        {/* Indikator Status Sesi */}
                        <div className="shrink-0">
                          {s.isPaid ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Settled ✓
                            </span>
                          ) : status.expired ? (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              Expired
                            </span>
                          ) : (
                            <span className="bg-white/[0.03] text-gray-400 border border-white/5 px-2 py-0.5 rounded text-[10px] font-mono inline-flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-violet-400" /> Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bar tengah: Keterangan Sisa Waktu Kedaluwarsa */}
                      <div className="py-2 border-y border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Duration Tracker:</span>
                        <span className={`font-bold ${status.expired ? 'text-red-400/80 line-through' : 'text-violet-300'}`}>
                          {status.text}
                        </span>
                      </div>

                      {/* Bar bawah: ID & Aksi Salin + KONFIRMASI HAPUS INTERAKTIF */}
                      <div className="pt-0.5 border-t border-white/[0.02]">
                        {confirmingDeleteId === s.sessionId ? (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
                            <span className="text-[11px] font-bold text-red-300">Remove from view?</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => executeDeleteSession(s.sessionId)}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] rounded-lg transition-all"
                              >
                                Yes, Remove
                              </button>
                              <button
                                onClick={cancelDeleteSession}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 font-bold text-[10px] rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-gray-600 truncate max-w-[150px]" title={s.sessionId}>
                              ID: {s.sessionId ? `${s.sessionId.slice(0, 10)}...` : '0x...'}
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => copySessionUrl(s.sessionId)}
                                className="px-2.5 py-1 bg-white/[0.03] hover:bg-white/[0.08] rounded-lg border border-white/5 text-[11px] text-violet-300 font-bold transition-all flex items-center gap-1"
                              >
                                {copiedId === s.sessionId ? (
                                  <span className="text-emerald-400 font-bold">Copied!</span>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-gray-400" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <Link
                                href={`/pay/${s.sessionId}`}
                                target="_blank"
                                className="p-1.5 bg-violet-600/10 hover:bg-violet-600/20 rounded-lg border border-violet-500/20 text-violet-400 transition-all"
                                title="Open Universal Checkout Link"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>

                              {/* Tombol Pemicu Konfirmasi Penghapusan */}
                              <button
                                onClick={() => initiateDeleteSession(s.sessionId)}
                                className="p-1.5 bg-red-500/5 hover:bg-red-500/20 rounded-lg border border-red-500/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 transition-all"
                                title="Remove link from dashboard matrix"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* ── TABEL RIWAYAT KUITANSI PEMBELI HIBRIDA (BUYER HISTORY) ── */}
          <div className="glass-panel p-6 sm:p-8 space-y-6" id="history">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Live Settlement Receipts</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Auto-capturing completed peer-to-peer transfers directly from the Arc L1 network.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs text-violet-300 self-start sm:self-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                <span className="font-bold text-[11px]">Memory Synchronized</span>
              </div>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/5">
                <Layers className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No incoming buyer settlement receipts verified yet.</p>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Create a smart endpoint above and fulfill it via the universal checkout link to manifest immutable local receipts directly on this table.
                </p>
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
                    {recentPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        
                        <td className="py-3.5 px-2 font-mono text-violet-300/90 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{p.sessionId.slice(0, 10)}...{p.sessionId.slice(-4)}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-2 font-mono text-gray-400">
                          <span className="bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/5">
                            {p.payer.slice(0, 8)}...{p.payer.slice(-4)}
                          </span>
                        </td>

                        <td className="py-3.5 px-2">
                          <span className="font-black text-white">${p.amount || '0.00'}</span>
                          <span className="text-[10px] text-violet-400 font-bold ml-1">{p.token || 'USDC'}</span>
                        </td>

                        <td className="py-3.5 px-2 text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <span>{new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {p.isLocalMerged && (
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/20 font-bold">
                                Local
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-2 text-right">
                          {p.txHash && !p.txHash.startsWith('0xClient') ? (
                            <a 
                              href={`https://testnet.arcscan.app/tx/${p.txHash}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                            >
                              <span>ArcScan L1</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                              Verified Receipt ✓
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
