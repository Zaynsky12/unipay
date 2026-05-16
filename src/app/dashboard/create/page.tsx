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
  Repeat,
  Zap,
  ChevronRight,
  Monitor,
  Shield,
  ArrowRight
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

  if (!isConnected) return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0F] flex items-center justify-center p-6 animate-fade-in overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-1/3 -right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="max-w-md w-full glass-panel p-10 rounded-[3rem] border border-white/5 text-center relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
        <div className="w-20 h-20 bg-violet-600/20 rounded-[2rem] border border-violet-500/30 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-violet-600/10">
          <Shield className="w-10 h-10 text-violet-400" />
        </div>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Identity Required</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-10">
          To create payment links, you must connect your Web3 identity. This ensures you can receive settlements directly into your self-custody wallet.
        </p>
        
        <button 
          onClick={() => (document.querySelector('appkit-button') as any)?.click()}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all flex items-center justify-center gap-3 group"
        >
          <span>Connect Identity</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <Link href="/" className="inline-block mt-8 text-[10px] font-black text-gray-600 hover:text-gray-400 uppercase tracking-widest transition-colors">
          &larr; Back to Landing Page
        </Link>
      </div>
    </div>
  );
  
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

  const isRegistered = merchantData ? (merchantData as any)[2] : false;
  const merchantName = isRegistered ? ((merchantData as any)?.[0] || 'Merchant') : 'Anonymous';

  // L1 Contract Execution
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess, data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !address) return;

    const tokenObj = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
    if (!tokenObj) return;

    if (paymentType === 'subscription') {
      const amountUnits = parseUnits(amount, tokenObj.decimals);
      const intervalSec = BigInt(subInterval) * 86400n;
      writeContract({
        address: UNIPAY_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'createSubscription',
        args: [address, amountUnits, tokenObj.address, intervalSec],
        gas: 500000n,
      });
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
      if (extractedId) {
        try {
          const descs = JSON.parse(localStorage.getItem('unipay_descriptions') || '{}');
          descs[extractedId] = description || `${selectedToken} Payment`;
          localStorage.setItem('unipay_descriptions', JSON.stringify(descs));
          const tokenObj = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
          const optimisticSession = {
            id: extractedId,
            amount: parseUnits(amount, tokenObj?.decimals || 6).toString(),
            token: tokenObj?.address || '',
            description: description || `${selectedToken} Payment`,
            paid: false,
            active: true,
            createdAt: Math.floor(Date.now() / 1000).toString(),
          };
          const sessions = JSON.parse(localStorage.getItem('unipay_optimistic_sessions') || '[]');
          sessions.push(optimisticSession);
          localStorage.setItem('unipay_optimistic_sessions', JSON.stringify(sessions));
        } catch {}
      }
    }
  }, [isSuccess, txReceipt, txHash, address, amount, selectedToken, description, merchantName, expiryDays]);

  const paymentLink = typeof window !== 'undefined' 
    ? (paymentType === 'onetime' 
        ? `${window.location.origin}/pay/${createdSessionId || 'preview_id'}${description ? `?desc=${encodeURIComponent(description)}` : ''}`
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

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-24 px-4 sm:px-0">
      
      {/* ── Page Header (REFRESHED) ── */}
      <div className="text-center sm:text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8">
           <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                  <Zap className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-[0.2em]">
                    Payment Gateway
                  </span>
                </div>
                <span className="hidden sm:inline text-xs text-gray-500 font-medium">• Stateless Dispatch</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic">
                Create <span className="text-violet-500">Paylink</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest sm:max-w-md">Issue professional cryptographic billing endpoints in seconds.</p>
           </div>

           {/* UI MODE SELECTOR (CENTERED IN MOBILE) */}
           <div className="flex bg-[#0B0B12] p-1.5 rounded-2xl border border-white/10 w-full sm:w-[320px] shadow-2xl relative overflow-hidden">
              <div 
                className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-violet-600 rounded-xl transition-all duration-300 ease-out shadow-[0_0_20px_rgba(124,58,237,0.4)] ${paymentType === 'subscription' ? 'translate-x-full' : 'translate-x-0'}`}
              />
              <button 
                onClick={() => { setPaymentType('onetime'); setCreatedSessionId(''); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors duration-300 ${paymentType === 'onetime' ? 'text-white' : 'text-gray-500'}`}
              >
                Instant Link
              </button>
              <button 
                onClick={() => { setPaymentType('subscription'); setCreatedSessionId(''); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors duration-300 ${paymentType === 'subscription' ? 'text-white' : 'text-gray-500'}`}
              >
                Subscription
              </button>
           </div>
        </div>
      </div>

      {!isConnected && (
        <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between gap-4 animate-pulse">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <AlertCircle className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">Connect Identity to Deploy Links</p>
           </div>
           <button onClick={() => (document.querySelector('appkit-button') as any)?.click()} className="text-[10px] font-black text-amber-500 underline uppercase tracking-widest hover:text-amber-400">Connect Now</button>
        </div>
      )}

      {!isRegistered && isConnected && (
        <div className="p-5 rounded-2xl bg-violet-600/5 border border-violet-500/10 text-[10px] text-gray-400 flex items-center gap-4 font-bold uppercase tracking-widest leading-relaxed">
          <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
          <span>Notice: Operating as Anonymous. You can verify your brand in the Account settings.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ── CREATE FORM (Left - 7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0B0B12] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative">
            <form onSubmit={handleCreateSession} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Asset Amount</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold">$</div>
                    <input 
                      type="number" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="0.00"
                      step="0.01"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white text-lg font-black focus:border-violet-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Settlement Token</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 border border-white/10 rounded-2xl">
                    {SUPPORTED_TOKENS.map((token) => (
                      <button 
                        key={token.symbol}
                        type="button"
                        onClick={() => setSelectedToken(token.symbol as SupportedToken)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedToken === token.symbol ? 'bg-violet-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Order Description (Optional)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="e.g. Premium Digital Access"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {paymentType === 'onetime' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiration Period</label>
                  <select 
                    value={expiryDays} 
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none appearance-none cursor-pointer"
                  >
                    <option value="1" className="bg-black">24 Hours</option>
                    <option value="7" className="bg-black">7 Days (Recommended)</option>
                    <option value="30" className="bg-black">30 Days</option>
                    <option value="365" className="bg-black">1 Year</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Billing Interval</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={subInterval} 
                      onChange={(e) => setSubInterval(e.target.value)} 
                      className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none"
                    />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Days</span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isPending || isTxConfirming || !amount || Number(amount) <= 0 || !isConnected}
                className="w-full py-5 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3 active:scale-95"
              >
                {isPending || isTxConfirming ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing on L1...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Create Paylink</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── OUTPUT PREVIEW (Right - 5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {!createdSessionId ? (
            <div className="bg-white/[0.01] border border-white/5 border-dashed rounded-[2.5rem] p-12 text-center space-y-6 animate-pulse">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <Monitor className="w-10 h-10 text-gray-700" />
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Ready to Dispatch</p>
                 <p className="text-[9px] text-gray-700 uppercase font-bold leading-relaxed">Fill the form to generate your<br/>deterministic paylink endpoint.</p>
               </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {/* SUCCESS CARD */}
              <div className="bg-[#0B0B12] border border-emerald-500/20 rounded-[2.5rem] p-8 space-y-8 shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight">Paylink Deployed</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent on-chain endpoint</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black/60 border border-white/10 rounded-2xl group">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 ml-1">Customer Access URL</p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-[10px] text-violet-400 font-mono truncate">{paymentLink}</code>
                      <button 
                        onClick={() => copyToClipboard(paymentLink, 'link')}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all shrink-0"
                      >
                        {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href={paymentLink}
                      target="_blank"
                      className="flex-1 py-3.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
                    >
                      Open Paylink <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link 
                      href="/dashboard"
                      className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5"
                    >
                      Dashboard <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* EMBED WIDGET CARD */}
              <div className="bg-[#0B0B12] border border-white/5 rounded-[2rem] p-8 space-y-6">
                 <div className="flex items-center gap-3">
                   <Monitor className="w-5 h-5 text-violet-500" />
                   <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Embed Web Widget</h4>
                 </div>
                 <div className="relative group">
                    <pre className="bg-black/80 p-4 rounded-2xl text-[9px] font-mono text-gray-400 overflow-x-auto no-scrollbar border border-white/5 leading-relaxed">
                      {embedSnippet}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(embedSnippet, 'code')}
                      className="absolute top-3 right-3 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all border border-white/10"
                    >
                      {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                 </div>
                 <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">Drop this script into your frontend to enable native pop-up checkouts.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
