"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Send, Unlock, CheckCircle2, Clock, Search, Filter, ChevronDown, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { cn } from '@/lib/utils';

type TxType = 'all' | 'shield' | 'send' | 'unshield';

const transactions = [
  {
    id: '0x1a2b',
    type: 'shield' as const,
    label: 'Shield',
    description: 'USDC → Morphic Vault',
    amount: '+500.00',
    token: 'USDC',
    status: 'confirmed',
    time: '2 min ago',
    date: 'Today',
    hash: '0x1a2b...c3d4',
    positive: true,
  },
  {
    id: '0x5e6f',
    type: 'send' as const,
    label: 'Private Send',
    description: 'To alice.arc',
    amount: '-120.00',
    token: 'USDC',
    status: 'confirmed',
    time: '1 hr ago',
    date: 'Today',
    hash: '0x5e6f...a7b8',
    positive: false,
  },
  {
    id: '0x9c0d',
    type: 'unshield' as const,
    label: 'Unshield',
    description: 'Morphic Vault → USDC',
    amount: '-200.00',
    token: 'USDC',
    status: 'confirmed',
    time: '3 hr ago',
    date: 'Today',
    hash: '0x9c0d...e1f2',
    positive: false,
  },
  {
    id: '0x3g4h',
    type: 'send' as const,
    label: 'Private Send',
    description: 'To bob.arc',
    amount: '-75.00',
    token: 'USDC',
    status: 'confirmed',
    time: 'Yesterday',
    date: 'Yesterday',
    hash: '0x3g4h...i5j6',
    positive: false,
  },
  {
    id: '0x7k8l',
    type: 'shield' as const,
    label: 'Shield',
    description: 'USDC → Morphic Vault',
    amount: '+1,000.00',
    token: 'USDC',
    status: 'confirmed',
    time: 'Yesterday',
    date: 'Yesterday',
    hash: '0x7k8l...m9n0',
    positive: true,
  },
  {
    id: '0xp1q2',
    type: 'send' as const,
    label: 'Private Send',
    description: 'To carol.arc',
    amount: '-300.00',
    token: 'USDC',
    status: 'pending',
    time: '2 days ago',
    date: '2 days ago',
    hash: '0xp1q2...r3s4',
    positive: false,
  },
];

const typeConfig = {
  shield: {
    icon: Shield,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    label: 'Shield',
  },
  send: {
    icon: Send,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'Send',
  },
  unshield: {
    icon: Unlock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    label: 'Unshield',
  },
};

const filters: { label: string; value: TxType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Shield', value: 'shield' },
  { label: 'Send', value: 'send' },
  { label: 'Unshield', value: 'unshield' },
];

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const [activeFilter, setActiveFilter] = useState<TxType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!address) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/transactions/history?address=${address}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.history)) {
          // Format data for UI
          const formatted = data.history.map((tx: any) => {
            const cleanAmount = tx.amount?.toString().split(' ')[0] || '0';
            const type = tx.type?.toLowerCase() || 'shield';
            
            return {
              id: tx.id,
              type: type,
              label: tx.type === 'SEND' ? 'Private Send' : tx.type?.charAt(0) + tx.type?.slice(1).toLowerCase(),
              description: tx.type === 'SHIELD' ? `${tx.token || 'USDC'} → Morphic Vault` : tx.type === 'UNSHIELD' ? `Morphic Vault → ${tx.token || 'USDC'}` : 'Private Transfer',
              amount: tx.type === 'SHIELD' ? `+${cleanAmount}` : `-${cleanAmount}`,
              token: tx.token || 'USDC',
              status: tx.status?.toLowerCase() || 'confirmed',
              time: tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown',
              date: tx.timestamp ? (new Date(tx.timestamp).toDateString() === new Date().toDateString() ? 'Today' : new Date(tx.timestamp).toLocaleDateString()) : 'Unknown',
              hash: tx.txHash || '0x...',
              positive: tx.type === 'SHIELD',
            };
          });
          setTxHistory(formatted);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [address]);

  const filtered = txHistory.filter((tx) => {
    const matchType = activeFilter === 'all' || tx.type === activeFilter;
    const matchSearch =
      !searchQuery ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchSearch;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 mt-6 pb-4 animate-fade-in-up">

      {/* Header */}
      <div className="px-1">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your private transaction record</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by address or hash..."
          className="w-full bg-white/5 border border-white/8 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 focus:bg-white/8 transition-all"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500 shrink-0" />
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                activeFilter === f.value
                  ? "bg-violet-600 text-white"
                  : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/8 border border-white/5"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <div className="glass-panel p-10 text-center flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mb-2" />
          <p className="text-gray-400 font-medium">Fetching history...</p>
        </div>
      ) : !isConnected ? (
        <div className="glass-panel p-10 text-center">
          <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">Wallet Not Connected</p>
          <p className="text-gray-600 text-sm mt-1">Connect your wallet to see your private history</p>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-gray-500" />
          </div>
          <p className="text-gray-400 font-semibold">No transactions found</p>
          <p className="text-gray-600 text-sm mt-1">Transactions recorded on this device will appear here</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">{date}</p>
            <div className="glass-panel overflow-hidden" style={{ borderRadius: '20px' }}>
              {txs.map((tx, i) => {
                const cfg = typeConfig[tx.type as keyof typeof typeConfig];
                const Icon = cfg.icon;
                const isExpanded = expandedTx === tx.id;

                return (
                  <div key={tx.id}>
                    <button
                      onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/3 transition-colors text-left",
                        i < txs.length - 1 && !isExpanded && "border-b border-white/5"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border", cfg.bg, cfg.border)}>
                        <Icon className={cn("w-4 h-4", cfg.color)} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">{tx.label}</p>
                          {tx.status === 'confirmed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{tx.description}</p>
                      </div>

                      {/* Amount + chevron */}
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className={cn("text-sm font-bold", tx.positive ? "text-emerald-400" : "text-white")}>
                            {tx.amount}
                          </p>
                          <p className="text-[10px] text-gray-500">{tx.token}</p>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isExpanded && "rotate-180")} />
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className={cn(
                        "px-4 pb-4 border-t border-white/5",
                        i < txs.length - 1 && "border-b border-white/5"
                      )}>
                        <div className="mt-3 rounded-2xl bg-black/30 border border-white/5 p-3 space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Status</span>
                            <span className={cn("text-xs font-semibold capitalize", tx.status === 'confirmed' ? 'text-emerald-400' : 'text-yellow-400')}>
                              {tx.status}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Time</span>
                            <span className="text-xs text-gray-300 font-medium">{tx.time}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 shrink-0">Tx Hash</span>
                            <span className="text-xs font-mono text-violet-400 truncate">{tx.hash}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Privacy</span>
                            <span className="text-xs text-violet-300 font-semibold flex items-center gap-1">
                              <Shield className="w-3 h-3" /> ZK Shielded
                            </span>
                          </div>
                        </div>
                        <a
                          href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-violet-400 transition-colors w-full py-2"
                        >
                          View on Arc Explorer <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Privacy Note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15 mt-1">
        <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-200/70 leading-relaxed">
          Transaction details are encrypted on-chain. Only you can see this history using your connected wallet.
        </p>
      </div>
    </div>
  );
}
