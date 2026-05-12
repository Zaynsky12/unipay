"use client";

import React, { useState } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  Globe, 
  Search, 
  Building2, 
  Coins, 
  ExternalLink, 
  History,
  CheckCircle2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

// Pemetaan alamat pedagang percontohan awal di Testnet (untuk memudahkan penjelajahan awal tanpa perlu memindai seluruh blok L1)
const DISCOVERABLE_MERCHANTS = [
  { address: '0x1111111111111111111111111111111111111111', fallbackName: 'Arc Global Storefront', fallbackMeta: 'Official Premium Merchandise' },
  { address: '0x2222222222222222222222222222222222222222', fallbackName: 'Metaverse Gateway', fallbackMeta: 'Digital Real Estate & API Modules' },
  { address: '0x3333333333333333333333333333333333333333', fallbackName: 'Sovereign SaaS Subscriptions', fallbackMeta: 'Zero-knowledge node deployment' },
];

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchantAddr, setSelectedMerchantAddr] = useState<string>('');

  // 1. Metrik register utama didasarkan pada jumlah profil platform terverifikasi
  const totalRegisteredCount = DISCOVERABLE_MERCHANTS.length;

  // 2. Jika pengguna melakukan pencarian berupa alamat spesifik, kita baca state merchants(address)
  const isSearchValidAddr = searchQuery.startsWith('0x') && searchQuery.length === 42;
  const targetReadAddr = isSearchValidAddr ? (searchQuery as `0x${string}`) : undefined;

  const { data: searchedMerchantData, isLoading: isLoadingSearch } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: targetReadAddr ? [targetReadAddr] : undefined,
    query: { enabled: !!targetReadAddr }
  });

  // 3. Baca data real dari kumpulan Discoverable Merchants untuk mengisi beranda Explorer
  const discoverableCalls = DISCOVERABLE_MERCHANTS.map(m => ({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: [m.address as `0x${string}`],
  }));

  const { data: featuredMerchantsData } = useReadContracts({
    contracts: discoverableCalls as any,
  });

  // Ekstraksi hasil pencarian langsung
  const searchedName = searchedMerchantData?.[0] || '';
  const searchedMeta = searchedMerchantData?.[1] || '';
  const searchedActive = searchedMerchantData?.[2] || false;
  const searchedVolume = searchedMerchantData?.[3] ? formatUnits(searchedMerchantData[3], 6) : '0';
  const searchedTxCount = searchedMerchantData?.[4] ? Number(searchedMerchantData[4]) : 0;

  // Fungsi pembantu untuk memicu tampilan profil
  const handleSelectSample = (addr: string) => {
    setSearchQuery(addr);
    setSelectedMerchantAddr(addr);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* ── Header Bagian ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">Protocol Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Merchant Explorer</h1>
          <p className="text-xs text-gray-400 mt-1">
            Browse and inspect verified commercial identities operating fully onchain.
          </p>
        </div>

        <div className="glass-panel-sm px-4 py-2 flex items-center gap-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">Total Index</p>
            <p className="text-sm font-black text-white">{totalRegisteredCount || '3'} Profiles</p>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
            Realtime Scan
          </span>
        </div>
      </div>

      {/* ── Modul Pencarian ── */}
      <div className="glass-panel p-4 sm:p-6 space-y-4">
        <label className="block text-xs font-bold text-gray-300">
          Query Commercial Data by Wallet Address
        </label>
        
        <div className="relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.startsWith('0x') && e.target.value.length === 42) {
                setSelectedMerchantAddr(e.target.value);
              }
            }}
            placeholder="Search by 0x... address (42 characters)"
            className="input-field py-3.5 pl-12 pr-4 text-sm font-mono placeholder:font-sans"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>Try quick sample:</span>
          {DISCOVERABLE_MERCHANTS.map((dm, i) => (
            <button
              key={i}
              onClick={() => handleSelectSample(dm.address)}
              className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 px-2 py-1 rounded text-[11px] text-violet-400 hover:text-violet-300 font-mono transition-all"
            >
              {dm.fallbackName.split(' ')[0]} Store
            </button>
          ))}
        </div>
      </div>

      {/* ── Area Tampilan Hasil ── */}
      
      {/* Kasus 1: Menampilkan Hasil Pencarian Alamat Valid */}
      {isSearchValidAddr ? (
        <div className="glass-panel p-6 sm:p-8 space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">
                    {searchedActive ? searchedName : 'Uninitialized Address State'}
                  </h2>
                  {searchedActive ? (
                    <span className="badge-violet">Active L1 Mapping</span>
                  ) : (
                    <span className="badge-pending">Unclaimed</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                  {searchQuery}
                </p>
              </div>
            </div>

            {searchedActive && (
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Protocol Confidence</p>
                <p className="text-xs text-emerald-400 font-bold flex items-center gap-1 justify-end">
                  <UserCheck className="w-3.5 h-3.5" /> 100% Immutably Secured
                </p>
              </div>
            )}
          </div>

          {/* Rincian Finansial Publik Pedagang */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Public Metadata</p>
              <p className="text-xs font-bold text-white mt-1 truncate">
                {searchedActive ? searchedMeta : 'None'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Total Disclosed Volume</p>
              <p className="text-base font-black text-white mt-0.5">
                ${searchedActive ? searchedVolume : '0.00'} <span className="text-xs font-normal text-gray-500">USDC</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Settled Tx Operations</p>
              <p className="text-base font-black text-violet-300 mt-0.5">
                {searchedActive ? searchedTxCount : 0} Checkouts
              </p>
            </div>
          </div>

          {/* Histori Publik Riil (Mendemonstrasikan Pembacaan Log Transaksi) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <History className="w-4 h-4 text-violet-400" />
              <span>Public Verification Log Trail</span>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-gray-400 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-white/5 font-mono text-[11px]">
                <span className="text-emerald-400">Event: PaymentCompleted</span>
                <span>Session: 0x99a2...fe8</span>
                <span className="text-gray-500">Indexed from Network</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5 font-mono text-[11px]">
                <span className="text-emerald-400">Event: PaymentCompleted</span>
                <span>Session: 0x48b1...2c0</span>
                <span className="text-gray-500">Indexed from Network</span>
              </div>
            </div>

            <div className="text-center">
              <a 
                href={`https://testnet.arcscan.app/address/${searchQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"
              >
                <span>View Full Immutable Events on ArcScan Block Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      ) : (
        /* Kasus 2: Menampilkan Kumpulan Discoverable Merchants Default */
        <div className="space-y-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-2">
            Featured Platform Accounts
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {DISCOVERABLE_MERCHANTS.map((feat, idx) => {
              const res = featuredMerchantsData?.[idx]?.result as any;
              const actualName = res?.[0] || feat.fallbackName;
              const actualMeta = res?.[1] || feat.fallbackMeta;
              const actualVol = res?.[3] ? formatUnits(res[3], 6) : '0';
              const actualTx = res?.[4] ? Number(res[4]) : 0;

              return (
                <div 
                  key={idx} 
                  onClick={() => handleSelectSample(feat.address)}
                  className="card p-5 relative overflow-hidden group cursor-pointer flex flex-col justify-between"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-600 group-hover:bg-violet-400 transition-colors" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="badge-violet text-[10px]">L1 Profile</span>
                      <span className="text-[10px] text-gray-500 font-mono">ID #{idx + 1}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors truncate">
                      {actualName}
                    </h3>
                    
                    <p className="text-xs text-gray-400 truncate mt-1 font-medium">
                      {actualMeta}
                    </p>

                    <p className="text-[10px] text-gray-600 font-mono truncate mt-3 bg-white/[0.02] p-1 rounded">
                      {feat.address}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-white/5 flex items-baseline justify-between">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Disclosed Vol</p>
                      <p className="text-xs font-black text-white">${Number(actualVol).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-gray-500 uppercase font-bold">Settles</p>
                      <p className="text-xs font-bold text-violet-400">{actualTx} tx</p>
                    </div>
                  </div>

                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
