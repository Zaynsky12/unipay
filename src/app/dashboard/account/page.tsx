"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  Building2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  BadgeCheck,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

export default function AccountPage() {
  const { address, isConnected } = useAccount();
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
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6 sm:space-y-8 animate-fade-in pb-20">
      
      {/* Simple Clean Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">Profile</h1>
          <p className="text-gray-500 text-[11px] sm:text-xs mt-0.5 truncate">Configure your public identity.</p>
        </div>
        
        <div className="shrink-0">
          {isLoadingRead ? (
            <div className="h-6 w-20 bg-white/5 animate-pulse rounded-full" />
          ) : isRegistered ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-tight">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-black uppercase tracking-tight">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Unregistered</span>
            </div>
          )}
        </div>
      </div>

      {/* Modern Compact Form */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Merchant Name</label>
            <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-violet-500 transition-colors" />
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Business name"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm font-bold placeholder:text-gray-700 focus:border-violet-500 outline-none transition-all"
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
                placeholder="Description"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white text-xs font-medium placeholder:text-gray-700 focus:border-violet-500 outline-none transition-all"
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
                <span>{isRegistered ? 'Save Changes' : 'Register Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Minimalist Wallet Info at the bottom */}
      <div className="pt-4 text-center">
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mb-1">Identity Node</p>
        <div className="flex items-center justify-center">
          <code className="text-[10px] text-gray-500 font-mono bg-white/[0.02] px-3 py-1 rounded-full border border-white/5 max-w-[200px] truncate">
            {address}
          </code>
        </div>
      </div>

    </div>
  );
}
