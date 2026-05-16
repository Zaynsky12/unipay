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
  Verified,
  Upload,
  X,
  LockIcon
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, USDC_ADDRESS, ERC20_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';

type TabType = 'Account' | 'Merchant Profile' | 'Integrations';

// Komponen Konten Utama yang menggunakan SearchParams
function AccountContent() {
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
  
  const arcBalance = formatUnits(rawArcBalance || 0n, 6);
  const totalSales = formatUnits(totalReceived || 0n, 6);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      alert("Logo size must be under 200KB to ensure on-chain compatibility.");
      return;
    }

    setUploadLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMerchantLogo(reader.result as string);
      setUploadLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = () => {
    if (!merchantName.trim()) return;
    const metadataObj = { logo: merchantLogo, website: merchantWebsite, email: merchantEmail, updatedAt: Date.now() };
    const metadataStr = JSON.stringify(metadataObj);

    writeContract({ address: UNIPAY_REGISTRY_ADDRESS, abi: REGISTRY_ABI, functionName: 'registerMerchant', args: [merchantName, metadataStr] });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-violet-500/10 rounded-full border border-violet-500/20">
          <Wallet className="w-12 h-12 text-violet-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Wallet Disconnected</h2>
          <p className="text-gray-500 text-sm max-w-xs mx-auto">Connect your wallet to manage your merchant profile and settings.</p>
        </div>
        <appkit-button />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in-up pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Settings</h1>
             {isRegistered && (
               <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
                 <Shield className="w-3 h-3 text-emerald-500 fill-emerald-500/20" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Verified Merchant</span>
               </div>
             )}
          </div>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            Configure your merchant identity and infrastructure
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse" />
          </p>
        </div>
        
        {/* Verification Status Banner */}
        {!isRegistered && (
          <div className="glass-panel border-amber-500/20 bg-amber-500/5 px-6 py-4 rounded-3xl flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-0.5">Registration Required</p>
              <button 
                onClick={() => setActiveTab('Merchant Profile')}
                className="text-xs font-bold text-white hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Register Now <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 bg-white/[0.02] border border-white/5 rounded-[2rem] w-fit">
        {(['Account', 'Merchant Profile', 'Integrations'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${
              activeTab === tab 
                ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Stats (Visible on Account Tab) */}
        {activeTab === 'Account' && (
          <>
            <div className="lg:col-span-8 space-y-8">
              {/* Account Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-24 h-24 text-violet-500" />
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Total Revenue <span className="w-1 h-1 rounded-full bg-violet-600" />
                  </p>
                  <h3 className="text-4xl font-black text-white tracking-tighter italic mb-2">${totalSales}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">USDC Settlement</span>
                  </div>
                </div>

                <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform">
                    <Users className="w-24 h-24 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Total Transactions <span className="w-1 h-1 rounded-full bg-blue-600" />
                  </p>
                  <h3 className="text-4xl font-black text-white tracking-tighter italic mb-2">{totalTx.toString()}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Successful Sessions</span>
                  </div>
                </div>
              </div>

              {/* Wallet & Security */}
              <div className="glass-panel p-8 md:p-10 rounded-[3rem] space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                    <Lock className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Wallet & Security</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your decentralized settlement point</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-black rounded-xl border border-white/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Active Address</p>
                        <p className="text-xs font-bold text-white font-mono">{address}</p>
                      </div>
                    </div>
                    <button className="px-5 py-2 bg-white/[0.05] hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all">
                      Copy Address
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Network Status</p>
                        <p className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">Connected to Arc Mainnet <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                       <Clock className="w-3 h-3" /> Latency: 12ms
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Assets */}
            <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel p-8 rounded-[3rem] space-y-8 h-full bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Global Balance</h3>
                  <Activity className="w-4 h-4 text-violet-500 animate-pulse" />
                </div>
                
                <div className="space-y-6">
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl group hover:border-violet-500/30 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-black text-[10px]">USDC</div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Arc Network</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Settled</span>
                    </div>
                    <h4 className="text-2xl font-black text-white tracking-tighter">${arcBalance}</h4>
                  </div>

                  <div className="p-5 bg-white/[0.01] border border-white/5 rounded-3xl opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-black text-[10px]">USDC</div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Network</span>
                      </div>
                      <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Coming Soon</span>
                    </div>
                    <h4 className="text-2xl font-black text-gray-600 tracking-tighter italic">$0.00</h4>
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full py-4 bg-violet-600/10 hover:bg-violet-600/20 border border-violet-600/20 rounded-2xl text-[9px] font-black text-violet-400 uppercase tracking-[0.2em] transition-all">
                    Global Asset Insights
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Merchant Profile Tab */}
        {activeTab === 'Merchant Profile' && (
          <div className="lg:col-span-12">
            <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Preview & Logo Upload */}
              <div className="lg:col-span-4 space-y-8">
                <div className="text-center space-y-6">
                  <div className="relative inline-block group">
                    <div className="absolute inset-0 bg-violet-600 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-all" />
                    <div className="relative w-40 h-40 md:w-48 md:h-48 bg-black border-2 border-white/10 rounded-[3rem] overflow-hidden flex items-center justify-center group-hover:border-violet-500/50 transition-all">
                      {merchantLogo ? (
                        <img src={merchantLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-gray-600 group-hover:text-violet-400 transition-colors">
                          <ImageIcon className="w-12 h-12 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                          <span className="text-[8px] font-black uppercase tracking-[0.2em]">No Brand Logo</span>
                        </div>
                      )}
                      
                      {/* Logo Badge Overlay */}
                      {isRegistered && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 border-4 border-[#0B0B12] flex items-center justify-center text-white shadow-xl">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}

                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
                      >
                        <Upload className="w-6 h-6 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Update Logo</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase italic">Max 200KB</span>
                      </button>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight italic">{merchantName || 'Untitled Business'}</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                      <Globe2 className="w-3 h-3" /> {merchantWebsite || 'website.com'}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Branding Tip</p>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-tight italic">
                    Your logo and brand name will be stored on-chain. This identity is used for all your dynamic payment links.
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="lg:col-span-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 group">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-violet-500 transition-colors flex items-center gap-2">
                      <UserCog className="w-3 h-3" /> Business Name
                    </label>
                    <input 
                      type="text" 
                      value={merchantName}
                      onChange={(e) => setMerchantName(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-violet-500 outline-none transition-all placeholder:text-gray-800"
                    />
                  </div>

                  <div className="space-y-3 group">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-blue-500 transition-colors flex items-center gap-2">
                      <Globe className="w-3 h-3" /> Official Website
                    </label>
                    <input 
                      type="text" 
                      value={merchantWebsite}
                      onChange={(e) => setMerchantWebsite(e.target.value)}
                      placeholder="https://yourbrand.com"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-violet-500 outline-none transition-all placeholder:text-gray-800"
                    />
                  </div>

                  <div className="space-y-3 group md:col-span-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 group-focus-within:text-emerald-500 transition-colors flex items-center gap-2">
                      <Mail className="w-3 h-3" /> Support Email
                    </label>
                    <input 
                      type="email" 
                      value={merchantEmail}
                      onChange={(e) => setMerchantEmail(e.target.value)}
                      placeholder="support@yourbrand.com"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:border-violet-500 outline-none transition-all placeholder:text-gray-800"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                      Blockchain write required to sync identity
                    </p>
                  </div>
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isPending || isTxConfirming || uploadLoading}
                    className="w-full md:w-fit px-12 py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-violet-600/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {(isPending || isTxConfirming) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Protocol Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'Integrations' && (
          <div className="lg:col-span-12">
            <div className="glass-panel p-12 md:p-20 rounded-[4rem] text-center space-y-8 relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-blue-600/5 opacity-50" />
               <div className="relative space-y-8">
                  <div className="w-20 h-20 bg-violet-600/10 rounded-[2rem] flex items-center justify-center mx-auto border border-violet-500/20">
                    <Puzzle className="w-10 h-10 text-violet-500" />
                  </div>
                  <div className="space-y-4 max-w-lg mx-auto">
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Merchant SDK</h3>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest leading-relaxed">
                      API Keys, Webhooks, and direct protocol integration for custom platforms.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                     <LockIcon className="w-4 h-4 text-gray-700" />
                     <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest italic">Encrypted Pipeline Alpha v0.1</span>
                  </div>
                  <div className="pt-6">
                    <button className="px-10 py-4 bg-gray-900 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl border border-white/5 cursor-not-allowed">
                       Coming to Arc Mainnet
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-20 text-center space-y-4 opacity-30">
         <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-white/10 w-12" />
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">UniPay Merchant Core</span>
            <div className="h-px bg-white/10 w-12" />
         </div>
      </div>
    </div>
  );
}

// Komponen Wrapper Suspense Utama
export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
