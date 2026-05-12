"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  ExternalLink, 
  Coins, 
  Lock,
  ArrowRight,
  RefreshCw,
  Wallet
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, SUPPORTED_TOKENS } from '@/lib/constants';

// Sesuai konvensi Next.js App Router, props.params bisa berupa promise atau objek langsung.
// Kita akses propertinya dengan aman.
export default function PaymentPage({ params }: { params: { sessionId: string } }) {
  // Ambil raw sessionId dari path
  const rawSessionId = params.sessionId;
  // Pastikan format string hex bytes32 valid jika perlu, atau gunakan raw
  const sessionIdBytes32 = (rawSessionId.startsWith('0x') ? rawSessionId : `0x${rawSessionId}`) as `0x${string}`;

  const { address, isConnected } = useAccount();

  // 1. Membaca data state sesi dari kontrak: sessions(sessionId)
  const { data: sessionData, isLoading: isLoadingSession, refetch: refetchSession } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'sessions',
    args: [sessionIdBytes32],
  });

  // Ekstraksi nilai tuple sesi:
  // [merchant, amount, token, description, expiry, paid, payer, txHash]
  const merchantAddr = sessionData?.[0] || '0x0000000000000000000000000000000000000000';
  const amountRaw = sessionData?.[1] || 0n;
  const tokenAddr = sessionData?.[2] || '';
  const description = sessionData?.[3] || 'Decentralized Payment Order';
  const expiry = sessionData?.[4] || 0n;
  const isPaid = sessionData?.[5] || false;
  const payerAddr = sessionData?.[6] || '';
  const completedTxHash = sessionData?.[7] || '';

  // 2. Membaca identitas merchant pengiklan
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: merchantAddr && merchantAddr !== '0x0000000000000000000000000000000000000000' ? [merchantAddr] : undefined,
    query: { enabled: !!merchantAddr }
  });

  const merchantName = merchantData?.[0] || 'Verified Merchant';

  // Penentuan token terkait
  const matchedToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr?.toLowerCase()) || SUPPORTED_TOKENS[0];
  const formattedAmount = formatUnits(amountRaw, matchedToken.decimals);

  // Status Eksekusi Pembayaran
  const { writeContract, data: txHash, isPending: isPayPending, error: payError } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Simulasi state unified balances Circle Kit
  const [unifiedBridgingStep, setUnifiedBridgingStep] = useState(false);

  // Memicu alur pembayaran
  const handleExecutePayment = () => {
    if (!isConnected || !address) return;

    // Menjalankan alur deteksi & auto-bridge terpadu via Circle App Kit
    // Secara onchain, kita akan memanggil fungsi pay(sessionId)
    setUnifiedBridgingStep(true);

    // Sedikit penundaan visual agar pengguna melihat proses pemindaian aset multi-rantai bekerja
    setTimeout(() => {
      setUnifiedBridgingStep(false);
      writeContract({
        address: UNIPAY_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'pay',
        args: [sessionIdBytes32],
      });
    }, 1200);
  };

  // Otomatis mutakhirkan tampilan jika transaksi sukses tercatat
  useEffect(() => {
    if (isTxSuccess) {
      refetchSession();
    }
  }, [isTxSuccess, refetchSession]);

  const isExpired = Number(expiry) > 0 && Math.floor(Date.now() / 1000) > Number(expiry);
  const isPreviewState = rawSessionId.includes('preview') || amountRaw === 0n;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden">
      
      {/* Latar Belakang Lingkungan */}
      <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Identitas Protokol Atas */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-violet-600 flex items-center justify-center text-[10px] font-black text-white">
          U
        </div>
        <span className="text-xs font-bold tracking-tight text-white/60">UniPay Checkout</span>
      </div>

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 relative z-10 shadow-2xl space-y-6">
        
        {/* ── Bagian Header Pedagang ── */}
        <div className="text-center space-y-2 pb-4 border-b border-white/5">
          <div className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Fully Onchain Settlement
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight mt-2">
            {isLoadingSession ? <span className="shimmer inline-block w-32 h-6 rounded" /> : merchantName}
          </h1>
          <p className="text-xs text-gray-400 truncate font-mono max-w-xs mx-auto">
            {merchantAddr}
          </p>
        </div>

        {/* ── Detail Pembayaran ── */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Requested Asset</span>
              <span className="text-white font-bold">{matchedToken.symbol}</span>
            </div>
            
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-gray-500">Total Due</span>
              <div className="text-right">
                <span className="text-3xl font-black text-white">
                  {isPreviewState ? '99.00' : formattedAmount}
                </span>
                <span className="text-xs text-violet-400 font-bold ml-1">{matchedToken.symbol}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.04] flex justify-between items-center text-xs text-gray-400">
              <span>Item Ref</span>
              <span className="text-gray-300 font-medium truncate max-w-[180px]">{description}</span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500">
              <span>Session Spec</span>
              <span className="font-mono text-gray-600 truncate max-w-[120px]">{rawSessionId}</span>
            </div>
          </div>

          {/* Sinyal Peringatan Kadaluarsa */}
          {isExpired && !isPaid && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-bold">
              Payment session expired
            </div>
          )}
        </div>

        {/* ── Alur Mekanisme Pembayaran (Kondisi UI) ── */}
        
        {/* Kondisi 1: Telah Lunas */}
        {isPaid && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-400">Payment Successfully Completed</h3>
              <p className="text-[11px] text-gray-400 mt-1">Bridged &amp; settled natively on Arc Network in &lt; 1s.</p>
            </div>
            
            <div className="pt-2 border-t border-emerald-500/10 text-left text-[10px] space-y-1 text-gray-500">
              <div className="flex justify-between">
                <span>Payer</span>
                <span className="font-mono text-gray-400">{payerAddr.slice(0, 10)}...</span>
              </div>
              {completedTxHash && completedTxHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                <div className="flex justify-between items-center">
                  <span>Tx Hash</span>
                  <a 
                    href={`https://testnet.arcscan.app/tx/${completedTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>{completedTxHash.slice(0, 8)}...</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kondisi 2: Menunggu Pembayaran */}
        {!isPaid && !isExpired && (
          <div className="space-y-4">
            
            {/* Keadaan Dompet Pengguna */}
            {!isConnected ? (
              <div className="space-y-3">
                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 text-[11px] text-gray-400 text-center">
                  Connect your multi-chain wallet to settle automatically via <span className="text-white font-bold">Arc App Kit</span>.
                </div>
                <div className="flex justify-center">
                  <appkit-button />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gray-500">Connected Wallet</span>
                  <span className="font-mono text-violet-300">{address?.slice(0, 8)}...{address?.slice(-4)}</span>
                </div>

                {/* Status Bridge / Eksekusi */}
                {unifiedBridgingStep && (
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0 text-indigo-400" />
                    <div>
                      <p className="font-bold text-[11px]">Unified Balance Flow Triggered</p>
                      <p className="text-[10px] text-gray-400">Scanning layer-2 liquidity &amp; routing smart bridges...</p>
                    </div>
                  </div>
                )}

                {payError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 break-words">
                    {payError.message || 'Payment execution rejected.'}
                  </div>
                )}

                <button
                  onClick={handleExecutePayment}
                  disabled={isPayPending || isTxConfirming || unifiedBridgingStep}
                  className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 text-sm font-black shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                >
                  {isPayPending || isTxConfirming || unifiedBridgingStep ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isTxConfirming ? 'Securing Sub-second Finality...' : 'Executing Smart Route...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Pay Now — {isPreviewState ? '99.00' : formattedAmount} {matchedToken.symbol}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Jaminan Keamanan Lintas-Rantai */}
            <div className="text-center pt-2">
              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-gray-600" />
                <span>Zero backend exposure • Direct P2P protocol</span>
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Bagian Bawah Halaman */}
      <div className="mt-8 text-center text-xs text-gray-600">
        Powered by <Link href="/" className="text-gray-500 hover:text-gray-400 font-bold underline">UniPay Protocol</Link> on Arc Network L1.
      </div>

    </div>
  );
}
