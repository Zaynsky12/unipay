"use client";

import React, { useState, useEffect, use } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { formatUnits } from 'viem';
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ExternalLink,
  Lock,
  Wallet,
  Check,
  Zap,
  Globe,
  Mail,
  UserCircle,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, SUPPORTED_TOKENS, ERC20_ABI } from '@/lib/constants';
import { goldskyClient, GET_SESSION } from '@/lib/goldsky';
import { usePrivy } from '@privy-io/react-auth';

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

export function getCircleChain(chainId?: number): any {
  switch (chainId) {
    case 5042002: return "Arc_Testnet";
    case 11155111: return "Ethereum_Sepolia";
    case 421614: return "Arbitrum_Sepolia";
    case 11155420: return "Optimism_Sepolia";
    case 84532: return "Base_Sepolia";
    default: return null;
  }
}

export function getSourceUSDCAddress(chainId?: number): `0x${string}` | null {
  switch (chainId) {
    case 11155111: return "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Eth Sepolia
    case 421614: return "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"; // Arb Sepolia
    case 11155420: return "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"; // OP Sepolia
    case 84532: return "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Base Sepolia
    default: return null;
  }
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

export default function PaymentPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const rawSessionId = resolvedParams.sessionId;

  const sessionIdBytes32 = (rawSessionId.startsWith('0x') ? rawSessionId : `0x${rawSessionId}`) as `0x${string}`;

  const { login, user } = usePrivy();
  const { address, isConnected, connector, chainId } = useAccount();
  const embeddedWallet = user?.linkedAccounts?.find((account: any) => account.type === 'wallet' && account.walletClientType === 'privy');
  const userAddress = address || (user?.wallet?.address as `0x${string}`) || ((embeddedWallet as any)?.address as `0x${string}`) || undefined;
  const { switchChainAsync } = useSwitchChain();
  const [circleKit] = useState(() => new AppKit());
  const [urlDesc, setUrlDesc] = useState<string | null>(null);
  const [goldskyTxHash, setGoldskyTxHash] = useState<string | null>(null);
  const pathname = usePathname();

  const getEffectiveType = () => {
    const parsed = parseSessionDescription(urlDesc || '');
    let type = parsed.type;
    if (type === 'Payment' && pathname) {
      if (pathname.includes('/invoice/')) type = 'Invoice';
      else if (pathname.includes('/checkout/')) type = 'Checkout';
      else if (pathname.includes('/tip/')) type = 'Tip';
    }
    return type;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const desc = params.get('desc');
      if (desc) setUrlDesc(decodeURIComponent(desc));
    }
  }, []);

  // Fetch description from Goldsky Subgraph if not provided in the URL or as a backup/sync
  useEffect(() => {
    const fetchSessionDescription = async () => {
      try {
        const idLower = rawSessionId.toLowerCase();
        const data: any = await goldskyClient.request(GET_SESSION, { id: idLower });
        if (data?.paymentSession?.description) {
          setUrlDesc(data.paymentSession.description);
        }
        if (data?.paymentSession?.transaction?.id) {
          setGoldskyTxHash(data.paymentSession.transaction.id);
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
  const { data: sessionData, isLoading: isLoadingSession, refetch: refetchSession } = useReadContract({
    chainId: 5042002,
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'sessions',
    args: [sessionIdBytes32],
  });

  const merchantAddr = (sessionData as any)?.[0] || '0x0000000000000000000000000000000000000000';
  const amountRaw = (sessionData as any)?.[1] || 0n;
  const tokenAddr = (sessionData as any)?.[2] || '';
  const expiry = (sessionData as any)?.[3] || 0n;
  const isPaid = (sessionData as any)?.[4] || false;
  const isActiveOnchain = (sessionData as any)?.[5] ?? true;

  // 2. Membaca profil bisnis merchant
  const { data: merchantData, refetch: refetchMerchant } = useReadContract({
    chainId: 5042002,
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: merchantAddr !== '0x0000000000000000000000000000000000000000' ? [merchantAddr] : undefined,
    query: { enabled: merchantAddr !== '0x0000000000000000000000000000000000000000' }
  });

  useEffect(() => {
    if (merchantAddr !== '0x0000000000000000000000000000000000000000') {
      refetchMerchant();
    }
  }, [merchantAddr, refetchMerchant]);

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
  }

  const matchedToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === tokenAddr?.toLowerCase()) || SUPPORTED_TOKENS[0];
  const formattedAmount = formatUnits(amountRaw, matchedToken.decimals);

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    chainId: 5042002,
    address: tokenAddr as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, LUMIPAY_REGISTRY_ADDRESS] : undefined,
    query: { enabled: !!userAddress && !!tokenAddr && tokenAddr !== '0x0000000000000000000000000000000000000000' }
  });

  const sourceUSDC = getSourceUSDCAddress(chainId);
  const { data: sourceBalanceData } = useReadContract({
    address: sourceUSDC as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress && !!sourceUSDC && chainId !== 5042002 }
  });
  
  const sourceBalance = (sourceBalanceData as bigint) ?? 0n;
  const hasEnoughBalanceToBridge = sourceBalance >= amountRaw;

  const allowanceVal = (currentAllowance as bigint) ?? 0n;
  const [localApproved, setLocalApproved] = useState(false);
  const [localPaid, setLocalPaid] = useState(false);
  const hasSufficientAllowance = allowanceVal >= amountRaw || localApproved;

  const { writeContract, data: txHash, isPending: isWritePending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const [activeStep, setActiveStep] = useState<'idle' | 'approving' | 'paying' | 'bridging'>('idle');

  const handleBridgeUSDC = async () => {
    if (!connector || !chainId || !userAddress) return;
    try {
      setActiveStep('bridging');
      const provider = (await connector.getProvider()) as any;
      const adapter = await createViemAdapterFromProvider({ provider });
      const fromChain = getCircleChain(chainId);
      if (!fromChain) throw new Error("Unsupported network for bridging");
      
      await circleKit.bridge({
        from: { adapter, chain: fromChain },
        to: { adapter, chain: "Arc_Testnet" },
        amount: formattedAmount,
      });

      if (switchChainAsync) {
        await switchChainAsync({ chainId: 5042002 });
      }
    } catch (err) {
      console.error("Bridge Error:", err);
      alert("Bridge failed or was cancelled. Check console for details.");
    } finally {
      setActiveStep('idle');
    }
  };

  const handleApproveToken = () => {
    if (!tokenAddr || !userAddress) return;
    setActiveStep('approving');
    writeContract({ address: tokenAddr as `0x${string}`, abi: ERC20_ABI, functionName: 'approve', args: [LUMIPAY_REGISTRY_ADDRESS, amountRaw], gas: 500000n });
  };

  const handleExecutePayment = () => {
    if (!userAddress) return;
    setActiveStep('paying');
    writeContract({ address: LUMIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'pay', args: [sessionIdBytes32], gas: 500000n });
  };

  useEffect(() => {
    if (isTxSuccess) {
      if (activeStep === 'approving') {
        setLocalApproved(true);
      } else if (activeStep === 'paying') {
        setLocalPaid(true);
      }
      refetchAllowance();
      refetchSession();
      setActiveStep('idle');
    }
  }, [isTxSuccess, activeStep, refetchAllowance, refetchSession]);

  useEffect(() => {
    if (writeError) {
      setActiveStep('idle');
    }
  }, [writeError]);

  const isExpired = expiry > 0n && BigInt(Math.floor(Date.now() / 1000)) > expiry;
  const displayTxHash = txHash || goldskyTxHash;

  const rawSessionDesc = urlDesc || `Order Settlement — ${displayName}`;
  const parsedDescObj = parseSessionDescription(rawSessionDesc);
  const descBadge = getBadgeStyles(parsedDescObj.type);

  if (isLoadingSession) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-[#fc5000] animate-spin" />
    </div>
  );

  if (!isActiveOnchain && !isPaid) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full glass-panel p-10 space-y-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto opacity-50" />
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Paylink Deactivated</h2>
        <p className="text-gray-500 text-sm italic">This payment link is no longer valid.</p>
        <Link href="/" className="block py-4 text-xs font-black text-violet-400 uppercase tracking-widest border border-violet-500/20 rounded-2xl">Return Home</Link>
      </div>
    </div>
  );

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
          <div className="w-16 h-16 bg-white shadow-sm rounded-[1.5rem] flex items-center justify-center mx-auto mb-3 relative z-10 border border-gray-100">
            {merchantLogo ? (
              <img src={merchantLogo} alt={displayName} className="w-full h-full object-cover rounded-[1.5rem]" />
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
              <span className="text-5xl font-black text-slate-900 tracking-tighter truncate">${formattedAmount}</span>
            </div>
            <p className="text-sm font-medium text-slate-500">Total Payment Amount</p>
          </div>

          {/* Ticket Divider */}
          <div className="relative w-full h-px flex items-center justify-center">
            <div className="absolute left-[-12px] w-6 h-6 bg-[#EAECEF] rounded-full" style={{ zIndex: 10 }} />
            <div className="w-full border-t-2 border-dashed border-gray-200" />
            <div className="absolute right-[-12px] w-6 h-6 bg-[#EAECEF] rounded-full" style={{ zIndex: 10 }} />
          </div>

          {/* Bottom Half: Details */}
          <div className="p-6 space-y-4">
            <h3 className="text-[14px] font-bold text-slate-900 border-b border-gray-100 pb-2">Payment Details</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center gap-4">
                <p className="text-[13px] text-slate-600 whitespace-nowrap">Order Note :</p>
                <p className="text-[13px] font-medium text-slate-900 text-right line-clamp-2">
                  {parsedDescObj.cleanDesc || "N/A"}
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

              <h3 className="text-[14px] font-bold text-slate-900 pt-1">Status & Time</h3>

              <div className="flex justify-between items-center">
                <p className="text-[13px] text-slate-600">Valid Until :</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <p className="text-[13px] font-medium text-slate-900">
                    {isExpired ? 'Expired' : expiry === 0n ? 'Permanent' : new Date(Number(expiry) * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pb-1">
                <p className="text-[13px] text-slate-600">Remaining Time :</p>
                <p className="text-[13px] font-medium text-slate-900">
                  {isExpired ? '0 minutes' : expiry === 0n ? '∞' : (() => {
                    const diffMs = Number(expiry) * 1000 - Date.now();
                    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                    return `${diffMins} minutes`;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Call To Action ── */}
        <div className="mb-6">
          {!userAddress ? (
            <button
              onClick={login}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              <Wallet className="w-4 h-4" /> Connect Wallet
            </button>
          ) : (isConnected && chainId !== 5042002) ? (
            getCircleChain(chainId) ? (
              hasEnoughBalanceToBridge ? (
                <button
                  onClick={handleBridgeUSDC}
                  disabled={activeStep === 'bridging'}
                  className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {activeStep === 'bridging' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  Bridge {formattedAmount} USDC to Arc
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-red-500/10 text-red-500 rounded-[1.5rem] border border-red-500/20 text-[13px] font-bold uppercase tracking-wide flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <AlertCircle className="w-4 h-4" /> Insufficient USDC ({formatUnits(sourceBalance, 6)})
                </button>
              )
            ) : (
              <button
                onClick={() => switchChainAsync && switchChainAsync({ chainId: 5042002 })}
                className="w-full py-4 bg-gray-800 text-white hover:bg-gray-700 rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide transition-all shadow-lg shadow-gray-800/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Switch to Arc Network
              </button>
            )
          ) : (isPaid || localPaid) ? (
            <div className="w-full py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500 shadow-sm">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {(() => {
                    const type = getEffectiveType().toLowerCase();
                    if (type === 'invoice') return 'Invoice Paid';
                    if (type === 'checkout') return 'Order Confirmed';
                    if (type === 'tip') return 'Tip Sent';
                    return 'Payment Settled';
                  })()}
                </h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Confirmed on Arc Network</p>
              </div>
              {displayTxHash && (
                <button onClick={() => window.open(`https://testnet.arcscan.app/tx/${displayTxHash}`, '_blank')} className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-slate-900 transition-colors">
                  View Transaction Details <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : isExpired ? (
            <div className="w-full py-4 bg-red-500/10 text-red-500 rounded-[1.5rem] border border-red-500/20 flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-wide">
              <AlertCircle className="w-4 h-4" /> Link Expired
            </div>
          ) : !hasSufficientAllowance ? (
            <button
              onClick={handleApproveToken}
              disabled={activeStep === 'approving'}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              {activeStep === 'approving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {(() => {
                const type = getEffectiveType().toLowerCase();
                if (type === 'tip') return 'Approve Tip';
                return 'Approve';
              })()}
            </button>
          ) : (
            <button
              onClick={handleExecutePayment}
              disabled={activeStep === 'paying'}
              className="w-full py-4 bg-[#FF5C00] hover:bg-[#E04500] text-white rounded-[1.5rem] text-[13px] font-bold uppercase tracking-wide active:scale-95 flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
            >
              {activeStep === 'paying' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              {(() => {
                const type = getEffectiveType().toLowerCase();
                if (type === 'tip') return 'Send Tip';
                return 'Pay Now';
              })()}
            </button>
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
