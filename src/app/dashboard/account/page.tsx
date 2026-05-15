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
  Shield,
  Activity
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { formatUnits } from 'viem';

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  
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
        <p className="text-gray-400 text-xs max-w-[240px]">Please link your wallet to view your account.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10 animate-fade-in pb-24">
      
      {/* ── SECTION 1: MERCHANT IDENTITY (THE CORE) ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-400" />
            Merchant Profile
          </h2>
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
            isRegistered ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isRegistered ? 'Verified' : 'Unregistered'}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.03] to-transparent pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Store Name</label>
              <div className="relative group/input">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within/input:text-violet-500 transition-colors" />
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="Enter your business name"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Business Description</label>
              <div className="relative group/input">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within/input:text-violet-500 transition-colors" />
                <input
                  type="text"
                  value={merchantMetadata}
                  onChange={(e) => setMerchantMetadata(e.target.value)}
                  placeholder="e.g. Premium Digital Services"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-medium focus:border-violet-500 outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isTxConfirming || !merchantName}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-white/5 disabled:text-gray-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-violet-600/20"
            >
              {isPending || isTxConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegistered ? 'Update Identity' : 'Register Profile'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* ── SECTION 2: PERFORMANCE & WALLET ── */}
      <section className="space-y-6">
        <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Account Metrics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10">Total Volume</p>
            <h4 className="text-2xl font-black text-white relative z-10">${formatUnits(totalReceived, 6)}</h4>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest relative z-10">Total Sales</p>
            <h4 className="text-2xl font-black text-white relative z-10">{totalTx.toString()}</h4>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Connected Wallet</p>
              <p className="text-xs font-bold text-white truncate font-mono">{address}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-gray-500">Network</span>
            <span className="text-emerald-400">Arc Testnet (Live)</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="pt-6 border-t border-white/5 text-center">
        <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-medium">UniPay Protocol v1.0 — Arc Network</p>
      </footer>

    </div>
  );
}
