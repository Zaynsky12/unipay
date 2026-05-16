"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  ShieldCheck, 
  Loader2, 
  ArrowRight, 
  Building2, 
  Globe, 
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

export default function VerifyPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [merchantName, setMerchantName] = useState('');
  const [merchantMetadata, setMerchantMetadata] = useState('');

  // Check registration status
  const { data: merchantData, refetch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegistered = merchantData ? (merchantData as any)[2] && merchantData[0] !== 'Anonymous' : false;

  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetch();
      // Redirect to dashboard after 2 seconds
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  }, [isSuccess, refetch, router]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName) return;
    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerMerchant',
      args: [merchantName, merchantMetadata || 'Verified Merchant'],
    });
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center space-y-8 animate-fade-in">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tight">Verification Successful!</h1>
          <p className="text-gray-400">Your merchant identity is now secured on the Arc Network. Redirecting you to the command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* LEFT: INFO & BENEFITS */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20">
            <ShieldCheck className="w-4 h-4 text-violet-500" />
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Merchant Onboarding</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Claim Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-500">Business Identity</span>
          </h1>
          
          <p className="text-gray-400 text-lg leading-relaxed">
            Register your merchant profile to build trust with your customers. Verified merchants receive customized checkout pages and enhanced transaction visibility.
          </p>

          <div className="space-y-4 pt-4">
            {[
              { icon: Zap, text: 'Custom Brand Name on Checkout' },
              { icon: Globe, text: 'Fully On-chain Reputation' },
              { icon: CheckCircle2, text: 'Access to AI Sales Insights' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                  <item.icon className="w-5 h-5 text-violet-500" />
                </div>
                <span className="text-sm font-bold text-gray-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: REGISTRATION FORM */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#0B0B12] border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl">
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Brand Name</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    placeholder="e.g. Satoshi Coffee"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-sm font-bold focus:border-violet-500 outline-none transition-all placeholder:text-gray-700"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Business Slogan / Info</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text"
                    value={merchantMetadata}
                    onChange={(e) => setMerchantMetadata(e.target.value)}
                    placeholder="e.g. Best beans in Arc Network"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs font-medium focus:border-violet-500 outline-none transition-all placeholder:text-gray-700"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {error.message.includes('Brand name cannot be empty') ? 'Brand name is required' : 'Registration Failed'}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending || isTxConfirming || !merchantName}
                className="w-full py-5 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-violet-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending || isTxConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying on Arc...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Activate Merchant ID</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            <p className="text-[9px] text-gray-600 text-center mt-6 uppercase tracking-widest leading-relaxed">
              By registering, you establish a decentralized identity on the Arc Network. All profile data is stored on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
