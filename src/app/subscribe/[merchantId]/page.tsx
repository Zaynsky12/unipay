"use client";

import React, { useState, useEffect, use } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  RefreshCw,
  Wallet,
  Check,
  CalendarDays,
  Repeat
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/lib/constants';

export default function SubscribePage({ params }: { params: Promise<{ merchantId: string }> }) {
  const resolvedParams = use(params);
  const merchantAddr = resolvedParams.merchantId as `0x${string}`;
  
  const { address, isConnected } = useAccount();

  const searchParams = useSearchParams();
  const urlAmount = searchParams.get('amount') || "25";
  const urlInterval = searchParams.get('interval') || "30";
  const urlToken = searchParams.get('token') || "USDC";

  // Konfigurasi Subscription Dinamis dari URL
  const planAmount = urlAmount;
  const token = SUPPORTED_TOKENS.find(t => t.symbol === urlToken) || SUPPORTED_TOKENS[0];
  const amountRaw = parseUnits(planAmount, token.decimals);
  const intervalSeconds = Number(urlInterval) * 24 * 60 * 60;

  // 1. Membaca profil bisnis merchant
  const { data: merchantData, isLoading: isLoadingMerchant } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: [merchantAddr],
    query: { enabled: !!merchantAddr }
  });

  const merchantName = merchantData?.[0] || 'Verified Premium Creator';
  const merchantMetadata = merchantData?.[1] || 'Monthly Access Pass';

  // 2. Membaca Allowance ERC20 pembeli (Dibutuhkan allowance unlimited/besar untuk langganan)
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, UNIPAY_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address }
  });

  // Karena ini langganan, kita asumsikan butuh allowance minimal untuk 12 bulan
  const requiredAllowance = amountRaw * 12n;
  const allowanceVal = currentAllowance ?? 0n;
  const hasSufficientAllowance = allowanceVal >= requiredAllowance;

  // Hooks Penulisan Eksekusi Onchain
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [activeStep, setActiveStep] = useState<'idle' | 'approving' | 'subscribing' | 'success'>('idle');

  // Aksi 1: Otorisasi Saldo Jangka Panjang (Approve)
  const handleApproveToken = () => {
    if (!address) return;
    setActiveStep('approving');
    // Meminta persetujuan tak terbatas (unlimited) atau minimal 1 tahun
    const maxInt = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; 
    writeContract({
      address: token.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [UNIPAY_REGISTRY_ADDRESS, maxInt],
    });
  };

  // Aksi 2: Membuat Langganan (Create Subscription)
  const handleCreateSubscription = () => {
    if (!address) return;
    setActiveStep('subscribing');
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'createSubscription',
      args: [merchantAddr, amountRaw, token.address as `0x${string}`, BigInt(intervalSeconds)],
    });
  };

  useEffect(() => {
    if (isTxSuccess) {
      if (activeStep === 'approving') {
        refetchAllowance();
        setActiveStep('idle');
      } else if (activeStep === 'subscribing') {
        setActiveStep('success');
      }
    }
  }, [isTxSuccess, activeStep, refetchAllowance]);

  const isSuccessState = activeStep === 'success';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden animate-fade-in">
      
      {/* Background Elements */}
      <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Identitas */}
      <div className="absolute top-6 left-6 flex items-center gap-2">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-xs font-black text-slate-900 shadow-[0_0_15px_rgba(37,99,235,0.3)]">
          U
        </div>
        <span className="text-xs font-black tracking-tight text-slate-900/80">UniPay Subscriptions</span>
      </div>

      <div className="w-full max-w-md glass-panel p-6 sm:p-8 relative z-10 shadow-2xl space-y-6 rounded-3xl border border-gray-200">
        
        {/* Header Merchant */}
        <div className="text-center space-y-2 pb-4 border-b border-gray-200">
          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-500/20">
            <Repeat className="w-3.5 h-3.5" /> Recurring Payment Plan
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2">
            {isLoadingMerchant ? <span className="shimmer inline-block w-32 h-6 rounded" /> : merchantName}
          </h1>
          <p className="text-[11px] text-gray-500 italic">"{merchantMetadata}"</p>
        </div>

        {/* Detail Langganan */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>Subscription Token</span>
              <span className="text-blue-300 font-bold bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20">{token.symbol}</span>
            </div>
            
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-gray-500 font-bold">Monthly Charge</span>
              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {planAmount}
                </span>
                <span className="text-xs text-blue-400 font-bold ml-1.5">{token.symbol}</span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-white/[0.04] flex justify-between items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" /> Billing Cycle
              </div>
              <span className="text-gray-600 font-bold">Every {urlInterval} Days</span>
            </div>
          </div>
        </div>

        {/* State Berhasil */}
        {isSuccessState ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Active</span>
              <h3 className="text-base font-black text-emerald-300 mt-0.5">Subscription Activated</h3>
              <p className="text-xs text-gray-500 mt-1">You will be automatically billed every month. Cancel anytime.</p>
            </div>
          </div>
        ) : (
          /* Kondisi Menunggu */
          <div className="space-y-4">
            {!isConnected ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-blue-600/5 rounded-xl border border-blue-500/10 text-xs text-gray-600 text-center font-medium leading-relaxed">
                  Connect your multichain Web3 wallet to authorize recurring stablecoin payments.
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                
                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-blue-400" /> Subscriber Account
                  </span>
                  <span className="font-mono font-bold text-blue-300 bg-white/[0.03] px-2 py-0.5 rounded border border-gray-200">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>

                {writeError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium text-center">
                    {writeError.message || 'Transaction rejected.'}
                  </div>
                )}

                {!hasSufficientAllowance ? (
                  <button
                    onClick={handleApproveToken}
                    disabled={isWritePending || isTxConfirming || activeStep === 'approving'}
                    className="w-full btn-secondary py-4 flex items-center justify-center gap-2 text-sm font-black border-blue-500/30 hover:border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)]"
                  >
                    {isWritePending || isTxConfirming || activeStep === 'approving' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    ) : (
                      <>
                        <span>Step 1: Approve Unlimited USDC</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCreateSubscription}
                    disabled={isWritePending || isTxConfirming || activeStep === 'subscribing'}
                    className="w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black text-slate-900 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all"
                  >
                    {isWritePending || isTxConfirming || activeStep === 'subscribing' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 text-blue-200" />
                        <span>Start Subscription</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-[10px] text-gray-500 font-medium">Non-custodial routing • Cancel at anytime</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-gray-600 font-medium">
        Powered by <Link href="/" className="text-gray-500 hover:text-gray-500 font-bold underline">UniPay Subscriptions</Link>
      </div>

    </div>
  );
}
