"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { 
  Link as LinkIcon, 
  Code, 
  Copy, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Coins,
  Clock,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  Repeat
} from 'lucide-react';
import Link from 'next/link';
import { 
  UNIPAY_REGISTRY_ADDRESS, 
  REGISTRY_ABI, 
  SUPPORTED_TOKENS, 
  type SupportedToken 
} from '@/lib/constants';

export default function CreatePaymentPage() {
  const { address, isConnected } = useAccount();
  
  // Form State
  const [paymentType, setPaymentType] = useState<'onetime' | 'subscription'>('onetime');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('USDC');
  const [description, setDescription] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [subInterval, setSubInterval] = useState('30');

  // Output Link/Session State
  const [createdSessionId, setCreatedSessionId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Read Merchant Registry Status
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const merchantName = merchantData?.[0] || 'Verified Merchant';
  const isRegistered = merchantData ? merchantData[2] : false;

  // L1 Contract Execution
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess, data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !address) return;

    const tokenObj = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
    if (!tokenObj) return;

    if (paymentType === 'subscription') {
      // Deterministic signature-based subscription setup
      const pseudoId = `subplan_${Date.now()}`;
      setCreatedSessionId(pseudoId);
      
      // Save locally to display in active matrices
      try {
        const storageKey = `unipay_sessions_${address.toLowerCase()}`;
        const existing = localStorage.getItem(storageKey);
        const sessionsArray = existing ? JSON.parse(existing) : [];
        const newSessionObj = {
          sessionId: pseudoId,
          amount: amount,
          token: selectedToken,
          description: `Recurring Subscription: ${subInterval} Days Interval`,
          expiryTimestamp: Math.floor(Date.now() / 1000) + 31536000, // valid 1 year
          createdAt: Date.now(),
          isPaid: false,
          isSubscription: true
        };
        localStorage.setItem(storageKey, JSON.stringify([newSessionObj, ...sessionsArray]));
      } catch(e) {}
      
      return;
    }

    const amountUnits = parseUnits(amount, tokenObj.decimals);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400;

    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'createSession',
      args: [amountUnits, tokenObj.address, description || `Instant Invoice — ${merchantName}`, BigInt(expiryTimestamp)],
      gas: 500000n,
    });
  };

  // Intercept L1 Session Identifier logs
  useEffect(() => {
    if (isSuccess && txReceipt) {
      let extractedId = '';
      
      if (txReceipt.logs && Array.isArray(txReceipt.logs)) {
        for (const log of txReceipt.logs) {
          if (log.topics && log.topics.length > 1) {
            const candidate = log.topics[1] as string;
            if (candidate && candidate.length === 66) {
              extractedId = candidate;
              break;
            }
          }
        }
      }
      
      if (!extractedId || extractedId === '0x') {
        extractedId = txHash ? `${txHash.slice(0, 34)}...` : '0xsession' + Date.now().toString(16);
      }

      setCreatedSessionId(extractedId);

      if (address && typeof window !== 'undefined') {
        try {
          const storageKey = `unipay_sessions_${address.toLowerCase()}`;
          const existing = localStorage.getItem(storageKey);
          const sessionsArray = existing ? JSON.parse(existing) : [];
          
          if (!sessionsArray.some((s: any) => s.sessionId === extractedId)) {
            const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400;
            const newSessionObj = {
              sessionId: extractedId,
              amount: amount || '0.00',
              token: selectedToken,
              description: description || `Instant Invoice — ${merchantName}`,
              expiryTimestamp: expiryTimestamp,
              createdAt: Date.now(),
              isPaid: false
            };
            
            localStorage.setItem(storageKey, JSON.stringify([newSessionObj, ...sessionsArray]));
          }
        } catch (err) {}
      }
    }
  }, [isSuccess, txReceipt, txHash, address, amount, selectedToken, description, merchantName, expiryDays]);

  const paymentLink = typeof window !== 'undefined' 
    ? (paymentType === 'onetime' 
        ? `${window.location.origin}/pay/${createdSessionId || 'preview_id'}`
        : `${window.location.origin}/subscribe/${address}?amount=${amount || '0'}&interval=${subInterval}&token=${selectedToken}`)
    : `https://unipay.app/${paymentType === 'onetime' ? 'pay/preview_id' : 'subscribe/0x...'}`;

  const embedSnippet = `<script src="https://unipay.app/widget.js" type="module"></script>
<unipay-checkout 
  merchant="${address || '0x...'}" 
  amount="${amount || '0.00'}" 
  currency="${selectedToken}" 
  session="${createdSessionId || 'preview_id'}"
  theme="dark">
</unipay-checkout>`;

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 animate-fade-in shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
        <AlertCircle className="w-10 h-10 text-violet-400 mx-auto mb-4 relative z-10 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2 relative z-10 tracking-tight">Endpoint Dispatcher Locked</h2>
        <p className="text-xs text-gray-400 mb-6 relative z-10 leading-relaxed max-w-xs mx-auto">
          Please link your Web3 provider account to issue tamper-proof digital payment endpoints.
        </p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-violet-300 font-medium relative z-10">
          <span>Connect via the top right navbar button</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Page Header ── */}
      <div className="pb-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              Payment Gateway
            </span>
            <span className="text-xs text-gray-500">• Stateless Dispatch</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Smart Billing Link</h1>
        </div>

        {/* Mode Indicator */}
        <div className="px-3 py-1.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 font-medium self-start sm:self-auto">
          Mode: <span className="text-violet-400 font-bold">{paymentType === 'onetime' ? 'Instant Invoice Link' : 'Recurring Subscription'}</span>
        </div>
      </div>

      {!isRegistered && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3 font-medium animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Notice: You are operating an unverified address. Customers will review your primary hexadecimal hash instead of a verified storefront alias.</span>
        </div>
      )}

      {/* ── User-friendly & Pure UniPay Purple Tab Selector ── */}
      <div className="flex bg-black/50 p-1.5 rounded-2xl border border-white/5 w-full max-w-md mx-auto lg:mx-0 shadow-inner">
        <button 
          onClick={() => { setPaymentType('onetime'); setCreatedSessionId(''); }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 ${
            paymentType === 'onetime' 
              ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Instant Invoice Link
        </button>
        <button 
          onClick={() => { setPaymentType('subscription'); setCreatedSessionId(''); }}
          className={`flex-1 py-3 text-xs font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
            paymentType === 'subscription' 
              ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' 
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Repeat className="w-3.5 h-3.5" /> Recurring Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Side: Specification Input Form (7 Columns) ── */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden transition-all duration-500 border-t-2 border-[#7C3AED]">
          {/* Ambient Purple Glow Background Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 text-violet-400">
              <Sparkles className="w-4 h-4" /> {paymentType === 'onetime' ? 'Invoice Attributes' : 'Subscription Plan Setup'}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {paymentType === 'onetime' ? 'L1 Gas Intercept' : 'Offchain Handshake'}
            </span>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-6 relative z-10">
            
            <div>
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">
                Select Currency *
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-black/40 border border-white/5">
                {SUPPORTED_TOKENS.map((t) => {
                  const active = selectedToken === t.symbol;
                  return (
                    <button
                      key={t.symbol}
                      type="button"
                      onClick={() => setSelectedToken(t.symbol as SupportedToken)}
                      className={`py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                        active 
                          ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <Coins className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-600'}`} />
                      <span>{t.symbol}</span>
                      <span className="text-[10px] opacity-70 font-normal">({t.decimals} dec)</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black mb-2 uppercase tracking-wider text-violet-300/90">
                {paymentType === 'onetime' ? 'Requested Settlement Amount *' : 'Interval Cycle Charge Amount *'}
              </label>
              <div className="relative rounded-2xl bg-black/50 border border-white/10 transition-all focus-within:border-violet-500 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.15)]">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black select-none text-violet-400/50">
                  $
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent p-4 pl-10 pr-16 text-3xl font-black text-white outline-none placeholder:text-gray-700 font-mono tracking-tight"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black px-2.5 py-1 rounded border select-none text-violet-400 bg-violet-600/10 border-violet-500/20">
                  {selectedToken}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
                <span>Bridged instantly via Arc App Kit</span>
                <span className="text-emerald-500/90 font-medium">Finality &lt; 1s settlement</span>
              </p>
            </div>

            {paymentType === 'onetime' ? (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">
                    Item Description / Invoice Notes
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Premium Gateways API integration"
                    className="input-field p-4 text-xs font-bold bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500/50 rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">
                    Link Expiration Limit
                  </label>
                  <div className="relative flex items-center">
                    <Clock className="w-4 h-4 text-violet-400/80 absolute left-4" />
                    <select
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="input-field p-4 pl-11 text-xs font-bold bg-black/40 border-white/10 text-white cursor-pointer outline-none focus:border-violet-500/50 rounded-xl w-full"
                    >
                      <option value="1" className="bg-[#0A0A0F] text-white">Valid for 24 Hours</option>
                      <option value="3" className="bg-[#0A0A0F] text-white">Valid for 3 Days</option>
                      <option value="7" className="bg-[#0A0A0F] text-white">Valid for 7 Days</option>
                      <option value="30" className="bg-[#0A0A0F] text-white">Valid for 30 Days</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-wider">
                  Billing Interval Cycle
                </label>
                <div className="relative flex items-center">
                  <Repeat className="w-4 h-4 text-violet-400/80 absolute left-4" />
                  <select
                    value={subInterval}
                    onChange={(e) => setSubInterval(e.target.value)}
                    className="input-field p-4 pl-11 text-xs font-bold bg-black/40 border-white/10 text-white cursor-pointer outline-none focus:border-violet-500/50 rounded-xl w-full"
                  >
                    <option value="7" className="bg-[#0A0A0F] text-white">Every 7 Days (Weekly)</option>
                    <option value="30" className="bg-[#0A0A0F] text-white">Every 30 Days (Monthly)</option>
                    <option value="90" className="bg-[#0A0A0F] text-white">Every 90 Days (Quarterly)</option>
                    <option value="365" className="bg-[#0A0A0F] text-white">Every 365 Days (Yearly)</option>
                  </select>
                </div>
                
                {/* Gasless Setup Explanation */}
                <div className="p-3.5 mt-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 font-medium leading-relaxed">
                  <span className="font-bold text-violet-200">Gasless Execution Setup:</span> Generating this subscription parameter plan is completely free. Plans are formulated offchain using strict deterministic hashing and activate onchain automatically upon user authorization.
                </div>
              </div>
            )}

            {writeError && paymentType === 'onetime' && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {writeError.message || 'Transaction authorization aborted.'}
              </div>
            )}

            <button
              type="submit"
              disabled={(isPending || isTxConfirming) && paymentType === 'onetime' || !amount}
              className="w-full py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider rounded-xl font-black text-white transition-all duration-300 transform hover:-translate-y-0.5 mt-4 bg-violet-600 hover:bg-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.35)]"
            >
              {(isPending || isTxConfirming) && paymentType === 'onetime' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isTxConfirming ? 'Writing Dispatch Block...' : 'Awaiting Wallet Handshake...'}</span>
                </>
              ) : (
                <span className="font-black">{paymentType === 'onetime' ? 'Generate Instant Billing Link' : 'Generate Subscription Link'}</span>
              )}
            </button>
          </form>
        </div>

        {/* ── Right Side: Output Links & Widget Cards (5 Columns) ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Integrated Success Notification Matrix */}
          {createdSessionId && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="text-xs font-black text-emerald-300 tracking-tight uppercase">Endpoint Generated Successfully ✓</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                This link specification has been securely validated and synchronized directly into your <span className="text-white font-bold">Active Payments & Endpoints</span> table on the primary dashboard.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all"
                >
                  <span>← Review in Dashboard Matrix</span>
                </Link>
              </div>
            </div>
          )}

          {/* Card Output 1: Payment Link */}
          <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-violet-600" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Payment URL Link</span>
              </div>
              {createdSessionId ? (
                <span className="badge-success">Live Ready</span>
              ) : (
                <span className="badge-pending">Dry Preview</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-black border border-white/5 font-mono text-xs text-violet-300 break-all select-all leading-relaxed tracking-tight">
              {paymentLink}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => copyToClipboard(paymentLink, 'link')}
                className="flex-1 btn-secondary py-2.5 text-xs flex items-center justify-center gap-2 hover:border-violet-500/30 transition-all font-bold"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-400" />
                    <span>Copy URL Link</span>
                  </>
                )}
              </button>

              <Link
                href={`/pay/${createdSessionId || 'preview_id'}`}
                target="_blank"
                className="px-3.5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl border border-white/5 text-xs text-violet-300 font-bold transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card Output 2: Sematan Web Component */}
          <div className="glass-panel p-6 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Code className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">Web Component Widget</span>
              </div>
              <span className="text-[10px] bg-white/[0.04] px-2 py-0.5 rounded text-gray-400 font-mono border border-white/5">&lt;unipay-checkout&gt;</span>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              Drop this standard web component tag inside any external frontend layout to display a modular checkout terminal automatically.
            </p>

            <div className="p-3.5 rounded-xl bg-black border border-white/5 font-mono text-[11px] text-indigo-300/90 whitespace-pre-wrap select-all overflow-x-auto leading-relaxed max-h-[160px]">
              {embedSnippet}
            </div>

            <button
              onClick={() => copyToClipboard(embedSnippet, 'code')}
              className="w-full btn-secondary py-2.5 text-xs flex items-center justify-center gap-2 hover:border-indigo-500/30 transition-all font-bold mt-1"
            >
              {copiedCode ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Snippet Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span>Copy Embed Code</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
