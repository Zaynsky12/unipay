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
  Activity,
  Upload,
  Trash2
} from 'lucide-react';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';
import Link from 'next/link';

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
  const [logoError, setLogoError] = useState<string | null>(null);

  const { data: merchantData, isLoading: isLoadingRead, refetch } = useReadContract({
    address: LUMIPAY_REGISTRY_ADDRESS,
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

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetch();
      setShowSuccessToast(true);
      const timer = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, refetch]);

  const getErrorMessage = () => {
    const err = writeError || confirmError;
    if (!err) return null;
    if (err.message.includes('User rejected')) {
      return 'Transaction rejected by user in wallet.';
    }
    if (err.message.includes('exceeds the limit') || err.message.includes('out of gas') || err.message.includes('gas limit')) {
      return 'Transaction failed: Image payload is too large for blockchain gas limits. Try a smaller/optimized image.';
    }
    return err.message.substring(0, 100) + '...';
  };

  // Balances
  const { data: rawArcBalance } = useReadContract({ address: USDC_ADDRESS as `0x${string}`, abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, query: { enabled: !!address } });
  const { data: baseBalance } = useReadContract({ address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 8453, query: { enabled: !!address } });
  const { data: arbBalance } = useReadContract({ address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 42161, query: { enabled: !!address } });
  const { data: optBalance } = useReadContract({ address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', abi: ERC20_ABI, functionName: 'balanceOf', args: address ? [address] : undefined, chainId: 10, query: { enabled: !!address } });

  const formatB = (val: any) => val ? Number(formatUnits(val as bigint, 6)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith('image/')) {
      setLogoError("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 128;
            const MAX_HEIGHT = 128;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              if (file.size > 200 * 1024) {
                setLogoError("Image size exceeds the 200 KB limit.");
                return;
              }
              setMerchantLogo(reader.result as string);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            const sizeInBytes = Math.round((compressedDataUrl.length * 3) / 4);
            if (sizeInBytes > 200 * 1024) {
              setLogoError("Compressed image size exceeds 200 KB limit.");
              return;
            }
            
            setMerchantLogo(compressedDataUrl);
          } catch (err) {
            console.error("Image compression error:", err);
            if (file.size > 200 * 1024) {
              setLogoError("Image size exceeds the 200 KB limit.");
              return;
            }
            setMerchantLogo(reader.result as string);
          }
        };
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !merchantName) return;
    const metadataObj = { logo: merchantLogo, website: merchantWebsite, email: merchantEmail, updatedAt: Date.now() };
    const metadataString = JSON.stringify(metadataObj);
    writeContract({ address: LUMIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: [merchantName, metadataString] });
  };



  if (!isConnected) return (
    <div className="fixed inset-0 z-[100] bg-[#FEF7ED] flex items-center justify-center p-6 animate-fade-in overflow-hidden pixel-grid">
      <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-[#fc5000]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-[#fc5000]/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full caldera-card p-10 text-center relative z-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-pop-in">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000] via-[#fc5000] to-transparent rounded-t-[2.5rem]" />
        <div className="w-20 h-20 bg-[#fc5000]/12 rounded-[2rem] border border-[#fc5000]/25 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(252,80,0,0.15)]">
          <Shield className="w-10 h-10 text-[#fc5000]" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4" style={{ fontFamily: 'var(--font-dm-sans)' }}>Identity Required</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-10 font-medium">
          To access the Account Center, you must connect your Web3 identity. This ensures your merchant profile and settlement data are secured by your own wallet.
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in pb-24 font-sans">

      <div className="mb-8 sm:mb-10 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight px-1 uppercase text-center sm:text-left" style={{ fontFamily: 'var(--font-dm-sans)' }}>Account <span className="gradient-text-orange">Center</span></h1>
        <div className="flex items-center gap-2 sm:gap-12 border-b border-gray-200 px-2 overflow-x-auto no-scrollbar scroll-smooth">
          {(['Account', 'Merchant Setting', 'Integrations'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all relative flex-1 sm:flex-none text-center sm:text-left whitespace-nowrap ${
                activeTab === tab ? 'text-[#fc5000]' : 'text-gray-500 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#fc5000] shadow-[0_0_12px_rgba(252,80,0,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {activeTab === 'Account' && (
          <div className="bg-white border border-gray-200 rounded-3xl sm:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="p-10 sm:p-14 flex flex-col items-center text-center border-b border-gray-200 space-y-6">
              <div className="relative group">
                <div className="absolute -inset-4 bg-[#fc5000]/10 rounded-full blur-2xl group-hover:bg-[#fc5000]/18 transition duration-500" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white border-[1.5px] border-gray-200 rounded-[2.5rem] flex items-center justify-center text-gray-500 shadow-2xl overflow-hidden group-hover:border-[#fc5000]/30 transition-all duration-500">
                  {merchantLogo ? (
                    <img src={merchantLogo} alt="logo" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle className="w-12 h-12 opacity-80" />
                  )}
                </div>
              </div>
              
              <div className="space-y-3 w-full">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter truncate max-w-[280px] sm:max-w-none">
                  {isRegistered ? currentName : 'Anonymous'}
                </h1>
                <div className="flex flex-col items-center gap-2">
                  {isRegistered ? (
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified Merchant
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('Merchant Setting')}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500 hover:text-black transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      title="Click to Register"
                    >
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      Register
                    </button>
                  )}
                  {isRegistered && (
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                      {merchantWebsite && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <Globe className="w-3 h-3 text-[#fc5000]" />
                          {merchantWebsite.replace('https://','').replace('http://','')}
                        </div>
                      )}
                      {merchantEmail && (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                          <Mail className="w-3 h-3 text-[#fc5000]" />
                          {merchantEmail}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-8 sm:p-10 border-b border-gray-200 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black text-[#fc5000] uppercase tracking-widest">
                  <TrendingUp className="w-4 h-4" />
                  Live Performance
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
                <div className="space-y-4 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter">
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

            <div className="p-8 sm:p-10 bg-gray-50/50 space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#fc5000] uppercase tracking-widest">
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
                  <div key={c.n} className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-gray-300 shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px]">{c.i}</div>
                      <span className="text-[8px] font-black text-gray-500 uppercase">{c.n}</span>
                    </div>
                    <div className="text-sm font-black text-slate-900">${c.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Merchant Setting' && (
          <div className="bg-white border border-gray-200 rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-12 space-y-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fc5000]/10 border border-[#fc5000]/20 flex items-center justify-center text-[#fc5000]">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Merchant Identity</h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed">Setup your business identity on-chain.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
               {/* Premium Avatar/Logo Upload Zone di Bagian Atas */}
               <div 
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
                 className={`relative w-full rounded-[2rem] border-2 border-dashed p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center cursor-pointer overflow-hidden ${
                   isDragging 
                     ? 'border-[#fc5000] bg-[#fc5000]/8 scale-[1.01] shadow-[0_0_25px_rgba(252,80,0,0.15)]' 
                     : merchantLogo
                       ? 'border-gray-200 bg-white hover:border-[#fc5000]/30 hover:bg-gray-50/50'
                       : 'border-gray-200 bg-gray-50/30 hover:border-[#fc5000]/30 hover:bg-gray-50/80'
                 }`}
               >
                 <input 
                   id="logo-upload"
                   type="file" 
                   accept="image/*" 
                   onChange={handleLogoChange} 
                   className="hidden" 
                 />

                 {merchantLogo ? (
                   <div className="flex flex-col items-center gap-4 w-full">
                     <div className="relative group">
                       {/* Glowing orange ring around the uploaded logo */}
                       <div className="absolute -inset-1 bg-gradient-to-r from-[#fc5000] to-[#ff8040] rounded-[2rem] blur opacity-30 group-hover:opacity-60 transition duration-300" />
                       
                       <div className="relative w-24 h-24 bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-xl flex items-center justify-center">
                         <img src={merchantLogo} alt="logo preview" className="w-full h-full object-cover animate-fade-in" />
                       </div>
                       
                       {/* Little green checkmark badge */}
                       <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-md">
                         <CheckCircle2 className="w-3.5 h-3.5" />
                       </div>
                     </div>

                     <div className="space-y-1">
                       <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Brand Logo Loaded</span>
                       <p className="text-[9px] text-[#fc5000] font-bold uppercase tracking-wider">Drag or upload another image to replace</p>
                     </div>

                     <div className="flex items-center gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
                       <label htmlFor="logo-upload" className="cursor-pointer px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-800 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border border-gray-200 shadow-sm flex items-center gap-1.5">
                         <Upload className="w-3 h-3 text-[#fc5000]" /> Change Logo
                       </label>
                       <button
                         type="button"
                         onClick={() => setMerchantLogo('')}
                         className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all hover:scale-105 active:scale-95 border border-red-500/20 shadow-sm flex items-center gap-1.5"
                         title="Remove Logo"
                       >
                         <Trash2 className="w-3 h-3" /> Remove
                       </button>
                     </div>
                   </div>
                 ) : (
                   <label htmlFor="logo-upload" className="flex flex-col items-center justify-center gap-3 w-full h-full py-4 cursor-pointer">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                       isDragging 
                         ? 'bg-[#fc5000] text-white scale-110 shadow-lg' 
                         : 'bg-[#fc5000]/10 text-[#fc5000] hover:scale-110'
                     }`}>
                       <Upload className={`w-6 h-6 ${isDragging ? 'animate-bounce' : ''}`} />
                     </div>
                     
                     <div className="space-y-1">
                       <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                         {isDragging ? 'Drop your logo here!' : 'Drag & drop your logo here'}
                       </p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                         or <span className="text-[#fc5000] underline">browse files</span> from your computer
                       </p>
                     </div>
                     
                     <div className="pt-2 border-t border-gray-100 w-2/3 max-w-[200px]">
                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                         PNG, JPG, GIF, SVG • MAX 200 KB
                       </p>
                     </div>
                   </label>
                 )}

                 {logoError && (
                   <div className="absolute bottom-4 left-0 right-0 flex items-center gap-1.5 text-[9px] text-red-500 font-black uppercase tracking-widest justify-center animate-in fade-in slide-in-from-top-1 duration-200">
                     <AlertCircle className="w-3.5 h-3.5" />
                     <span>{logoError}</span>
                   </div>
                 )}
               </div>

               {/* Grid Input Fields di Bawah Logo */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Brand Name</label>
                    <input type="text" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} placeholder="Acme Corp" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-violet-500 outline-none transition-colors" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Business Email</label>
                    <input type="email" value={merchantEmail} onChange={(e) => setMerchantEmail(e.target.value)} placeholder="contact@brand.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-violet-500 outline-none transition-colors" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Official Website</label>
                    <input type="url" value={merchantWebsite} onChange={(e) => setMerchantWebsite(e.target.value)} placeholder="https://brand.com" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-5 text-slate-900 text-sm font-bold focus:border-violet-500 outline-none transition-colors" />
                  </div>
               </div>
               {/* Error Display */}
               {(writeError || confirmError) && (
                 <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
                   <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                   <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Transaction Failed</p>
                     <p className="text-xs font-semibold text-gray-600">{getErrorMessage()}</p>
                   </div>
                 </div>
               )}

               {/* Success Display */}
               {showSuccessToast && (
                 <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
                   <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                   <div className="text-left">
                     <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Profile Saved</p>
                     <p className="text-xs font-semibold text-gray-600">Your merchant profile and settings have been successfully secured on-chain.</p>
                   </div>
                 </div>
               )}

               <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={isPending || isTxConfirming || !merchantName} className="btn-orange flex-1 py-4 text-white text-[10px] font-black uppercase flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed">
                    {isPending || isTxConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4" />Save Profile</>}
                  </button>
               </div>
            </form>
          </div>
        )}

        {activeTab === 'Integrations' && (
          <div className="bg-white border border-gray-200 rounded-3xl py-16 text-center space-y-4 px-6">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-200 text-gray-600"><Puzzle className="w-8 h-8" /></div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Coming Soon</h2>
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
      <Loader2 className="w-8 h-8 text-[#fc5000] animate-spin" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Loading Account Center...</p>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
