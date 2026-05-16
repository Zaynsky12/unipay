"use client";

import React, { useState, useEffect } from 'react';
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

export default function AccountPage() {
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
  const { data: rawArcBalance, isLoading: isLoadingArc } = useReadContract({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: baseBalance, isLoading: isLoadingBase } = useReadContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 8453, query: { enabled: !!address } });
  const { data: arbBalance, isLoading: isLoadingArb } = useReadContract({ address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 42161, query: { enabled: !!address } });
  const { data: optBalance, isLoading: isLoadingOpt } = useReadContract({ address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 10, query: { enabled: !!address } });

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
    <div className="max-w-2xl mx-auto px-6 py-20 text-center animate-fade-in">
      <div className="w-16 h-16 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto border border-violet-500/20 mb-6"><Shield className="w-8 h-8 text-violet-500" /></div>
      <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Identity Required</h2>
      <button onClick={() => (document.querySelector('appkit-button') as any)?.click()} className="px-8 py-3 bg-violet-600 text-white text-[10px] font-black rounded-xl shadow-xl shadow-violet-600/20 transition-all uppercase tracking-widest">Connect Wallet</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in pb-24 font-sans">
      
      {/* ── HEADER & TABS (REVERTED TO UNDERLINE STYLE) ── */}
      <div className="mb-8 sm:mb-10 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight px-1">Account</h1>
        <div className="flex items-center gap-8 sm:gap-10 border-b border-white/5 px-2 overflow-x-auto no-scrollbar scroll-smooth">
          {(['Account', 'Merchant Setting', 'Integrations'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
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

      {/* ── TAB CONTENT ── */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {activeTab === 'Account' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* CARD HEADER (CENTERED) */}
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

            {/* PERFORMANCE SECTION */}
            <div className="p-8 sm:p-10 border-b border-white/5 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  Live Performance
                </div>
                {merchantWebsite && (
                  <a href={merchantWebsite} target="_blank" className="text-[9px] font-black text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 uppercase tracking-widest truncate max-w-[150px]">
                    <Globe className="w-3 h-3" />
                    {merchantWebsite.replace('https://','').replace('http://','')}
                  </a>
                )}
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

            {/* LIQUIDITY SECTION */}
            <div className="p-8 sm:p-10 bg-white/[0.01] space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <Globe2 className="w-4 h-4 text-blue-500" />
                Cross-Chain Liquidity
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

        {/* TAB 2: MERCHANT SETTING */}
        {activeTab === 'Merchant Setting' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 space-y-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Merchant Identity</h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed">Setup your business identity on-chain to start accepting custom branded payments.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Brand Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                      <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Acme Corp" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Business Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                      <input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} placeholder="contact@brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Official Website</label>
                    <div className="relative group">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                      <input type="url" value={merchantWebsite} onChange={(e) => setMerchantWebsite(e.target.value)} placeholder="https://brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Logo URL</label>
                    <div className="relative group">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                      <input type="text" value={merchantLogo} onChange={(e) => setMerchantLogo(e.target.value)} placeholder="https://brand.com/logo.png" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" />
                    </div>
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

        {/* TAB 3: INTEGRATIONS */}
        {activeTab === 'Integrations' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-3xl py-16 text-center space-y-4 px-6">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5 text-gray-600"><Puzzle className="w-8 h-8" /></div>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">Integrations Coming Soon</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Connect UniPay to your existing store with our API.</p>
          </div>
        )}

      </div>
    </div>
  );
}
