"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  Building2, 
  Loader2, 
  AlertCircle,
  Globe,
  BadgeCheck,
  Wallet,
  ArrowRight,
  User,
  Shield,
  Activity,
  ChevronRight
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'merchant' | 'account'>('merchant');
  
  // Merchant State
  const [merchantName, setMerchantName] = useState('');
  const [merchantMetadata, setMerchantMetadata] = useState('');

  // Read merchant status
  const { data: merchantData, isLoading: isLoadingRead, refetch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegistered = merchantData ? (merchantData as any)[2] : false;
  const currentName = isRegistered ? ((merchantData as any)?.[0] as string || '') : '';
  const currentMetadata = isRegistered ? ((merchantData as any)?.[1] as string || '') : '';
  const totalReceived = merchantData ? (merchantData as any)[3] : 0n;
  const totalTx = merchantData ? (merchantData as any)[4] : 0n;

  useEffect(() => {
    if (isRegistered) {
      setMerchantName(currentName);
      setMerchantMetadata(currentMetadata);
    }
  }, [isRegistered, currentName, currentMetadata]);

  // Write contract
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) refetch();
  }, [isSuccess, refetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !merchantName) return;
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerMerchant',
      args: [merchantName, merchantMetadata || 'Verified Merchant'],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
          <Wallet className="w-8 h-8 text-gray-500" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Connect Wallet</h1>
        <p className="text-gray-400 text-xs max-w-[240px]">Please link your wallet to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-20">
      
      {/* Page Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight">Settings</h1>
          <p className="text-gray-500 text-xs">Manage your identity and account preferences.</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-white/[0.03] border border-white/5 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('merchant')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'merchant' 
              ? 'bg-violet-600 text-white shadow-lg' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Merchant Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'account' 
              ? 'bg-violet-600 text-white shadow-lg' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account Profile</span>
        </button>
      </div>

      {activeTab === 'merchant' ? (
        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
          {/* Status Card */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${isRegistered ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {isRegistered ? <BadgeCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Identity Status</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">
                  {isRegistered ? 'Verified On-Chain' : 'Unregistered Node'}
                </p>
              </div>
            </div>
            {isRegistered && (
              <div className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-gray-400 font-mono">
                {address?.slice(0,6)}...{address?.slice(-4)}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-2xl space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Merchant Name</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Tagline</label>
                <div className="relative group">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
                  <input
                    type="text"
                    value={merchantMetadata}
                    onChange={(e) => setMerchantMetadata(e.target.value)}
                    placeholder="Short description"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-xs font-medium focus:border-violet-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || isTxConfirming || !merchantName}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-gray-600 text-white text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 shadow-lg shadow-violet-600/10"
              >
                {isPending || isTxConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>{isRegistered ? 'Update Profile' : 'Register Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          {/* Account Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-1">
              <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-400 mb-2">
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Sales</p>
              <h4 className="text-xl font-black text-white">${formatUnits(totalReceived, 6)}</h4>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 space-y-1">
              <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-400 mb-2">
                <Shield className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Transactions</p>
              <h4 className="text-xl font-black text-white">{totalTx.toString()}</h4>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-white/5 bg-white/[0.01]">
              <h3 className="text-sm font-bold text-white">Wallet Connection</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{address}</p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tighter">Active Network: Arc Testnet</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-gray-500 font-medium">Currency Display</span>
                  <span className="text-white font-bold">USD (Stablecoins)</span>
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-gray-500 font-medium">Auto-Refresh History</span>
                  <span className="text-emerald-500 font-bold">Enabled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4">
            <button className="w-full py-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all">
              Sign Out from Device
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
