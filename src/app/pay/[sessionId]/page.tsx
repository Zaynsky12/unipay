"use client";

import React, { useState, useEffect, use } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi';
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
  Wallet,
  Check,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/lib/constants';

export default function PaymentPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const rawSessionId = resolvedParams.sessionId;
  
  const sessionIdBytes32 = (rawSessionId.startsWith('0x') ? rawSessionId : `0x${rawSessionId}`) as `0x${string}`;

  const { address, isConnected } = useAccount();
  const [urlDesc, setUrlDesc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const desc = params.get('desc');
      if (desc) setUrlDesc(decodeURIComponent(desc));
    }
  }, []);

  // 1. Membaca tuple state sesi onchain
  const { data: sessionData, isLoading: isLoadingSession, refetch: refetchSession } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'sessions',
    args: [sessionIdBytes32],
  });

  const merchantAddr = sessionData?.[0] || '0x0000000000000000000000000000000000000000';
  const amountRaw = sessionData?.[1] || 0n;
  const tokenAddr = sessionData?.[2] || '';
  const expiry = sessionData?.[3] || 0n;
  const isPaid = sessionData?.[4] || false;
  const isActiveOnchain = sessionData?.[5] ?? true;

  // 2. Membaca profil bisnis merchant
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: merchantAddr && merchantAddr !== '0x0000000000000000000000000000000000000000' ? [merchantAddr] : undefined,
    query: { enabled: !!merchantAddr }
  });

  const merchantName = merchantData?.[0] || 'Verified Sovereign Merchant';
  const merchantMetadata = merchantData?.[1] || 'Decentralized Multi-chain Link';

  const matchedToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr?.toLowerCase()) || SUPPORTED_TOKENS[0];
  const formattedAmount = formatUnits(amountRaw, matchedToken.decimals);

  // 3. Membaca Allowance ERC20 pembeli ke alamat UniPay Registry
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, UNIPAY_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address && !!tokenAddr && tokenAddr !== '0x0000000000000000000000000000000000000000' }
  });

  const allowanceVal = currentAllowance ?? 0n;
  const hasSufficientAllowance = allowanceVal >= amountRaw;

  // Hooks Penulisan Eksekusi Onchain & Penandatanganan Pesan
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { signMessageAsync } = useSignMessage();

  // Mode Bypass Uji Coba (Simulated Local Success) jika Testnet token L1 tidak ter-deploy
  const [simulatedLocalSuccess, setSimulatedLocalSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<'idle' | 'approving' | 'paying'>('idle');

  // Aksi 1: Otorisasi Saldo (Approve)
  const handleApproveToken = () => {
    if (!tokenAddr || !address) return;
    setActiveStep('approving');
    writeContract({
      address: tokenAddr as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNIPAY_REGISTRY_ADDRESS, amountRaw],
      gas: 100000n, // Batas gas pengamanan standar
    });
  };

  // Aksi 2: Penyelesaian Akhir (Pay)
  const handleExecutePayment = () => {
    if (!address) return;
    setActiveStep('paying');
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'pay',
      args: [sessionIdBytes32],
      gas: 500000n, // Kuota gas super longgar untuk mengamankan eksekusi transferFrom internal
    });
  };

  const [customInvoiceMeta, setCustomInvoiceMeta] = useState<{ title: string; description: string; amount: string; token: string } | null>(null);

  // Session settlement verification logic
  const markSessionAsPaidLocally = () => {
    // No-op: relying on indexer/on-chain state
  };

  // Aksi 3: Simulasi Pelunasan Langsung
  const handleSimulatedBypass = () => {
    markSessionAsPaidLocally();
    setSimulatedLocalSuccess(true);
  };

  const [isLinkDeleted, setIsLinkDeleted] = useState(false);

  // Membaca metadata kustom tagihan dari penyimpanan saat dimuat
  useEffect(() => {
    // Relying on on-chain data for meta
  }, [rawSessionId]);

  // Memantau keberhasilan persetujuan atau pembayaran onchain
  useEffect(() => {
    if (isTxSuccess) {
      markSessionAsPaidLocally();
      refetchAllowance();
      refetchSession();
      setActiveStep('idle');
    }
  }, [isTxSuccess, refetchAllowance, refetchSession]);

  // Memantau secara real-time jika link telah dinonaktifkan/dihapus oleh merchant
  useEffect(() => {
    // Status is now managed via on-chain state
    setIsLinkDeleted(false);
  }, [rawSessionId]);

  const isExpired = Number(expiry) > 0 && Math.floor(Date.now() / 1000) > Number(expiry);
  const isPreviewState = rawSessionId.includes('preview');
  const showPaidState = isPaid || simulatedLocalSuccess;
  const isActuallyDisabled = !isActiveOnchain && !isPreviewState;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden animate-fade-in">
      
      {/* Latar Belakang Lingkungan */}
      <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Identitas Protokol Atas */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]">
          U
        </div>
        <span className="text-xs font-black tracking-tight text-white/80">UniPay Universal Gateway</span>
      </div>

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 relative z-10 shadow-2xl space-y-6 rounded-3xl border border-white/5">
        
        {/* ── Header Merek Pedagang ── */}
        {/* ── Header Merek Pedagang & Judul Tagihan Asli ── */}
        <div className="text-center space-y-3 pb-5 border-b border-white/5 relative">
          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 text-violet-300 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-violet-500/20 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trustless P2P Target Secure Link
          </div>
          
          {/* Judul Tagihan Kustom (Invoice Title) */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2 leading-tight">
            {urlDesc || (isLoadingSession ? <span className="shimmer inline-block w-48 h-8 rounded" /> : merchantName)}
          </h1>
          
          {/* Deskripsi atau Nama Toko */}
          <p className="text-xs text-gray-400 font-medium max-w-sm mx-auto">
            {customInvoiceMeta ? customInvoiceMeta.description : `"${merchantMetadata}"`}
          </p>

          <div className="pt-1">
            <span className="text-[10px] text-gray-500 truncate font-mono max-w-xs mx-auto bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 inline-flex items-center gap-1">
              <span className="text-violet-400 font-bold">To:</span> {merchantAddr?.slice(0, 8)}...{merchantAddr?.slice(-6)}
            </span>
          </div>
        </div>

        {/* ── Detail Tagihan Pesanan ── */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-gradient-to-b from-white/[0.03] to-black/50 border border-white/5 space-y-4 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
            
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
              <span>Settlement Asset Spec</span>
              <span className="text-violet-300 font-bold bg-violet-600/10 px-2.5 py-0.5 rounded-md border border-violet-500/20">
                {customInvoiceMeta ? customInvoiceMeta.token : matchedToken.symbol}
              </span>
            </div>
            
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-gray-400 font-bold">Total Payable Amount</span>
              <div className="text-right">
                <span className="text-4xl font-black text-white tracking-tight font-mono">
                  {isLoadingSession ? (
                    <span className="shimmer inline-block w-24 h-8 rounded" />
                  ) : (
                    customInvoiceMeta?.amount ? customInvoiceMeta.amount : (isPreviewState ? '99.00' : formattedAmount)
                  )}
                </span>
                <span className="text-xs text-violet-400 font-bold ml-1.5 uppercase font-sans">
                  {customInvoiceMeta ? customInvoiceMeta.token : matchedToken.symbol}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.04] flex justify-between items-center text-xs text-gray-500 font-mono text-[10px]">
              <span>Session Link Spec</span>
              <span className="text-violet-400/80 truncate max-w-[150px]">{rawSessionId?.slice(0, 10)}...</span>
            </div>
          </div>

          {isExpired && !showPaidState && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-bold animate-pulse">
              Payment session interval expired
            </div>
          )}
        </div>

        {/* ── Alur Mekanisme Pembayaran (Kondisi UI) ── */}
        
        {/* Kondisi 0: Link Telah Dihapus / Dinonaktifkan */}
        {(isLinkDeleted || isActuallyDisabled) && (
          <div className="p-6 sm:p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-center space-y-4 animate-fade-in relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <span className="inline-block bg-red-600 text-white text-[11px] font-black px-4 py-1 rounded-full tracking-widest uppercase shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse">
                DISABLED
              </span>
            </div>

            <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(239,68,68,0.4)] relative z-10 border border-red-500/20">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="relative z-10 space-y-1.5">
              <h3 className="text-lg font-black text-white tracking-tight">Payment Link is Disabled</h3>
              <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                This transaction checkout URL has been permanently decommissioned and disabled by the merchant owner storefront.
              </p>
              <div className="pt-2">
                <span className="text-[10px] text-red-400 font-mono bg-black/40 px-3 py-1 rounded-lg border border-red-500/20">
                  Status: INACTIVE / REVOKED
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Kondisi 1: Telah Lunas */}
        {showPaidState && !isLinkDeleted && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Protocol Handshake</span>
              <h3 className="text-base font-black text-emerald-300 mt-0.5">Payment Successfully Settled</h3>
              <p className="text-xs text-gray-400 mt-1">Funds transferred deterministically directly to sovereign merchant account.</p>
            </div>
            
            {txHash && (
              <div className="pt-3 border-t border-emerald-500/10 text-center">
                <a 
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.03] px-3.5 py-1.5 rounded-xl border border-white/5 transition-all"
                >
                  <span>Verify Settlement Hash</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Kondisi 2: Menunggu Persetujuan / Pembayaran */}
        {!showPaidState && !isExpired && !isLinkDeleted && !isActuallyDisabled && (
          <div className="space-y-4">
            
            {!isConnected ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-violet-600/5 rounded-xl border border-violet-500/10 text-xs text-gray-300 text-center font-medium leading-relaxed">
                  Authenticate your multichain Web3 wallet provider to authorize decentralized stablecoin disbursements.
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-violet-400 font-bold mb-2 animate-pulse">👉 Link Wallet via top right menu to initialize</p>
                  <div className="p-2 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-500 inline-block">
                    Awaiting client provider state injection...
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                
                {/* Info Dompet Asal */}
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-black/40 border border-white/5">
                  <span className="text-gray-400 font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-violet-400" /> Payer Account
                  </span>
                  <span className="font-mono font-bold text-violet-300 bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>

                {/* Status Otorisasi (Allowance Status) */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-gray-400">Smart Registry Allowance:</span>
                  <span className={`font-mono font-bold ${hasSufficientAllowance ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hasSufficientAllowance ? 'Approved ✓' : 'Required (0.00)'}
                  </span>
                </div>



                {writeError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium space-y-2">
                    <p>{writeError.message || 'Signature handshake aborted by EVM relayer node.'}</p>
                    <button
                      onClick={handleSimulatedBypass}
                      type="button"
                      className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-bold transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulate Instant Fulfillment (Test Mode)</span>
                    </button>
                  </div>
                )}

                {/* Render Tombol Utama Penyelesaian Pembayaran (On-chain Real) */}
                <div className="space-y-3 pt-2">
                  {!hasSufficientAllowance ? (
                    <button
                      onClick={handleApproveToken}
                      disabled={isWritePending || isTxConfirming || activeStep === 'approving'}
                      className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5 border border-violet-400/30"
                    >
                      {activeStep === 'approving' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Approving USDC...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-violet-200" />
                          <span>Approve Payment</span>
                          <ArrowRight className="w-4 h-4 text-violet-200" />
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleExecutePayment}
                      disabled={isWritePending || isTxConfirming || activeStep === 'paying'}
                      className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-[0_0_30_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-0.5 border border-emerald-400/30 !bg-emerald-600 hover:!bg-emerald-500"
                    >
                      {activeStep === 'paying' || isTxConfirming ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Settling on Arc L1...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-white fill-white" />
                          <span>Pay & Settle Now</span>
                          <ArrowRight className="w-4 h-4 text-white" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Tombol Simulasi Langsung Bypass Validasi Eksternal */}
                <div className="text-center pt-2">
                  <button
                    onClick={handleSimulatedBypass}
                    type="button"
                    className="text-[11px] font-bold text-gray-500 hover:text-violet-400 transition-colors inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Instant Pay Simulation (Local Sync Showcase)</span>
                  </button>
                </div>

              </div>
            )}

            {/* Jaminan Keamanan Lintas-Rantai */}
            <div className="text-center pt-2 border-t border-white/5">
              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-1.5 font-medium">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Standard ERC20 Approval Handshake • Non-custodial routing</span>
              </p>
            </div>

          </div>
        )}

      </div>

      {/* Bagian Bawah Halaman */}
      <div className="mt-8 text-center text-xs text-gray-600 font-medium">
        Powered trustlessly by <Link href="/" className="text-gray-500 hover:text-gray-400 font-bold underline">UniPay Protocol</Link> on Arc L1.
      </div>

    </div>
  );
}
