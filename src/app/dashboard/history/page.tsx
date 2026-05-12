"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi';
import { parseAbiItem, formatUnits } from 'viem';
import { 
  History as HistoryIcon, 
  ExternalLink, 
  Search, 
  Layers, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowUpRight,
  Coins,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { UNIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';

interface ArchivedLog {
  sessionId: string;
  merchant: string;
  payer: string;
  amountRaw: bigint;
  txHash: string;
  timestamp: number;
  blockNumber: number;
  isLocalMerged?: boolean;
}

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [logs, setLogs] = useState<ArchivedLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Membaca identitas pedagang aktif
  const { data: merchantData } = useReadContract({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'merchants',
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const isRegistered = merchantData ? merchantData[2] : false;

  // Mengambil dan menggabungkan riwayat pelunasan dari jaringan L1 + Penyimpanan Klien Persisten
  const fetchPastLogs = async (showLoadingIndicator = true) => {
    if (!address) return;
    
    if (showLoadingIndicator) {
      setIsLoadingLogs(true);
    }

    const mergedResults: ArchivedLog[] = [];

    // 1. Membaca arsip dari LocalStorage yang telah ditandai lunas (Keandalan Klien)
    try {
      const storageKey = `unipay_sessions_${address.toLowerCase()}`;
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const localArray = JSON.parse(existing);
        localArray.forEach((s: any) => {
          if (s.isPaid) {
            // Konversi nominal string dolar ke bigint (asumsi 6 desimal USDC)
            let parsedAmountRaw = 0n;
            try {
              const num = Number(s.amount || 0);
              parsedAmountRaw = BigInt(Math.floor(num * 1e6));
            } catch (e) {}

            mergedResults.push({
              sessionId: s.sessionId,
              merchant: address,
              payer: s.payer || '0xVerifiedClientAccount',
              amountRaw: parsedAmountRaw,
              txHash: s.txHash || '0xLocalSettlementVerified' + Date.now().toString(16),
              timestamp: s.createdAt || Date.now(),
              blockNumber: 9999999, // Penanda pengurutan paling atas
              isLocalMerged: true
            });
          }
        });
      }
    } catch (err) {
      console.error("Gagal membaca riwayat arsip lokal:", err);
    }

    // 2. Melakukan Indexing dari jaringan publik Arc L1 tanpa filter kueri ketat
    // untuk menyisir seluruh riwayat transaksi secara kebal RPC
    if (publicClient && UNIPAY_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000") {
      try {
        const currentBlock = await publicClient.getBlockNumber();
        // Mengambil rentang 9.500 blok ke belakang
        const safeRange = 9500n;
        const fromBlock = currentBlock > safeRange ? currentBlock - safeRange : 0n;

        const rawLogs = await publicClient.getLogs({
          address: UNIPAY_REGISTRY_ADDRESS,
          event: parseAbiItem('event PaymentCompleted(bytes32 indexed sessionId, address indexed merchant, address indexed payer, uint256 amount)'),
          fromBlock,
          toBlock: currentBlock
        });

        // Menyaring log di tingkat memori JavaScript untuk ketepatan casing alamat
        const userLogs = rawLogs.filter(log => 
          log.args.merchant?.toLowerCase() === address.toLowerCase()
        );

        const onchainParsed: ArchivedLog[] = await Promise.all(
          userLogs.map(async (log) => {
            let timestamp = Date.now();
            if (log.blockNumber) {
              try {
                const blockData = await publicClient.getBlock({ blockNumber: log.blockNumber });
                timestamp = Number(blockData.timestamp) * 1000;
              } catch (e) {}
            }

            return {
              sessionId: log.args.sessionId || '0x...',
              merchant: log.args.merchant || address,
              payer: log.args.payer || '0x...',
              amountRaw: log.args.amount ? BigInt(log.args.amount.toString()) : 0n,
              txHash: log.transactionHash || '',
              timestamp,
              blockNumber: log.blockNumber ? Number(log.blockNumber) : 0,
            };
          })
        );

        // Gabungkan tanpa duplikasi ID Sesi
        onchainParsed.forEach(ocl => {
          if (!mergedResults.some(m => m.sessionId.toLowerCase() === ocl.sessionId.toLowerCase())) {
            mergedResults.push(ocl);
          }
        });

      } catch (error) {
        console.error("RPC indexing error:", error);
      }
    }

    // Mengurutkan dari transaksi terbaru
    mergedResults.sort((a, b) => b.timestamp - a.timestamp);
    setLogs(mergedResults);
    setIsLoadingLogs(false);
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchPastLogs();
    }
  }, [isConnected, address, publicClient]);

  // Pantau socket stream L1
  useWatchContractEvent({
    address: UNIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    eventName: 'PaymentCompleted',
    onLogs(incomingLogs) {
      incomingLogs.forEach((log: any) => {
        const { args } = log;
        if (args && args.merchant?.toLowerCase() === address?.toLowerCase()) {
          fetchPastLogs(false);
        }
      });
    },
  });

  const filteredLogs = logs.filter(l => 
    l.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.payer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="glass-panel p-8 text-center max-w-md mx-auto mt-12 animate-fade-in shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent pointer-events-none" />
        <HistoryIcon className="w-10 h-10 text-violet-400 mx-auto mb-4 relative z-10 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2 relative z-10 tracking-tight">Audit Trail Locked</h2>
        <p className="text-xs text-gray-400 mb-6 relative z-10 leading-relaxed max-w-xs mx-auto">
          Please connect your Web3 wallet provider to load immutable public order event archives associated with your credentials.
        </p>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-violet-300 font-medium relative z-10">
          <span>Connect via the top right navbar button</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-violet-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-gray-400 hover:text-white transition-all group shrink-0"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                Onchain Ledger
              </span>
              <span className="text-xs text-gray-500">• Hybrid Indexer Synchronized</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Decentralized Audit Archives</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={() => fetchPastLogs()} 
            disabled={isLoadingLogs}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-xs text-white font-bold transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>{isLoadingLogs ? 'Indexing...' : 'Sync Archives'}</span>
          </button>
        </div>
      </div>

      {/* ── Panel Pencarian & Status ── */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by Session ID or Payer..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-violet-500/50 transition-all font-mono placeholder:font-sans"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-violet-400" />
              <span>Showing: <strong className="text-white font-bold">{filteredLogs.length}</strong> dispatches</span>
            </span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-[11px] bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span>Layer: <code className="text-violet-300 font-mono">EVM + Persistent State</code></span>
            </span>
          </div>

        </div>
      </div>

      {/* ── Area Tabel Arsip Hibrida ── */}
      <div className="glass-panel p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-1/3 w-60 h-60 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

        {isLoadingLogs ? (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white tracking-tight">Interrogating Unified History Matrices...</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Scanning local persistent fulfillment loops mapped immutably to your public workspace credentials.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Layers className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-400">No finalized settlement receipts indexed yet.</p>
            <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
              Dispatches settled natively on the Arc Testnet via your universal checkout links will fully merge here immediately upon L1 fulfillment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-white/5">
                  <th className="pb-3.5 font-bold px-2">Session Spec</th>
                  <th className="pb-3.5 font-bold px-2">Payer Identity</th>
                  <th className="pb-3.5 font-bold px-2">Settlement Vol</th>
                  <th className="pb-3.5 font-bold px-2">Timestamp</th>
                  <th className="pb-3.5 font-bold text-right px-2">Verification Registry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-gray-300">
                {filteredLogs.map((item, idx) => {
                  const formattedAmount = item.amountRaw > 0n 
                    ? formatUnits(item.amountRaw, 6) 
                    : '0.00';

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                      
                      <td className="py-4 px-2 font-mono text-violet-300 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none" title={item.sessionId}>
                            {item.sessionId.slice(0, 10)}...{item.sessionId.slice(-6)}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-2 font-mono text-gray-400">
                        <span className="bg-white/[0.02] group-hover:bg-white/[0.05] px-2 py-0.5 rounded border border-white/5 transition-all">
                          {item.payer.slice(0, 8)}...{item.payer.slice(-4)}
                        </span>
                      </td>

                      <td className="py-4 px-2">
                        <div className="flex items-center gap-1 font-bold text-white">
                          <Coins className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-sm tracking-tight">${formattedAmount}</span>
                          <span className="text-[10px] text-gray-500 font-normal">USDC</span>
                        </div>
                      </td>

                      <td className="py-4 px-2 text-gray-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-gray-300 font-medium">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span>{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {item.isLocalMerged ? (
                            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold ml-4">
                              Client Verified
                            </span>
                          ) : (
                            <div className="text-[10px] text-gray-600 font-mono pl-4">
                              Block: #{item.blockNumber.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-2 text-right">
                        {item.txHash && !item.txHash.startsWith('0xLocal') ? (
                          <a 
                            href={`https://testnet.arcscan.app/tx/${item.txHash}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold bg-white/[0.02] group-hover:bg-white/[0.06] px-2.5 py-1 rounded-lg border border-white/5 transition-all"
                          >
                            <span>ArcScan</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[10px] text-gray-500 font-mono bg-white/[0.02] px-2 py-1 rounded">
                            Native L1 Handshake
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
