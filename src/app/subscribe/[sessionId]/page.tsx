"use client";

import React, { useState, useEffect, use } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Loader2, 
  ExternalLink, 
  Wallet,
  Globe,
  Mail,
  UserCircle,
  Eye,
  AlertCircle,
  Repeat
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/lib/constants';
import { goldskyClient, GET_SESSION } from '@/lib/goldsky';

export default function SubscribePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const rawSessionId = resolvedParams.sessionId;
  const sessionIdBytes32 = (rawSessionId.startsWith('0x') ? rawSessionId : `0x${rawSessionId}`) as `0x${string}`;

  const { address, isConnected, chainId } = useAccount();

  const [urlDesc, setUrlDesc] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const desc = params.get('desc');
      if (desc) setUrlDesc(decodeURIComponent(desc));
    }
  }, []);

  useEffect(() => {
    const fetchSessionDescription = async () => {
      try {
        const idLower = rawSessionId.toLowerCase();
        const data: any = await goldskyClient.request(GET_SESSION, { id: idLower });
        if (data?.paymentSession?.description) {
          setUrlDesc(data.paymentSession.description);
        }
      } catch (err) {
        console.error("Failed to fetch session description from Goldsky:", err);
      }
    };
    if (rawSessionId) {
      fetchSessionDescription();
    }
  }, [rawSessionId]);

  // 1. Membaca tuple state sesi onchain
  const { data: sessionData, isLoading: isLoadingSession } = useReadContract({
    chainId: 5042002,
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'sessions',
    args: [sessionIdBytes32],
  });

  const merchantAddr = (sessionData as any)?.[0] || '0x0000000000000000000000000000000000000000';
  const amountRaw = (sessionData as any)?.[1] || 0n;
  const tokenAddr = (sessionData as any)?.[2] || '';
  const isActiveOnchain = (sessionData as any)?.[5] ?? true;

  const matchedToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr?.toLowerCase()) || SUPPORTED_TOKENS[0];
  const planAmount = amountRaw ? formatUnits(amountRaw, matchedToken.decimals) : "0";

  const parseSessionDescription = (descString: string) => {
    const str = descString || '';
    const match = str.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      return { type: match[1], cleanDesc: match[2] };
    }
    const lower = str.toLowerCase();
    if (lower.startsWith('subscription')) return { type: 'Subscription', cleanDesc: str };
    return { type: 'Subscription', cleanDesc: str };
  };

  const getBadgeStyles = (type: string) => {
    return {
      bg: 'bg-amber-500/10 border-amber-500/25 text-amber-600',
      emoji: '⚡'
    };
  };

  const parsedDescForInterval = parseSessionDescription(urlDesc || '');
  let intervalDays = 30;
  const intervalMatch = parsedDescForInterval.cleanDesc.match(/\(Every\s+(\d+)\s+Days\)/i);
  if (intervalMatch && intervalMatch[1]) {
    intervalDays = parseInt(intervalMatch[1]);
  }
  const intervalSeconds = intervalDays * 24 * 60 * 60;

  // 2. Membaca profil bisnis merchant
  const { data: merchantData, isLoading: isLoadingMerchant } = useReadContract({
    chainId: 5042002,
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: merchantAddr !== '0x0000000000000000000000000000000000000000' ? [merchantAddr] : undefined,
    query: { enabled: merchantAddr !== '0x0000000000000000000000000000000000000000' }
  });

  const rawMerchantName = (merchantData as any)?.[0] || '';
  const rawMerchantMetadata = (merchantData as any)?.[1] || '';
  const isRegisteredOnchain = (merchantData as any)?.[2] || false;
  const isVerified = isRegisteredOnchain && !!rawMerchantName && rawMerchantName !== 'Anonymous';

  let merchantLogo = '';
  let merchantWebsite = '';
  let merchantEmail = '';

  const displayName = isVerified
    ? rawMerchantName
    : `${merchantAddr.slice(0, 6)}...${merchantAddr.slice(-4)}`;

  if (rawMerchantMetadata && rawMerchantMetadata.includes('{')) {
    try {
      const cleanJson = rawMerchantMetadata.substring(rawMerchantMetadata.indexOf('{'));
      const meta = JSON.parse(cleanJson);
      merchantLogo = meta.logo || '';
      merchantWebsite = meta.website || '';
      merchantEmail = meta.email || '';
    } catch (e) { console.error("Metadata parse error", e); }
  } else {
    // Legacy support
    merchantLogo = '';
    merchantWebsite = '';
    merchantEmail = '';
  }

  // 2. Membaca Allowance ERC20 pembeli
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    chainId: 5042002,
    address: matchedToken.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, LUMIPAY_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!address }
  });

  const requiredAllowance = amountRaw * 12n; // Approx 1 year
  const allowanceVal = (currentAllowance as bigint) ?? 0n;
  const [localApproved, setLocalApproved] = useState(false);
  const hasSufficientAllowance = allowanceVal >= requiredAllowance || localApproved;

  // Hooks Penulisan Eksekusi Onchain
  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [activeStep, setActiveStep] = useState<'idle' | 'approving' | 'subscribing' | 'success'>('idle');

  const handleApproveToken = () => {
    if (!address) return;
    setActiveStep('approving');
    const maxInt = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; 
    writeContract({
      address: matchedToken.address as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [LUMIPAY_REGISTRY_ADDRESS, maxInt],
    });
  };

  const handleCreateSubscription = () => {
    if (!address) return;
    setActiveStep('subscribing');
    writeContract({
      address: LUMIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'createSubscription',
      args: [merchantAddr, amountRaw, matchedToken.address as `0x${string}`, BigInt(intervalSeconds)],
    });
  };

  useEffect(() => {
    if (isTxSuccess) {
      if (activeStep === 'approving') {
        setLocalApproved(true);
        refetchAllowance();
        setActiveStep('idle');
      } else if (activeStep === 'subscribing') {
        setActiveStep('success');
      }
    }
  }, [isTxSuccess, activeStep, refetchAllowance]);

  const isSuccessState = activeStep === 'success';

  if (isLoadingSession || isLoadingMerchant) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#fc5000] animate-spin" />
    </div>
  );

  if (!isActiveOnchain) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full glass-panel p-10 space-y-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto opacity-50" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Paylink Deactivated</h2>
        <p className="text-gray-500 text-sm italic">This subscription link is no longer valid.</p>
        <Link href="/" className="block py-4 text-xs font-black text-violet-400 uppercase tracking-widest border border-violet-500/20 rounded-2xl">Return Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] selection:bg-violet-500/30 font-sans">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#fc5000]/6 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-8 pb-32 sm:pt-16 sm:pb-40">

        {/* ── BILLING CARD (Everything Integrated) ── */}
        <div className="glass-panel rounded-[2.5rem] border border-gray-200 overflow-hidden shadow-2xl relative animate-fade-in-up bg-gray-50 backdrop-blur-3xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#fc5000] via-[#6836e8] to-[#fc5000] animate-shimmer" />

          {/* MERCHANT IDENTITY HEADER */}
          <div className="p-8 sm:p-10 text-center border-b border-gray-200 bg-white/[0.01]">
            <div className="relative mb-4 flex justify-center">
              <div className="absolute w-20 h-20 bg-[#fc5000]/12 rounded-[1.5rem] blur-xl opacity-20" />
              <div className="relative w-20 h-20 bg-white border border-gray-200 rounded-[1.5rem] flex items-center justify-center overflow-hidden shadow-2xl">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-10 h-10 text-[#fc5000] opacity-80" />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight italic">
                  {displayName}
                </h1>
                {isVerified && (
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 fill-emerald-500/10" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4">
                {merchantWebsite && (
                  <a href={merchantWebsite} target="_blank" className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 hover:text-[#fc5000] transition-colors uppercase tracking-widest">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
                {merchantEmail && (
                  <a href={`mailto:${merchantEmail}`} className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 hover:text-[#fc5000] transition-colors uppercase tracking-widest">
                    <Mail className="w-3 h-3" /> {merchantEmail}
                  </a>
                )}
                {!isVerified && (
                  <div className="text-[8px] font-black text-amber-500 uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5">
                    Unverified Merchant
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            {/* Amount Section */}
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Recurring Subscription</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter">${planAmount}</span>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-black text-[#fc5000] uppercase tracking-widest">{matchedToken.symbol}</span>
                  <span className="text-[9px] font-bold text-gray-600 uppercase">per billing</span>
                </div>
              </div>
            </div>

            {/* Description & Details */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-6">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Order Note</p>
                  {(() => {
                    const raw = urlDesc || `Subscription — ${displayName}`;
                    const parsed = parseSessionDescription(raw);
                    const badge = getBadgeStyles(parsed.type);
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                        <span className={`shrink-0 w-fit px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-md border ${badge.bg}`}>
                          {badge.emoji} {parsed.type}
                        </span>
                        <p className="text-sm font-bold text-slate-800 truncate" title={parsed.cleanDesc}>
                          {parsed.cleanDesc.replace(/\(Every.*Days\)/i, '').trim()}
                        </p>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Blockchain</p>
                  <p className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1.5 uppercase tracking-tighter">Arc Network <ShieldCheck className="w-3.5 h-3.5 text-[#fc5000]" /></p>
                </div>
              </div>

              <div className="h-px bg-gray-50 w-full" />

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Billing Cycle</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <p className="text-xs font-bold text-gray-600">Every {intervalDays} Days</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Asset</p>
                  <p className="text-xs font-black text-[#fc5000] uppercase tracking-widest">{matchedToken.symbol}</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              {writeError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium text-center">
                  {writeError.message || 'Transaction rejected.'}
                </div>
              )}

              {!isConnected ? (
                <button
                  onClick={() => (document.querySelector('appkit-button') as any)?.click()}
                  className="btn-orange w-full py-5 text-white text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 flex items-center justify-center gap-3"
                >
                  <Wallet className="w-5 h-5" /> Connect Wallet
                </button>
              ) : isSuccessState ? (
                <div className="w-full py-12 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-[#050508] shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                      Subscription Active
                    </h3>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Confirmed on Blockchain</p>
                  </div>
                  {txHash && (
                    <button onClick={() => window.open(`https://testnet.arcscan.app/tx/${txHash}`, '_blank')} className="mt-2 flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                      View Receipt <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : !hasSufficientAllowance ? (
                <button
                  onClick={handleApproveToken}
                  disabled={activeStep === 'approving'}
                  className="w-full py-5 bg-white text-black hover:bg-gray-200 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  {activeStep === 'approving' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  Approve Subscription
                </button>
              ) : (
                <button
                  onClick={handleCreateSubscription}
                  disabled={activeStep === 'subscribing'}
                  className="btn-orange w-full py-5 text-white text-[11px] font-black uppercase tracking-[0.2em] active:scale-95 flex items-center justify-center gap-3"
                >
                  {activeStep === 'subscribing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Repeat className="w-5 h-5" />}
                  Subscribe Now
                </button>
              )}
            </div>
            
            <div className="text-center pt-2">
              <p className="text-[10px] text-gray-400 font-medium">Non-custodial routing • Cancel at anytime in your Account Center.</p>
            </div>
          </div>
          
          <div className="px-8 py-5 bg-white/[0.01] border-t border-gray-200 flex items-center justify-center">
            <Link href="/" className="flex items-center gap-2.5 group transition-transform hover:scale-105 duration-300">
              <div className="w-7 h-7 rounded-xl bg-[#fc5000] flex items-center justify-center shadow-[0_0_10px_rgba(252,80,0,0.3)] group-hover:shadow-[0_0_16px_rgba(252,80,0,0.5)] transition-all">
                <Eye className="w-4 h-4 text-slate-900" fill="currentColor" />
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-0.5">Powered by</span>
                <span className="text-sm font-black tracking-tight text-slate-600 leading-none group-hover:text-slate-800 transition-colors" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                  Lumi<span className="text-[#fc5000]">Pay</span>
                </span>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
