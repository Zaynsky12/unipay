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
import { usePrivy } from '@privy-io/react-auth';

export default function SubscribePage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const rawSessionId = resolvedParams.sessionId;
  const sessionIdBytes32 = (rawSessionId.startsWith('0x') ? rawSessionId : `0x${rawSessionId}`) as `0x${string}`;

  const { login } = usePrivy();
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
      args: [sessionIdBytes32, BigInt(intervalSeconds)],
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

  const rawSessionDesc = urlDesc || `Subscription — ${displayName}`;
  const parsedDescObj = parseSessionDescription(rawSessionDesc);
  const descBadge = getBadgeStyles(parsedDescObj.type);

  return (
    <div className="min-h-screen bg-[#050508] selection:bg-violet-500/30 font-sans flex items-center justify-center p-4 sm:p-6 relative">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#fc5000]/6 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      {/* ── The "Phone Screen" Container ── */}
      <div className="w-full max-w-[420px] mx-auto z-10 bg-[#EAECEF] rounded-[3rem] border-[3px] border-white/80 shadow-2xl relative overflow-hidden flex flex-col pt-8 pb-6 px-5 sm:px-6">
        
        {/* The LumiPay Gradient Border */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#fc5000] via-[#6836e8] to-[#fc5000] animate-shimmer" />

        {/* ── Top Identity Section ── */}
        <div className="text-center mb-5 relative mt-2">
          <div className="w-16 h-16 bg-white shadow-sm rounded-[1.5rem] flex items-center justify-center mx-auto mb-3 relative z-10 border border-gray-100 overflow-hidden">
            {merchantLogo ? (
              <img src={merchantLogo} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <UserCircle className="w-8 h-8 text-purple-500" />
            )}
          </div>
          
          <h1 className="text-xl font-black italic text-slate-900 tracking-tight uppercase mb-2 truncate flex items-center justify-center gap-1.5">
            {displayName}
            {isVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            {merchantWebsite && (
              <a href={merchantWebsite} target="_blank" className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-purple-600 uppercase tracking-widest">
                <Globe className="w-3 h-3" /> Website
              </a>
            )}
            {merchantEmail && (
              <a href={`mailto:${merchantEmail}`} className="flex items-center gap-1 text-[9px] font-bold text-gray-500 hover:text-purple-600 uppercase tracking-widest">
                <Mail className="w-3 h-3" /> Email
              </a>
            )}
            {!isVerified && (
              <div className="inline-block px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                <span className="text-[8px] font-black text-amber-500 uppercase tracking-[0.15em]">
                  Unverified
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Ticket Card ── */}
        <div className="bg-white rounded-[2rem] relative overflow-hidden mb-6">
          {/* Top Half: Amount */}
          <div className="p-6 text-center">
            <div className="inline-block px-3 py-1 bg-cyan-500/10 rounded-full mb-3 border border-cyan-500/10">
              <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1.5">
                {descBadge.emoji} {parsedDescObj.type}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 bg-transparent overflow-hidden">
                <img src="/usdc-logo.png" alt="USDC Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-5xl font-black text-slate-900 tracking-tighter truncate">${planAmount}</span>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Per Billing</p>
          </div>

          {/* Ticket Divider */}
          <div className="relative w-full h-px flex items-center justify-center">
            <div className="absolute left-[-12px] w-6 h-6 bg-[#EAECEF] rounded-full" style={{ zIndex: 10 }} />
            <div className="w-full border-t-2 border-dashed border-gray-200" />
            <div className="absolute right-[-12px] w-6 h-6 bg-[#EAECEF] rounded-full" style={{ zIndex: 10 }} />
          </div>

          {/* Bottom Half: Details */}
          <div className="p-6 space-y-4">
            <h3 className="text-[14px] font-bold text-slate-900 border-b border-gray-100 pb-2">Subscription Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-4">
                <p className="text-[13px] text-slate-600 whitespace-nowrap">Order Note :</p>
                <p className="text-[13px] font-medium text-slate-900 text-right line-clamp-2">
                  {parsedDescObj.cleanDesc.replace(/\(Every.*Days\)/i, '').trim() || "N/A"}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[13px] text-slate-600">Blockchain :</p>
                <p className="text-[13px] font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                  Arc Network <img src="/arc-logo.png" alt="Arc Network Logo" className="w-4 h-4 object-contain brightness-0" />
                </p>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <p className="text-[13px] text-slate-600">Settlement Asset :</p>
                <p className="text-[13px] font-bold text-purple-600 uppercase">{matchedToken.symbol}</p>
              </div>

              <h3 className="text-[14px] font-bold text-slate-900 pt-1">Status & Cycle</h3>

              <div className="flex justify-between items-center">
                <p className="text-[13px] text-slate-600">Billing Cycle :</p>
                <p className="text-[13px] font-medium text-slate-900">
                  Every {intervalDays} Days
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Call To Action ── */}
        <div className="mb-6">
          {writeError && (
            <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium text-center">
              {writeError.message || 'Transaction rejected.'}
            </div>
          )}

          {!isConnected ? (
            <button
              onClick={login}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          ) : isSuccessState ? (
            <div className="w-full py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500 shadow-sm">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  Subscription Active
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Confirmed on Arc Network</p>
              </div>
              {txHash && (
                <button onClick={() => window.open(`https://testnet.arcscan.app/tx/${txHash}`, '_blank')} className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                  View Transaction Details <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : !hasSufficientAllowance ? (
            <button
              onClick={handleApproveToken}
              disabled={activeStep === 'approving'}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              {activeStep === 'approving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Approve Subscription
            </button>
          ) : (
            <button
              onClick={handleCreateSubscription}
              disabled={activeStep === 'subscribing'}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              {activeStep === 'subscribing' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Repeat className="w-4 h-4" />}
              Subscribe Now
            </button>
          )}

          {isSuccessState && txHash && (
            <button onClick={() => window.open(`https://testnet.arcscan.app/tx/${txHash}`, '_blank')} className="mt-4 mx-auto flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
              View Receipt <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          
          {!isSuccessState && (
            <div className="text-center pt-4">
              <p className="text-[10px] text-gray-400 font-medium">Non-custodial routing • Cancel at anytime in your Account Center.</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-2 mt-auto group cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-8 h-8 rounded-full bg-[#fc5000] flex items-center justify-center shadow-sm">
            <div className="w-3 h-3 bg-[#050508] rounded-full" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] leading-none mb-0.5">Powered by</span>
            <span className="text-[15px] font-black tracking-tight text-slate-900 leading-none group-hover:text-[#fc5000] transition-colors" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              LumiPay
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
