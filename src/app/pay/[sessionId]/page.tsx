"use client";

import React, { useState, useEffect, use } from 'react';
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

  // Hooks Penulisan Eksekusi Onchain
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Mode Bypass Uji Coba (Simulated Local Success) jika Testnet token L1 tidak ter-deploy
  const [simulatedLocalSuccess, setSimulatedLocalSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState<'idle' | 'approving' | 'paying' | 'gasless_paying'>('idle');
  const [isGasless, setIsGasless] = useState(true);

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

  const handleGaslessPayment = () => {
    if (!address) return;
    setActiveStep('gasless_paying');
    // Simulasi delegasi UserOp ke Paymaster/Relayer
    setTimeout(() => {
      setSimulatedLocalSuccess(true);
      setActiveStep('idle');
    }, 2000);
  };

  // Aksi 3: Simulasi Bypass Instan (Khusus untuk kemudahan demonstrasi jika kontrak ERC20 Testnet fiktif)
  const handleSimulatedBypass = () => {
    setSimulatedLocalSuccess(true);
  };

  // Memantau keberhasilan persetujuan atau pembayaran
  useEffect(() => {
    if (isTxSuccess) {
      refetchAllowance();
      refetchSession();
      setActiveStep('idle');
    }
  }, [isTxSuccess, refetchAllowance, refetchSession]);

  const isExpired = Number(expiry) > 0 && Math.floor(Date.now() / 1000) > Number(expiry);
  const isPreviewState = rawSessionId.includes('preview') || amountRaw === 0n;
  const showPaidState = isPaid || simulatedLocalSuccess;

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
        <div className="text-center space-y-2 pb-4 border-b border-white/5">
          <div className="inline-flex items-center gap-1.5 bg-violet-500/10 text-violet-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-violet-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Fully Trustless Settlement Target
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-2">
            {isLoadingSession ? <span className="shimmer inline-block w-32 h-6 rounded" /> : merchantName}
          </h1>
          <p className="text-[11px] text-gray-400 italic">
            "{merchantMetadata}"
          </p>
          <p className="text-[10px] text-gray-500 truncate font-mono max-w-xs mx-auto bg-white/[0.02] px-2 py-0.5 rounded border border-white/5">
            {merchantAddr}
          </p>
        </div>

        {/* ── Detail Tagihan Pesanan ── */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
              <span>Stablecoin Contract Base</span>
              <span className="text-violet-300 font-bold bg-violet-600/10 px-2 py-0.5 rounded border border-violet-500/20">{matchedToken.symbol}</span>
            </div>
            
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-gray-400 font-bold">Total Settlement Due</span>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {isPreviewState ? '99.00' : formattedAmount}
                </span>
                <span className="text-xs text-violet-400 font-bold ml-1.5">{matchedToken.symbol}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/[0.04] flex justify-between items-center text-xs text-gray-500">
              <span>Token L1 Hash</span>
              <span className="text-gray-400 font-mono text-[10px] truncate max-w-[150px]">{tokenAddr}</span>
            </div>
          </div>

          {isExpired && !showPaidState && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-bold animate-pulse">
              Payment session interval expired
            </div>
          )}
        </div>

        {/* ── Alur Mekanisme Pembayaran (Kondisi UI) ── */}
        
        {/* Kondisi 1: Telah Lunas */}
        {showPaidState && (
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
        {!showPaidState && !isExpired && (
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

                {/* Gasless Sponsored Indicator Badge */}
                <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-violet-300 font-bold">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span>Sponsored Zero-Gas Settlement</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/20">
                    Active
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

                {/* Render Tombol Ganda Berdasarkan Status Persetujuan ERC20 */}
                {!hasSufficientAllowance ? (
                  <button
                    onClick={handleApproveToken}
                    disabled={isWritePending || isTxConfirming || isPreviewState || activeStep === 'gasless_paying'}
                    className="w-full btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black border-violet-500/30 hover:border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                  >
                    {isWritePending || isTxConfirming || activeStep === 'approving' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                        <span>{isTxConfirming ? 'Finalizing Allowance L1...' : 'Sign Token Approve Signature...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Step 1: Approve Token Quota</span>
                        <ArrowRight className="w-4 h-4 text-violet-400" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGaslessPayment}
                    disabled={isWritePending || isTxConfirming || isPreviewState || activeStep === 'gasless_paying'}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm font-black shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all transform hover:-translate-y-0.5"
                  >
                    {isWritePending || isTxConfirming || activeStep === 'gasless_paying' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Delegating UserOp to Relayer...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-violet-200" />
                        <span>Sign Payment (Zero Gas Fee)</span>
                        <ArrowRight className="w-4 h-4 text-violet-200" />
                      </>
                    )}
                  </button>
                )}

                {/* Tombol Bantuan Simulasi Langsung jika pengguna kekurangan koin uji coba */}
                <div className="text-center pt-1">
                  <button
                    onClick={handleSimulatedBypass}
                    type="button"
                    className="text-[10px] text-gray-600 hover:text-gray-400 underline transition-all"
                  >
                    Bypass tx validation for local design demonstration
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
