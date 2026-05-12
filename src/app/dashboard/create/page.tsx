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
  ArrowLeft,
  Coins,
  Clock,
  Sparkles,
  ExternalLink,
  ArrowUpRight
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
  
  // State Form
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<SupportedToken>('USDC');
  const [description, setDescription] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  // State Hasil Link/Sesi
  const [createdSessionId, setCreatedSessionId] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Status Pedagang Aktif
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const merchantName = merchantData?.[0] || 'Verified Merchant';
  const isRegistered = merchantData ? merchantData[2] : false;

  // Penulisan kontrak pembuatan sesi
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess, data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !address) return;

    const tokenObj = SUPPORTED_TOKENS.find(t => t.symbol === selectedToken);
    if (!tokenObj) return;

    const amountUnits = parseUnits(amount, tokenObj.decimals);
    const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400;

    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'createSession',
      args: [amountUnits, tokenObj.address, description || `Checkout Dispatch — ${merchantName}`, BigInt(expiryTimestamp)],
      gas: 500000n, // Memaksa batas gas L1 super longgar
    });
  };

  // Tangkap ID Sesi dan catat secara persisten ke LocalStorage agar langsung muncul di List Dashboard
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

      // Simpan rincian sesi ini ke LocalStorage untuk konsumsi Daftar Halaman Dashboard
      if (address && typeof window !== 'undefined') {
        try {
          const storageKey = `unipay_sessions_${address.toLowerCase()}`;
          const existing = localStorage.getItem(storageKey);
          const sessionsArray = existing ? JSON.parse(existing) : [];
          
          // Hindari duplikasi jika sesi dengan ID yang sama sudah tercatat
          if (!sessionsArray.some((s: any) => s.sessionId === extractedId)) {
            const expiryTimestamp = Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400;
            const newSessionObj = {
              sessionId: extractedId,
              amount: amount || '0.00',
              token: selectedToken,
              description: description || `Checkout Dispatch — ${merchantName}`,
              expiryTimestamp: expiryTimestamp,
              createdAt: Date.now(),
              isPaid: false
            };
            
            // Simpan di posisi teratas
            localStorage.setItem(storageKey, JSON.stringify([newSessionObj, ...sessionsArray]));
          }
        } catch (err) {
          console.error("Gagal mencatat sesi persisten ke localStorage:", err);
        }
      }

    }
  }, [isSuccess, txReceipt, txHash, address, amount, selectedToken, description, merchantName, expiryDays]);

  const paymentLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/pay/${createdSessionId || 'preview_id'}` 
    : `https://unipay.app/pay/${createdSessionId || 'preview_id'}`;

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
      
      {/* ── Tombol Kembali & Judul Halaman Premium ── */}
      <div className="flex items-center gap-4 pb-6 border-b border-white/5">
        <Link 
          href="/dashboard" 
          className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-gray-400 hover:text-white transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              Session Issuer
            </span>
            <span className="text-xs text-gray-500">• Fully Decentralized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Create Smart Payment Dispatch</h1>
        </div>
      </div>

      {!isRegistered && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-3 font-medium animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Notice: You operate an uninitialized address state. Buyers will review your primary cryptographic hash instead of a branded corporate alias.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Sisi Kiri: Form Input Spesifikasi (7 Kolom) ── */}
        <div className="lg:col-span-7 glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Parameters Spec
            </span>
            <span className="text-[10px] text-gray-500 font-mono">Registry: L1 Target</span>
          </div>

          <form onSubmit={handleCreateSession} className="space-y-6">
            
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Select Base Currency *
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
              <label className="block text-xs font-bold text-violet-300/90 mb-2 uppercase tracking-wider">
                Requested Settlement Amount *
              </label>
              <div className="relative rounded-2xl bg-black/40 border border-white/10 focus-within:border-violet-500/50 focus-within:shadow-[0_0_20px_rgba(124,58,237,0.1)] transition-all">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-violet-400/50 select-none">
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-violet-400 bg-violet-600/10 px-2 py-1 rounded border border-violet-500/20 select-none">
                  {selectedToken}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1.5 justify-between">
                <span>Bridged instantly via Arc App Kit</span>
                <span className="text-emerald-500/90 font-medium">&lt; 1s settlement finality</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Item Description / Checkout Notes
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. VIP Lifetime Subscriptions access"
                className="input-field p-4 text-xs font-bold bg-black/40 border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                Session Lifecycle Expiry
              </label>
              <div className="relative flex items-center">
                <Clock className="w-4 h-4 text-violet-400/80 absolute left-4" />
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="input-field p-4 pl-11 text-xs font-bold bg-black/40 border-white/10 cursor-pointer outline-none focus:border-violet-500/50"
                >
                  <option value="1" className="bg-[#0A0A0F] text-white">24 Hours valid duration</option>
                  <option value="3" className="bg-[#0A0A0F] text-white">3 Days valid duration</option>
                  <option value="7" className="bg-[#0A0A0F] text-white">7 Days valid duration</option>
                  <option value="30" className="bg-[#0A0A0F] text-white">30 Days valid duration</option>
                </select>
              </div>
            </div>

            {writeError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                {writeError.message || 'Smart Contract transaction execution intercepted.'}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || isTxConfirming || !amount}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm mt-4 tracking-wide shadow-[0_0_25px_rgba(124,58,237,0.35)]"
            >
              {isPending || isTxConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isTxConfirming ? 'Minting Dispatch Endpoint...' : 'Sign Signature Request...'}</span>
                </>
              ) : (
                <span className="font-black">Generate Smart Endpoint</span>
              )}
            </button>
          </form>
        </div>

        {/* ── Sisi Kanan: Output Tautan Pintar & Sematan Widget (5 Kolom) ── */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Spanduk Pemberitahuan Sukses Terintegrasi */}
          {createdSessionId && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3 animate-fade-in shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <h3 className="text-sm font-black text-emerald-300 tracking-tight">Endpoint Minted Immutably ✓</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                This digital billing specification has been recorded directly to the L1 chain. It is now actively mapped inside your <span className="text-white font-bold">Active Payment Endpoints</span> matrix on the main dashboard view.
              </p>
              <div className="pt-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all"
                >
                  <span>← View on Dashboard Matrix</span>
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
                <span className="text-xs font-bold text-white uppercase tracking-wider">Payment Endpoint URL</span>
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
                    <span>Copy URL</span>
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
              Inject this native HTML tag onto any external application framework to instantiate a trustless checkout modal immediately.
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
