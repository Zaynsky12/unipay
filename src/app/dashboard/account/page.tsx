"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  Building2, 
  Loader2, 
  AlertCircle,
  Shield,
  ArrowRight,
  TrendingUp,
  Globe2,
  CheckCircle2,
  Clock,
  Settings,
  Wallet,
  Users,
  Puzzle,
  Lock,
  ExternalLink,
  UserCircle,
  Globe,
  Mail,
  Image as ImageIcon,
  UserCog,
  Save,
  Activity
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';

type TabType = 'Account' | 'Merchant Setting' | 'Integrations';

// Kita pindahkan logika utama ke komponen internal agar bisa dibungkus Suspense
function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType;
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Account');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  
  const [merchantName, setMerchantName] = useState('');
  const [merchantLogo, setMerchantLogo] = useState('');
  const [merchantWebsite, setMerchantWebsite] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');

  const { data: merchantData, isLoading: isLoadingRead, refetch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegisteredOnchain = merchantData ? (merchantData as any)[2] : false;
  const currentName = isRegisteredOnchain ? ((merchantData as any)?.[0] as string || '') : '';
  const currentMetadataRaw = isRegisteredOnchain ? ((merchantData as any)?.[1] as string || '') : '';
  const totalReceived = merchantData ? (merchantData as any)[3] : 0n;
  const totalTx = merchantData ? (merchantData as any)[4] : 0n;
  const isRegistered = isRegisteredOnchain && currentName !== '' && currentName !== 'Anonymous';

  useEffect(() => {
    if (isRegistered && currentMetadataRaw) {
      setMerchantName(currentName);
      try {
        const cleanMetadata = currentMetadataRaw.trim();
        if (cleanMetadata.includes('{')) {
          const jsonStr = cleanMetadata.substring(cleanMetadata.indexOf('{'));
          const meta = JSON.parse(jsonStr);
          setMerchantLogo(meta.logo || '');
          setMerchantWebsite(meta.website || '');
          setMerchantEmail(meta.email || '');
        }
      } catch (e) {
        console.log("Metadata parse error", e);
      }
    }
  }, [isRegistered, currentName, currentMetadataRaw]);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { if (isSuccess) refetch(); }, [isSuccess, refetch]);

  // Balances
  const { data: rawArcBalance } = useReadContract({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: baseBalance } = useReadContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 8453, query: { enabled: !!address } });
  const { data: arbBalance } = useReadContract({ address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 42161, query: { enabled: !!address } });
  const { data: optBalance } = useReadContract({ address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 10, query: { enabled: !!address } });

  const formatB = (val: any) => val ? Number(formatUnits(val as bigint, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !merchantName) return;
    const metadataObj = { logo: merchantLogo, website: merchantWebsite, email: merchantEmail, updatedAt: Date.now() };
    const metadataString = JSON.stringify(metadataObj);
    writeContract({ address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: [merchantName, metadataString] });
  };

  const handleReset = () => {
    if (!address) return;
    if (confirm("Reset profile to Anonymous?")) {
      writeContract({ address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: ['Anonymous', ''] });
    }
  };

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
          To access the Account Center, you must connect your Web3 identity. This ensures your merchant profile and settlement data are secured by your own wallet.
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in pb-24 font-sans">
      
      <div className="mb-8 sm:mb-10 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight px-1 italic uppercase text-center sm:text-left">Account <span className="text-violet-500">Center</span></h1>
        <div className="flex items-center border-b border-white/5 px-2 overflow-x-auto no-scrollbar scroll-smooth">
          {(['Account', 'Merchant Setting', 'Integrations'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all relative flex-1 sm:flex-none text-center sm:text-left whitespace-nowrap ${
                activeTab === tab ? 'text-violet-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'Account' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-10 sm:p-14 flex flex-col items-center text-center border-b border-white/5 space-y-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-violet-600/20 rounded-full blur-2xl group-hover:bg-violet-600/30 transition duration-500" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-black border-2 border-white/10 rounded-[2.5rem] flex items-center justify-center text-violet-500 shadow-2xl overflow-hidden group-hover:border-violet-500/50 transition-all duration-500">
                  {merchantLogo ? (
                    <img src={merchantLogo} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 opacity-80" />
                  )}
                </div>
              </div>
              
              <div className="space-y-3 w-full">
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter truncate max-w-[280px] sm:max-w-none">
                  {isRegistered ? currentName : 'Anonymous'}
                </h1>
                <div className="flex flex-col items-center gap-2">
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${isRegistered ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {isRegistered ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    {isRegistered ? 'Verified Merchant' : 'Unverified Identity'}
                  </div>
                  {isRegistered && (
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      {merchantWebsite && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <Globe className="w-3 h-3 text-violet-500" />
                          {merchantWebsite.replace('https://','').replace('http://','')}
                        </div>
                      )}
                      {merchantEmail && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <Mail className="w-3 h-3 text-blue-500" />
                          {merchantEmail}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 border-b border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  Live Performance
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                      ${formatUnits(totalReceived, 6)}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Revenue</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">{totalTx.toString()} Settlements</span>
                    </div>
                  </div>
                </div>
                <div className="w-full h-24 relative overflow-hidden">
                   <svg viewBox="0 0 400 100" className="w-full h-full stroke-emerald-500 stroke-2 fill-emerald-500/5" preserveAspectRatio="none">
                      <path d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50 L400,100 L0,100 Z" strokeWidth="0" />
                      <path d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50" fill="transparent" />
                   </svg>
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 bg-white/[0.01] space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                <Globe2 className="w-4 h-4" />
                My Asset
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { n: 'ARC', b: formatB(rawArcBalance), i: '🟣' },
                  { n: 'BASE', b: formatB(baseBalance), i: '🔵' },
                  { n: 'ARB', b: formatB(arbBalance), i: '💙' },
                  { n: 'OPT', b: formatB(optBalance), i: '🔴' },
                ].map((c) => (
                  <div key={c.n} className="bg-[#12121A] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px]">{c.i}</div>
                      <span className="text-[8px] font-black text-gray-600 uppercase">{c.n}</span>
                    </div>
                    <div className="text-sm font-black text-white">${c.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Merchant Setting' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 space-y-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Merchant Identity</h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed">Setup your business identity on-chain.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Brand Name</label>
                    <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Acme Corp" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Business Email</label>
                    <input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} placeholder="contact@brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Official Website</label>
                    <input type="url" value={merchantWebsite} onChange={(e) => setMerchantWebsite(e.target.value)} placeholder="https://brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Logo URL</label>
                    <input type="text" value={merchantLogo} onChange={(e) => setMerchantLogo(e.target.value)} placeholder="https://brand.com/logo.png" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white text-sm font-bold focus:border-violet-500 outline-none" />
                  </div>
               </div>
               <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={isPending || isTxConfirming || !merchantName} className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-xl shadow-violet-600/20 flex items-center justify-center gap-3">
                    {isPending || isTxConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" />Save Profile</>}
                  </button>
                  <button type="button" onClick={handleReset} className="px-8 py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-2xl border border-red-500/20 transition-all">Reset</button>
               </div>
            </form>
          </div>
        )}

        {activeTab === 'Integrations' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl py-16 text-center space-y-4 px-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5 text-gray-600"><Puzzle className="w-8 h-8" /></div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Coming Soon</h2>
          </div>
        )}
      </div>
    </div>
  );
}

// Default export yang dibungkus Suspense agar build Vercel aman
export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loading Account Center...</p>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
