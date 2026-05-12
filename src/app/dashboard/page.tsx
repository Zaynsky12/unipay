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
  ArrowUpRight as ArrowUpRightIcon
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

interface PaymentEvent {
  sessionId: string;
  payer: string;
  txHash: string;
  timestamp: number;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [merchantName, setMerchantName] = useState('');
  const [merchantMetadata, setMerchantMetadata] = useState('');
  const [recentPayments, setRecentPayments] = useState<PaymentEvent[]>([]);

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

  // Menyiapkan fungsi pendaftaran
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || !address) return;
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerMerchant',
      args: [merchantName, merchantMetadata || 'UniPay Standard Merchant'],
    });
  };

  useEffect(() => {
    if (isTxSuccess) {
      refetchMerchant();
      setMerchantName('');
      setMerchantMetadata('');
    }
  }, [isTxSuccess, refetchMerchant]);

  // Mengamati event pembayaran real-time
  useWatchContractEvent({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    eventName: 'PaymentCompleted',
    onLogs(logs) {
      logs.forEach((log: any) => {
        const { args, transactionHash } = log;
        if (args && args.merchant?.toLowerCase() === address?.toLowerCase()) {
          const newEvent: PaymentEvent = {
            sessionId: args.sessionId || '0x...',
            payer: args.payer || '0x...',
            txHash: transactionHash || '',
            timestamp: Date.now(),
          };
          setRecentPayments((prev) => [newEvent, ...prev].slice(0, 10));
          refetchMerchant();
        }
      });
    },
  });

  // Tampilan terkunci (Locked state) saat belum konek dompet
  // Mengarahkan pengguna untuk menggunakan tombol dompet di bilah navigasi atas
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

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      
      {/* ── Banner/Header Dashboard Premium ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900/20 via-indigo-900/10 to-black border border-white/5 p-6 sm:p-8">
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
              onClick={() => refetchMerchant()} 
              className="p-3 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 text-gray-400 hover:text-white transition-all flex items-center justify-center"
              title="Refresh Protocol State"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRead ? 'animate-spin text-violet-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ── State 1: Belum Mendaftar (Tampilkan Form Pendaftaran Elegan) ── */}
      {!isLoadingRead && !isRegistered && (
        <div className="max-w-xl mx-auto glass-panel p-8 relative overflow-hidden group mt-4">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-600/5 to-transparent opacity-50 pointer-events-none" />
          
          <div className="flex items-start gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Initialize Commercial Storefront</h2>
              <p className="text-xs text-gray-400 leading-relaxed mt-1">
                Map your identity onchain. Payment configurations are immutably tied to your public cryptographic address.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-bold text-violet-300/90 mb-1.5 uppercase tracking-wide">
                Merchant Brand Name *
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="e.g. Satoshi Global Merchandise"
                className="input-field p-3.5 text-sm font-bold bg-black/40 border-white/10 focus:border-violet-500/50"
                required
              />
              <p className="text-[10px] text-gray-500 mt-1.5">Visible to users during decentralized checkout validation.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">
                Storefront Description / Metadata
              </label>
              <input
                type="text"
                value={merchantMetadata}
                onChange={(e) => setMerchantMetadata(e.target.value)}
                placeholder="e.g. Official Cross-chain Gateway Portal"
                className="input-field p-3.5 text-xs font-medium bg-black/40 border-white/10"
              />
            </div>

            {writeError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{writeError.message || 'Transaction aborted. Please check wallet parameters.'}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isWritePending || isTxConfirming || !merchantName}
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm mt-3"
            >
              {isWritePending || isTxConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTxConfirming ? 'Finalizing on Arc L1...' : 'Awaiting Wallet Authorization...'}</span>
                </>
              ) : (
                <span>Register Identity Natively</span>
              )}
            </button>
          </form>

          {isTxSuccess && (
            <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2 font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Storefront active! Synchronizing view state...
            </div>
          )}
        </div>
      )}

      {/* ── State 2: Terdaftar (Tampilkan Metrik Premium & Tabel Event) ── */}
      {isRegistered && (
        <>
          {/* Kartu Metrik */}
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
                  ${formatUnits(totalReceivedRaw, 6)}
                </span>
                <span className="text-xs font-bold text-violet-400">USDC</span>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Finality time</span>
                <span className="text-gray-400 font-semibold">&lt; 1 second</span>
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
                {totalTransactionsRaw.toString()}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
                <span>Source route</span>
                <span className="text-gray-400 font-semibold">100% Contract triggered</span>
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
                <span>Backend state</span>
                <span className="text-violet-400/90 font-mono">Zero Database</span>
              </div>
            </div>

          </div>

          {/* Tabel Riwayat Transaksi Real-time */}
          <div className="glass-panel p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Recent Live Dispatches</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Listening asynchronously via <code className="text-violet-400 font-mono bg-white/[0.03] px-1.5 py-0.5 rounded">watchContractEvent</code>
                </p>
              </div>

              <div className="inline-flex items-center gap-2 bg-violet-950/40 border border-violet-500/20 px-3 py-1.5 rounded-full text-xs text-violet-300 self-start sm:self-auto">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                <span className="font-bold text-[11px]">Realtime Socket On</span>
              </div>
            </div>

            {recentPayments.length === 0 ? (
              <div className="p-10 text-center bg-black/20 rounded-2xl border border-white/5">
                <Layers className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No session execution dispatches intercepted yet.</p>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                  Create a specific payment link and fulfill it using any testnet wallet to verify sub-second listener reflection immediately.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                      <th className="pb-3 font-bold px-2">Session Identifier</th>
                      <th className="pb-3 font-bold px-2">Payer Identity</th>
                      <th className="pb-3 font-bold px-2">Intercept Time</th>
                      <th className="pb-3 font-bold text-right px-2">Verification Registry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                    {recentPayments.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-2 font-mono text-violet-300/90 font-semibold">
                          {p.sessionId.slice(0, 12)}...{p.sessionId.slice(-6)}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-gray-400">
                          {p.payer.slice(0, 8)}...{p.payer.slice(-6)}
                        </td>
                        <td className="py-3.5 px-2 text-gray-500">
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <a 
                            href={`https://testnet.arcscan.app/tx/${p.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.03] hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                          >
                            <span>ArcScan L1</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
}
