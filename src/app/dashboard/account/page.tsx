"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Activity,
  Verified,
  Upload,
  X,
  LockIcon
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';

type TabType = 'Account' | 'Merchant Profile' | 'Integrations';

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') as TabType;
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'Account');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  
  // States
  const [merchantName, setMerchantName] = useState('');
  const [merchantLogo, setMerchantLogo] = useState('');
  const [merchantWebsite, setMerchantWebsite] = useState('');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Fetch On-chain Data
  const { data: merchantData, isLoading: isLoadingRead, refetch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address && isConnected }
  });

  const mData = (merchantData as any) || [];
  const currentName = mData[0] || '';
  const currentMetadataRaw = mData[1] || '';
  const isRegisteredOnchain = mData[2] || false;
  const totalReceived = mData[3] || 0n;
  const totalTx = mData[4] || 0n;
  const isRegistered = isRegisteredOnchain && currentName !== '' && currentName !== 'Anonymous';

  useEffect(() => {
    if (isRegisteredOnchain && isConnected) {
      setMerchantName(currentName);
      if (currentMetadataRaw && currentMetadataRaw.startsWith('{')) {
        try {
          const meta = JSON.parse(currentMetadataRaw);
          setMerchantLogo(meta.logo || '');
          setMerchantWebsite(meta.website || '');
          setMerchantEmail(meta.email || '');
        } catch (e) { console.error("Metadata parse error", e); }
      }
    }
  }, [currentName, currentMetadataRaw, isRegisteredOnchain, isConnected]);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => { 
    if (isSuccess) {
      refetch(); 
      setTimeout(() => refetch(), 1500);
    }
  }, [isSuccess, refetch]);

  const { data: rawArcBalance } = useReadContract({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled: !!address && isConnected } });
  const { data: baseBalance } = useReadContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 8453, query: { enabled: !!address && isConnected } });
  const { data: arbBalance } = useReadContract({ address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 42161, query: { enabled: !!address && isConnected } });
  const { data: optBalance } = useReadContract({ address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 10, query: { enabled: !!address && isConnected } });

  const formatB = (val: any) => val ? Number(formatUnits(val as bigint, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 204800) { alert("Image too large! Max 200KB."); return; }
    setUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setMerchantLogo(reader.result as string); setUploadLoading(false); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !merchantName) return;
    const metadataObj = { logo: merchantLogo, website: merchantWebsite, email: merchantEmail, updatedAt: Date.now() };
    writeContract({ address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: [merchantName, JSON.stringify(metadataObj)] });
  };

  const handleReset = () => {
    if (!address) return;
    if (confirm("Reset profile to Anonymous?")) {
      writeContract({ address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: ['Anonymous', ''] });
    }
  };

  const ConnectPlaceholder = ({ title }: { title: string }) => (
    <div className="bg-[#0B0B12] border border-white/10 rounded-[2.5rem] p-16 text-center space-y-6">
      <div className="w-20 h-20 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto border border-violet-500/20 text-violet-500">
        <LockIcon className="w-10 h-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">{title}</h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">Please connect your wallet to access this section.</p>
      </div>
      <button 
        onClick={() => (document.querySelector('appkit-button') as any)?.click()}
        className="px-8 py-3 bg-violet-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-xl shadow-violet-600/20 hover:bg-violet-500 transition-all"
      >
        Connect Wallet
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 animate-fade-in pb-32 font-sans">
      
      {/* ── HEADER & TABS ── */}
      <div className="mb-6 sm:mb-10 space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight px-1 text-center sm:text-left uppercase italic">Account <span className="text-violet-500">Center</span></h1>
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-10 border-b border-white/5 px-1 overflow-x-auto no-scrollbar scroll-smooth">
          {(['Account', 'Merchant Profile', 'Integrations'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all relative whitespace-nowrap flex-1 sm:flex-none ${
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

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
        
        {/* TAB 1: ACCOUNT */}
        {activeTab === 'Account' && (
          <div className="space-y-6">
            <div className="bg-[#0B0B12] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-violet-600/5 to-transparent pointer-events-none" />
              <div className="p-10 sm:p-14 flex flex-col items-center text-center relative z-10 space-y-6">
                <div className="relative">
                  <div className="absolute -inset-6 bg-violet-600/20 rounded-full blur-3xl" />
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 bg-black border-2 border-white/10 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-violet-500 shadow-2xl overflow-hidden">
                    {isConnected && merchantLogo ? (
                      <img src={merchantLogo} alt="logo" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-14 h-14 opacity-80" />
                    )}
                  </div>
                  {isConnected && isRegistered && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-[#0B0B12] flex items-center justify-center text-white shadow-xl">
                      <Verified className="w-5 h-5" />
                    </div>
                  )}
                </div>
                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter truncate max-w-[280px] sm:max-w-none">
                      {!isConnected ? 'Not Connected' : isRegistered ? currentName : 'Anonymous'}
                    </h1>
                    <div className="flex flex-col items-center gap-3">
                      {!isConnected ? (
                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-500/10 text-amber-400 border-amber-500/20">
                          Please Connect Wallet
                        </div>
                      ) : isRegistered ? (
                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          Verified Merchant
                        </div>
                      ) : (
                        <button 
                          onClick={() => setActiveTab('Merchant Profile')}
                          className="px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black transition-all shadow-lg shadow-amber-500/10 active:scale-95 cursor-pointer"
                        >
                          Register Now
                        </button>
                      )}
                      
                      {isConnected && isRegistered && (
                        <div className="flex flex-wrap justify-center gap-2 mt-2">
                          {merchantWebsite && <a href={merchantWebsite} target="_blank" className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] font-bold text-gray-400 hover:text-violet-400"><Globe className="w-3 h-3" />{merchantWebsite.replace('https://','').replace('http://','')}</a>}
                          {merchantEmail && <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-lg text-[9px] font-bold text-gray-400"><Mail className="w-3 h-3" />{merchantEmail}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              <div className="px-8 sm:px-12 py-10 border-t border-white/5 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-4 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1"><Activity className="w-4 h-4" />Protocol Performance</div>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">${isConnected ? formatUnits(totalReceived, 6) : '0.00'}</span>
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Revenue</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-lg border border-emerald-500/10"><CheckCircle2 className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">{isConnected ? totalTx.toString() : '0'} Settlements</span></div>
                    </div>
                  </div>
                  <div className="w-full h-24 relative overflow-hidden opacity-50"><svg viewBox="0 0 400 100" className="w-full h-full stroke-emerald-500 stroke-2 fill-emerald-500/5" preserveAspectRatio="none"><path d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50 L400,100 L0,100 Z" strokeWidth="0" /><path d="M0,80 Q50,70 100,85 T200,60 T300,75 T400,50" fill="transparent" /></svg></div>
                </div>
              </div>
              <div className="p-8 sm:p-12 space-y-6">
                <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest"><Wallet className="w-4 h-4" />My Assets</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[{ n: 'ARC', b: formatB(rawArcBalance), i: '🟣' }, { n: 'BASE', b: formatB(baseBalance), i: '🔵' }, { n: 'ARB', b: formatB(arbBalance), i: '💙' }, { n: 'OPT', b: formatB(optBalance), i: '🔴' }].map((c) => (
                    <div key={c.n} className="bg-[#12121A] border border-white/5 rounded-2xl p-4 transition-all hover:border-violet-500/20 group/item">
                      <div className="flex items-center justify-between mb-3"><span className="text-xl group-hover/item:scale-110 transition-transform">{c.i}</span><span className="text-[8px] font-black text-gray-600 uppercase">{c.n}</span></div>
                      <div className="text-sm font-black text-white">${isConnected ? c.b : '0.00'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MERCHANT PROFILE */}
        {activeTab === 'Merchant Profile' && (
          !isConnected ? <ConnectPlaceholder title="Profile Management" /> : (
          <div className="bg-[#0B0B12] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 space-y-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[100px] pointer-events-none" />
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-violet-600/10 flex items-center justify-center text-violet-500 border border-violet-500/20"><UserCog className="w-6 h-6 sm:w-7 sm:h-7" /></div>
              <div><h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Setup Profile</h2><p className="text-[9px] sm:text-xs text-gray-500 uppercase tracking-widest font-medium">Manage your brand identity on the blockchain.</p></div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Brand Logo</label>
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                      <div className="relative w-24 h-24 bg-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">{merchantLogo ? <><img src={merchantLogo} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => setMerchantLogo('')} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"><X className="w-3 h-3" /></button></> : <ImageIcon className="w-8 h-8 opacity-20" />}</div>
                      <div className="flex-1 space-y-2 text-center sm:text-left"><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*"/><button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadLoading} className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2 mx-auto sm:mx-0">{uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{merchantLogo ? 'Change Logo' : 'Upload Logo'}</button><p className="text-[9px] text-gray-500 uppercase font-medium">Recommended: Square PNG/SVG, max 200KB.</p></div>
                    </div>
                  </div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Merchant Name</label><div className="relative group"><Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" /><input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Acme Corp" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" required /></div></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Business Email</label><div className="relative group"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" /><input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} placeholder="contact@brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" /></div></div>
                  <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Official Website</label><div className="relative group"><Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" /><input type="url" value={merchantWebsite} onChange={(e) => setMerchantWebsite(e.target.value)} placeholder="https://brand.com" className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all" /></div></div>
               </div>
               <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={isPending || !merchantName} className="flex-[2] py-4.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-black uppercase rounded-2xl transition-all shadow-xl shadow-violet-600/30 flex items-center justify-center gap-3">{isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" />Save All Changes</>}</button>
                  <button type="button" onClick={handleReset} className="flex-1 py-4.5 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-2xl border border-red-500/20 transition-all">Delete Profile</button>
               </div>
            </form>
          </div>
          )
        )}

        {/* TAB 3: INTEGRATIONS */}
        {activeTab === 'Integrations' && (
          <div className="bg-[#0B0B12] border border-white/10 rounded-[2.5rem] p-16 text-center space-y-8 shadow-xl">
            <div className="w-24 h-24 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto border border-blue-500/20"><Puzzle className="w-12 h-12 text-blue-500" /></div>
            <div className="space-y-3"><h2 className="text-2xl font-black text-white uppercase tracking-tight">API Integration</h2><p className="text-xs text-gray-500 uppercase tracking-widest font-medium max-w-xs mx-auto leading-relaxed">Accept on-chain payments directly on your website using our SDK.</p></div>
            <div className="inline-block px-10 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] animate-pulse">Coming Soon</div>
          </div>
        )}
      </div>
    </div>
  );
}
