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
  ArrowRight,
  ArrowLeft,
  Settings,
  QrCode,
  Receipt,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { 
  LUMIPAY_REGISTRY_ADDRESS, 
  REGISTRY_ABI, 
  SUPPORTED_TOKENS, 
  type SupportedToken 
} from '@/lib/constants';

export default function CreatePaymentPage() {
  const { address, isConnected } = useAccount();


  // Form State
  const [paymentType, setPaymentType] = useState<'onetime' | 'subscription'>('onetime');
  const [selectedMenu, setSelectedMenu] = useState<'checkouts' | 'invoices' | 'subscribtion' | 'tip' | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('USDC');
  const [description, setDescription] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');
  const [subInterval, setSubInterval] = useState('30');
  const [intervalType, setIntervalType] = useState('30'); // '7', '30', '90', '365', 'custom'

  const handleIntervalTypeChange = (value: string) => {
    setIntervalType(value);
    if (value !== 'custom') {
      setSubInterval(value);
    }
  };

  // Output Link/Session State
  const [createdSessionId, setCreatedSessionId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Read Merchant Registry Status
  const { data: merchantData } = useReadContract({
    address: LUMIPAY_REGISTRY_ADDRESS,
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

    const amountUnits = parseUnits(amount, tokenObj.decimals);
    
    // Untuk subscription, kita buat linknya berumur panjang (10 tahun) agar tidak cepat expired
    const activeExpiryDays = paymentType === 'subscription' ? 3650 : Number(expiryDays);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + activeExpiryDays * 86400;
    
    let typeName = 'Payment';
    if (selectedMenu === 'invoices') typeName = 'Invoice';
    else if (selectedMenu === 'checkouts') typeName = 'Checkout';
    else if (selectedMenu === 'subscribtion') typeName = 'Subscription';
    else if (selectedMenu === 'tip') typeName = 'Tip';

    const typePrefix = `[${typeName}]`;
    const fallbackDesc = selectedMenu 
      ? `${selectedMenu.charAt(0).toUpperCase() + selectedMenu.slice(1)} — ${merchantName}` 
      : `Payment — ${merchantName}`;

    const intervalText = paymentType === 'subscription' ? ` (Every ${subInterval} Days)` : '';
    const finalDesc = description.trim()
      ? `${typePrefix} ${description.trim()}${intervalText}`
      : `${typePrefix} ${fallbackDesc}${intervalText}`;

    const isReusable = selectedMenu === 'checkouts' || selectedMenu === 'tip' || selectedMenu === 'subscribtion';

    writeContract({
      address: LUMIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'createSession',
      args: [amountUnits, tokenObj.address, finalDesc, BigInt(expiryTimestamp), isReusable],
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
          let typeName = 'Payment';
          if (selectedMenu === 'invoices') typeName = 'Invoice';
          else if (selectedMenu === 'checkouts') typeName = 'Checkout';
          else if (selectedMenu === 'subscribtion') typeName = 'Subscription';
          else if (selectedMenu === 'tip') typeName = 'Tip';

          const typePrefix = `[${typeName}]`;
          const fallbackDesc = selectedMenu 
            ? `${selectedMenu.charAt(0).toUpperCase() + selectedMenu.slice(1)} — ${merchantName}` 
            : `Payment — ${merchantName}`;
          
          const finalDesc = description.trim()
            ? `${typePrefix} ${description.trim()}${paymentType === 'subscription' ? ` (Every ${subInterval} Days)` : ''}`
            : `${typePrefix} ${fallbackDesc}${paymentType === 'subscription' ? ` (Every ${subInterval} Days)` : ''}`;

          const descs = JSON.parse(localStorage.getItem('lumipay_descriptions') || '{}');
          descs[extractedId] = finalDesc;
          localStorage.setItem('lumipay_descriptions', JSON.stringify(descs));
          const tokenObj = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
          const optimisticSession = {
            id: extractedId,
            amount: parseUnits(amount, tokenObj?.decimals || 6).toString(),
            token: tokenObj?.address || '',
            description: finalDesc,
            interval: paymentType === 'subscription' ? subInterval : null,
            paid: false,
            active: true,
            createdAt: Math.floor(Date.now() / 1000).toString(),
          };
          const sessions = JSON.parse(localStorage.getItem('lumipay_optimistic_sessions') || '[]');
          sessions.push(optimisticSession);
          localStorage.setItem('lumipay_optimistic_sessions', JSON.stringify(sessions));
        } catch {}
      }
    }
  }, [isSuccess, txReceipt, txHash, address, amount, selectedToken, description, merchantName, expiryDays]);

  let typeNameForLink = 'Payment';
  if (selectedMenu === 'invoices') typeNameForLink = 'Invoice';
  else if (selectedMenu === 'checkouts') typeNameForLink = 'Checkout';
  else if (selectedMenu === 'subscribtion') typeNameForLink = 'Subscription';
  else if (selectedMenu === 'tip') typeNameForLink = 'Tip';

  const typePrefixForLink = `[${typeNameForLink}]`;
  const fallbackDescForLink = selectedMenu 
    ? `${selectedMenu.charAt(0).toUpperCase() + selectedMenu.slice(1)} — ${merchantName}` 
    : `Payment — ${merchantName}`;
  const finalDescForLink = description.trim()
    ? `${typePrefixForLink} ${description.trim()}`
    : `${typePrefixForLink} ${fallbackDescForLink}`;

  let routePath = 'pay';
  if (selectedMenu === 'invoices') routePath = 'invoice';
  else if (selectedMenu === 'checkouts') routePath = 'checkout';
  else if (selectedMenu === 'tip') routePath = 'tip';

  const routePrefix = paymentType === 'onetime' ? routePath : 'subscribe';
  const paymentLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/${routePrefix}/${createdSessionId || 'preview_id'}?desc=${encodeURIComponent(finalDescForLink)}`
    : `https://lumipay.app/${routePrefix}/preview_id`;

  const embedSnippet = `<script src="https://lumipay.app/widget.js" type="module"></script>
<lumipay-checkout 
  merchant="${address || '0x...'}" 
  amount="${amount || '0.00'}" 
  currency="${selectedToken}" 
  session="${createdSessionId || 'preview_id'}"
  theme="dark">
</lumipay-checkout>`;

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

  if (!isConnected) return (
    <div className="fixed inset-0 z-[100] bg-[#FEF7ED] flex items-center justify-center p-6 animate-fade-in overflow-hidden pixel-grid">
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#fc5000]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#fc5000]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full caldera-card p-10 text-center relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-pop-in">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000] via-[#fc5000] to-transparent rounded-t-[2.5rem]" />
        <div className="w-20 h-20 bg-[#fc5000]/12 rounded-[2rem] border border-[#fc5000]/25 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(252,80,0,0.15)]">
          <Shield className="w-10 h-10 text-[#fc5000]" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Identity Required</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-10 font-medium">
          To create payment links, you must connect your Web3 identity. This ensures you can receive settlements directly into your self-custody wallet.
        </p>

        <button
          onClick={() => (document.querySelector('appkit-button') as any)?.click()}
          className="btn-orange w-full py-4 text-white text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group"
        >
          <span>Connect Identity</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>

        <Link href="/" className="inline-block mt-8 text-[10px] font-black text-gray-600 hover:text-gray-500 uppercase tracking-widest transition-colors">
          &larr; Back to Landing Page
        </Link>
      </div>
    </div>
  );

  if (!selectedMenu) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0 pt-10 pb-24 animate-pop-in">
        <div className="text-center space-y-3 mb-10">
          <h1
            className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight px-1 uppercase"
            style={{ fontFamily: 'var(--font-dm-sans)', letterSpacing: '-0.02em' }}
          >
            Create a <span className="gradient-text-orange">Payment</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Set up a Checkout, Invoice, Subscription, or Tip in just a few clicks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { menu: 'invoices', type: 'onetime', icon: Receipt, label: 'Invoices', desc: 'A hosted shareable link', accent: '#fc5000' },
            { menu: 'checkouts', type: 'onetime', icon: CreditCard, label: 'Checkouts', desc: 'Embed directly into your site or app', accent: '#fc5000' },
            { menu: 'subscribtion', type: 'subscription', icon: Zap, label: 'Subscription', desc: 'Recurring billing', accent: '#fc5000' },
            { menu: 'tip', type: 'onetime', icon: QrCode, label: 'Tip', desc: 'Accept spontaneous contributions', accent: '#fc5000' },
          ].map((item) => (
            <button
              key={item.menu}
              onClick={() => { setSelectedMenu(item.menu as any); setPaymentType(item.type as any); }}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 p-6 caldera-card hover-lift text-center sm:text-left group w-full"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform"
                style={{
                  background: `${item.accent}15`,
                  borderColor: `${item.accent}30`,
                  color: item.accent,
                }}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-center sm:items-start">
                <h3 className="text-base font-black text-slate-900 capitalize tracking-tight mb-1 group-hover:text-[#fc5000] transition-colors uppercase">{item.label}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-24 px-4 sm:px-0">
      
      {/* ── Page Header (REFRESHED) ── */}
      <div className="text-center sm:text-left space-y-4">
        <button 
          onClick={() => setSelectedMenu(null)}
          className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to options
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-200 pb-8">
           <div className="space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fc5000]/10 border border-[#fc5000]/20 shadow-[0_0_12px_rgba(252,80,0,0.08)]">
                  <Zap className="w-3.5 h-3.5 text-[#fc5000] fill-violet-400/20" />
                  <span className="text-[10px] font-black text-[#fc5000] uppercase tracking-[0.2em]">
                    Payment Gateway
                  </span>
                </div>
                <span className="hidden sm:inline text-xs text-gray-500 font-medium">• Stateless Dispatch</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight px-1 italic uppercase">
                Create <span className="text-[#fc5000]">{selectedMenu}</span>
              </h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest sm:max-w-md">Issue professional cryptographic billing endpoints in seconds.</p>
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
        <div className="p-5 rounded-2xl bg-[#fc5000]/5 border border-[#fc5000]/10 text-[10px] text-gray-500 flex items-center gap-4 font-bold uppercase tracking-widest leading-relaxed">
          <Sparkles className="w-5 h-5 text-[#fc5000] shrink-0" />
          <span>Notice: Operating as Anonymous. You can verify your brand in the Account settings.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* ── CREATE FORM (Left - 7 cols) ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="caldera-card p-8 sm:p-10 shadow-2xl relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000]/60 via-[#fc5000]/40 to-transparent rounded-t-[2.5rem]" />
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
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-2xl py-4 pl-10 pr-4 text-slate-900 text-lg font-black focus:border-[#fc5000] focus:shadow-[0_0_0_3px_rgba(104,54,232,0.15)] outline-none transition-all"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-1">
                    * A 2% protocol fee is deducted upon settlement
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Settlement Token</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white border-[1.5px] border-gray-200 rounded-2xl">
                    {SUPPORTED_TOKENS.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => setSelectedToken(token.symbol as SupportedToken)}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          selectedToken === token.symbol
                            ? 'bg-[#fc5000] text-slate-900 shadow-[0_0_16px_rgba(104,54,232,0.40)]'
                            : 'text-gray-500 hover:text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {token.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">{selectedMenu} Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Premium Digital Access"
                  className="w-full bg-white border-[1.5px] border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-[#fc5000] focus:shadow-[0_0_0_3px_rgba(104,54,232,0.15)] outline-none transition-all"
                />
              </div>

              {paymentType === 'onetime' ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiration Period</label>
                  <select
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(e.target.value)}
                    className="w-full bg-white border-[1.5px] border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-[#fc5000] outline-none appearance-none cursor-pointer"
                  >
                    <option value="1" className="bg-white">24 Hours</option>
                    <option value="7" className="bg-white">7 Days (Recommended)</option>
                    <option value="30" className="bg-white">30 Days</option>
                    <option value="365" className="bg-white">1 Year</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Billing Interval</label>
                  <div className="space-y-3">
                    <select
                      value={intervalType}
                      onChange={(e) => handleIntervalTypeChange(e.target.value)}
                      className="w-full bg-white border-[1.5px] border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-[#fc5000] outline-none appearance-none cursor-pointer"
                    >
                      <option value="7" className="bg-white">7 Days (Weekly)</option>
                      <option value="30" className="bg-white">30 Days (Monthly — Recommended)</option>
                      <option value="90" className="bg-white">90 Days (Quarterly)</option>
                      <option value="365" className="bg-white">365 Days (Yearly)</option>
                      <option value="custom" className="bg-white">Custom Days...</option>
                    </select>

                    {intervalType === 'custom' && (
                      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                          type="number"
                          value={subInterval === '7' || subInterval === '30' || subInterval === '90' || subInterval === '365' ? '' : subInterval}
                          onChange={(e) => setSubInterval(e.target.value)}
                          placeholder="Enter custom number of days"
                          min="1"
                          className="flex-1 bg-white border-[1.5px] border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-[#fc5000] outline-none"
                          required
                        />
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Days</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || isTxConfirming || !amount || Number(amount) <= 0 || !isConnected}
                className="btn-orange w-full py-5 text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending || isTxConfirming ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Finalizing on L1...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Create {selectedMenu === 'subscribtion' ? 'Subscription' : selectedMenu?.charAt(0).toUpperCase() + selectedMenu?.slice(1)}</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── OUTPUT PREVIEW (Right - 5 cols) ── */}
        <div className="lg:col-span-5 space-y-6">
          {!createdSessionId ? (
            <div className="bg-white/[0.01] border border-gray-200 border-dashed rounded-[2.5rem] p-12 text-center space-y-6 animate-pulse">
               <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
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
              <div className="bg-white border border-emerald-500/20 rounded-[2.5rem] p-8 space-y-8 shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                      <CheckCircle2 className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Paylink Deployed</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent on-chain endpoint</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl group">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2 ml-1">Customer Access URL</p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-[10px] text-[#fc5000] font-mono truncate">{paymentLink}</code>
                      <button 
                        onClick={() => copyToClipboard(paymentLink, 'link')}
                        className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-slate-900 transition-all shrink-0"
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
                      className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all border border-gray-200"
                    >
                      Dashboard <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* EMBED WIDGET CARD */}
              <div className="bg-white border border-gray-200 rounded-[2rem] p-8 space-y-6">
                 <div className="flex items-center gap-3">
                   <Monitor className="w-5 h-5 text-[#fc5000]" />
                   <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Embed Web Widget</h4>
                 </div>
                 <div className="relative group">
                    <pre className="bg-white p-4 rounded-2xl text-[9px] font-mono text-gray-500 overflow-x-auto no-scrollbar border border-gray-200 leading-relaxed">
                      {embedSnippet}
                    </pre>
                    <button 
                      onClick={() => copyToClipboard(embedSnippet, 'code')}
                      className="absolute top-3 right-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-slate-900 opacity-0 group-hover:opacity-100 transition-all border border-gray-200"
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
