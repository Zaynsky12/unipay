"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { 
  UserCheck, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Wallet,
  Globe,
  Edit3,
  Layers,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

export default function AccountPage() {
  const { address, isConnected } = useAccount();
  const [merchantName, setMerchantName] = useState('');
  const [merchantMetadata, setMerchantMetadata] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Baca status verifikasi merchant onchain
  const { data: merchantData, isLoading: isLoadingRead, refetch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegistered = merchantData ? merchantData[2] : false;
  const currentName = merchantData?.[0] || '';
  const currentMetadata = merchantData?.[1] || '';

  // Inisialisasi nilai form saat identitas onchain terdeteksi
  useEffect(() => {
    if (currentName && !isEditing) {
      setMerchantName(currentName);
      setMerchantMetadata(currentMetadata);
    }
  }, [currentName, currentMetadata, isEditing]);

  // Setup fungsi pemanggilan kontrak registrasi/pembaruan
  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetch();
      setIsEditing(false);
    }
  }, [isSuccess, refetch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !merchantName) return;

    writeContract({
      address: UNIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'registerMerchant',
      args: [merchantName, merchantMetadata || 'UniPay Premium Gateways'],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 relative">
        <div className="absolute w-[350px] h-[350px] bg-gradient-to-br from-violet-600/10 via-indigo-600/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-20 h-20 rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center mb-6 text-violet-400 relative shadow-[0_0_50px_rgba(124,58,237,0.15)] group backdrop-blur-xl animate-float">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Lock className="w-8 h-8 text-violet-400/80 relative z-10" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Identity Vault Locked</h1>
        <p className="text-gray-400 max-w-md text-xs sm:text-sm leading-relaxed mb-8">
          Please link your Web3 cryptographic identifier to load your profile state and set up trustless, permanent storefront access on the Arc Network.
        </p>

        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-violet-300 font-bold backdrop-blur-md shadow-inner">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span>Connect via the purple wallet button in the upper right</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Banner Premium / Status Puncak ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F0C1B] via-[#0A0A0F] to-black border border-white/5 p-6 sm:p-10 shadow-[0_0_50px_rgba(124,58,237,0.05)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                Onchain Namespace
              </span>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Contract Intercepted
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Sovereign Account Matrix
            </h1>
            
            <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
              Define your unified commercial alias and technical specifications on the Arc Network L1. Verified properties bypass address-preview warnings during customer checkouts.
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
            {isLoadingRead ? (
              <div className="h-10 w-36 bg-white/5 rounded-2xl animate-pulse" />
            ) : isRegistered ? (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Sovereign Verified</span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono pr-1">Immutably Bonded</span>
              </div>
            ) : (
              <div className="flex flex-col items-start sm:items-end gap-1">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs backdrop-blur-md">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Unverified Identity</span>
                </div>
                <span className="text-[9px] text-amber-500/70 font-mono pr-1">Action Needed Below</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Alamat Kredensial Langsung di dalam Banner */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs relative z-10">
          <div className="flex items-center gap-2 text-gray-400">
            <Wallet className="w-3.5 h-3.5 text-violet-400/80 shrink-0" />
            <span className="text-gray-500 font-medium">Owner Hash:</span>
            <code className="text-violet-200 font-mono bg-white/[0.02] px-2 py-0.5 rounded border border-white/5 text-[11px] select-all">
              {address}
            </code>
          </div>
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5 font-mono">
            <span>Protocol Target:</span>
            <span className="text-gray-400 font-semibold">UniPayRegistry.sol</span>
          </div>
        </div>
      </div>

      {/* ── State 1: Belum Terverifikasi (Tampilkan Layout Onboarding Premium 2 Kolom) ── */}
      {!isLoadingRead && !isRegistered && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          
          {/* Kolom Kiri: Form Interaktif Megah (7 Kolom) */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-3 mb-6 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black text-violet-400 uppercase tracking-wider block">Step 1: Sovereignty Claim</span>
                <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                  Register Enterprise Profile
                </h3>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Establish an immutable string map referencing your business setup. Zero platforms fee or recurring gas subscription controllers.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div>
                <label className="block text-xs font-black text-violet-300 mb-1.5 uppercase tracking-wider flex items-center justify-between">
                  <span>Merchant Alias Name *</span>
                  <span className="text-[9px] font-normal text-violet-400/70 lowercase">will display on receipt links</span>
                </label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Sovereign Crypto Gateways"
                  className="input-field p-3.5 text-sm font-bold bg-black/50 border-white/10 text-white placeholder:text-gray-600 focus:border-violet-500 rounded-xl w-full transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 mb-1.5 uppercase tracking-wider">
                  Storefront Spec Description / Slogan
                </label>
                <input
                  type="text"
                  value={merchantMetadata}
                  onChange={(e) => setMerchantMetadata(e.target.value)}
                  placeholder="e.g. Fully Automated Multi-chain Settlement APIs"
                  className="input-field p-3.5 text-xs font-medium bg-black/50 border-white/10 text-gray-300 placeholder:text-gray-600 rounded-xl w-full transition-all"
                />
              </div>

              {writeError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{writeError.message || 'Signature handshake voided by wallet interface.'}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending || isTxConfirming || !merchantName}
                  className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all transform hover:-translate-y-0.5"
                >
                  {isPending || isTxConfirming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isTxConfirming ? 'Awaiting Arc Testnet Validation...' : 'Authorize Signature Transaction...'}</span>
                    </>
                  ) : (
                    <>
                      <span>Engage Protocol Onchain</span>
                      <ArrowUpRight className="w-4 h-4 text-violet-200" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-500 mt-2.5">
                  Secured natively via <code className="text-violet-400/80 font-mono">registerMerchant()</code> execution
                </p>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Live Preview Visualisasi Wibawa (5 Kolom) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> Live Customer Verification Card
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-violet-500/20 bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.03)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-indigo-500" />
              
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 font-bold text-xs">
                    {merchantName ? merchantName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white truncate leading-tight">
                      {merchantName || 'Your Premium Gateways'}
                    </p>
                    <p className="text-[9px] text-violet-400 font-mono flex items-center gap-1 mt-0.5 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Immutably Verified
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-white/[0.02] text-gray-400 px-2 py-1 rounded font-mono border border-white/5">
                  ArcScan L1
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-center">
                  <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Simulated Checkout Display</p>
                  <p className="text-xl font-black text-white tracking-tight mt-1">
                    $10.00 <span className="text-xs font-bold text-violet-400">USDC</span>
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium italic mt-1 truncate">
                    "{merchantMetadata || 'Standard decentralized software logic'}"
                  </p>
                </div>

                <div className="space-y-1.5 text-[10px] text-gray-400 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.01] border border-white/5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant bypass of untrusted routing alerts</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.01] border border-white/5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Permanent mapping inside Goldsky Subgraph</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-violet-500/[0.02] border border-violet-500/10 text-[11px] text-violet-300/80 leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>Once claimed, you can fully generate auto-synchronized recurring subscription smart links from the secondary creation tab.</span>
            </div>
          </div>

        </div>
      )}

      {/* ── State 2: Sudah Terverifikasi (Tampilkan Panel Perwalian Megah & Mode Edit) ── */}
      {isRegistered && (
        <div className="glass-panel p-6 sm:p-8 space-y-6 relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                {currentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-white tracking-tight">{currentName}</h3>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Active Onchain
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5 font-medium">{currentMetadata || 'Standard Enterprise Gateway Setup'}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsEditing(!isEditing);
                setMerchantName(currentName);
                setMerchantMetadata(currentMetadata);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto ${
                isEditing 
                  ? 'bg-white/10 border-white/10 text-white' 
                  : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/5 text-violet-300 hover:border-violet-500/30'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Close Edit Form' : 'Update Namespace Data'}</span>
            </button>
          </div>

          {/* Opsi Edit Terbuka */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2 p-5 rounded-2xl bg-black/40 border border-white/5 animate-fade-in">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-medium leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>Modifying your metadata attributes requires processing a state assignment block on the Arc L1 Smart Registry.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">Updated Store Alias Name</label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="input-field p-3 text-xs font-bold bg-black border-white/10 text-white rounded-xl w-full focus:border-violet-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5">Updated Store Slogan</label>
                  <input
                    type="text"
                    value={merchantMetadata}
                    onChange={(e) => setMerchantMetadata(e.target.value)}
                    className="input-field p-3 text-xs bg-black border-white/10 text-gray-300 rounded-xl w-full focus:border-violet-500"
                  />
                </div>
              </div>

              {writeError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                  {writeError.message || 'Transaction modification rejected.'}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isPending || isTxConfirming || !merchantName}
                  className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl flex items-center gap-2 shadow-md"
                >
                  {isPending || isTxConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isTxConfirming ? 'Broadcasting Update...' : 'Commit Revision Immutably'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Subgraph Access</span>
                <p className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Dynamic Index
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-xl" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Protocol Verification</span>
                <p className="font-bold text-violet-300 text-xs flex items-center gap-1.5 pt-0.5">
                  <Layers className="w-3.5 h-3.5 text-violet-400" /> Decentralized Native
                </p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl" />
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Meta-Transactions</span>
                <p className="font-bold text-blue-300 text-xs flex items-center gap-1.5 pt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Zero-Fee Intercept
                </p>
              </div>
            </div>
          )}

          <div className="pt-2 text-center border-t border-white/5">
            <a 
              href={`https://testnet.arcscan.app/address/${address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-bold transition-all bg-white/[0.02] hover:bg-white/[0.05] px-3 py-1.5 rounded-xl border border-white/5"
            >
              <span>Explore Verified Smart Contract Namespace on ArcScan</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

    </div>
  );
}
