"use client";

// Real-time balance integration for Morphic Privacy Platform

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useBalance, useReadContract, usePublicClient } from 'wagmi';
import { formatUnits, parseAbiItem } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, EURC_ADDRESS } from '@/lib/constants';
import {
  Shield, Send, Unlock, Eye, EyeOff, ArrowUpRight,
  ArrowDownRight, TrendingUp, Lock, Zap, ChevronRight, History, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickActions = [
  {
    label: 'Deposit',
    description: 'Deposit to vault',
    href: '/deposit',
    icon: Shield,
    color: 'from-violet-600 to-violet-800',
    glow: 'shadow-violet-500/25',
    bgHover: 'hover:border-violet-500/40',
  },
  {
    label: 'Send',
    description: 'Private transfer',
    href: '/send',
    icon: Send,
    color: 'from-blue-600 to-blue-800',
    glow: 'shadow-blue-500/25',
    bgHover: 'hover:border-blue-500/40',
  },
  {
    label: 'Withdraw',
    description: 'Withdraw funds',
    href: '/withdraw',
    icon: Unlock,
    color: 'from-emerald-600 to-emerald-800',
    glow: 'shadow-emerald-500/25',
    bgHover: 'hover:border-emerald-500/40',
  },
  {
    label: 'History',
    description: 'View activity',
    href: '/history',
    icon: History,
    color: 'from-gray-600 to-gray-800',
    glow: 'shadow-gray-500/25',
    bgHover: 'hover:border-gray-500/40',
  },
];

const typeConfig = {
  shield: {
    icon: Shield,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    label: 'Deposit',
  },
  send: {
    icon: Send,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    label: 'Private Send',
  },
  unshield: {
    icon: Unlock,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    label: 'Withdraw',
  },
};

export default function HomePage() {
  const { address, isConnected } = useAccount();
  const [showBalance, setShowBalance] = useState(true);
  const publicClient = usePublicClient();
  const [activities, setActivities] = useState<any[]>([]);
  const [isActivityLoading, setIsActivityLoading] = useState(true);

  // Fetch Public Balance (USDC in wallet)
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });

  // Fetch Shielded Balance from Smart Contract
  const { data: shieldedRaw, isLoading: isShieldedLoading } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balances',
    args: [address as `0x${string}`, USDC_ADDRESS as `0x${string}`],
    query: {
      enabled: !!address,
    }
  });

  // Fetch Recent Activity On-Chain
  useEffect(() => {
    const fetchOnChainRecent = async () => {
      if (!address || !publicClient) {
        setIsActivityLoading(false);
        return;
      }
      try {
        const shieldedEvent = parseAbiItem('event Shielded(address indexed user, address indexed token, uint256 amount, string privateAddress)');
        const unshieldedEvent = parseAbiItem('event Unshielded(address indexed user, address indexed token, uint256 amount)');
        const transferEvent = parseAbiItem('event PrivateTransfer(address indexed from, address indexed to, address indexed token, uint256 amount)');

        // Fetch logs for Shielded, Unshielded, and PrivateTransfer
        const [shieldedLogs, unshieldedLogs, sentLogs, receivedLogs] = await Promise.all([
          publicClient.getLogs({ address: VAULT_ADDRESS as `0x${string}`, event: shieldedEvent, args: { user: address as `0x${string}` }, fromBlock: 0n }),
          publicClient.getLogs({ address: VAULT_ADDRESS as `0x${string}`, event: unshieldedEvent, args: { user: address as `0x${string}` }, fromBlock: 0n }),
          publicClient.getLogs({ address: VAULT_ADDRESS as `0x${string}`, event: transferEvent, args: { from: address as `0x${string}` }, fromBlock: 0n }),
          publicClient.getLogs({ address: VAULT_ADDRESS as `0x${string}`, event: transferEvent, args: { to: address as `0x${string}` }, fromBlock: 0n }),
        ]);

        const allLogs = [...shieldedLogs, ...unshieldedLogs, ...sentLogs, ...receivedLogs];
        const uniqueLogs = allLogs.filter((log, index, self) =>
          index === self.findIndex((t) => t.transactionHash === log.transactionHash)
        );

        // Sort by block number descending and take top 3
        const recentLogs = uniqueLogs
          .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
          .slice(0, 3);

        const logsWithTime = await Promise.all(recentLogs.map(async (log) => {
          try {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });
            return { ...log, timestamp: Number(block.timestamp) * 1000 };
          } catch (e) {
            return { ...log, timestamp: Date.now() };
          }
        }));

        // Sort by timestamp descending
        logsWithTime.sort((a, b) => b.timestamp - a.timestamp);

        setActivities(logsWithTime);
      } catch (e) {
        console.error("Failed to fetch recent activity", e);
      } finally {
        setIsActivityLoading(false);
      }
    };
    fetchOnChainRecent();
  }, [address, publicClient]);

  const shieldedBalance = shieldedRaw ? formatUnits(shieldedRaw as bigint, 6) : '0.00';
  const publicBalance = balanceData ? formatUnits(balanceData.value, balanceData.decimals) : '0.00';
  const totalValue = (parseFloat(publicBalance) + parseFloat(shieldedBalance)).toFixed(2);

  const isLoading = isBalanceLoading || isShieldedLoading;

  const balanceParts = parseFloat(shieldedBalance).toFixed(2).split('.');
  const wholePart = balanceParts[0];
  const decimalPart = balanceParts[1];

  return (
    <div className="flex flex-col gap-5 mt-6 pb-4">

      {/* ── Balance Card ── */}
      <div className="glass-panel p-6 animate-fade-in-up" style={{ borderColor: 'rgba(124,58,237,0.2)', boxShadow: '0 0 40px rgba(124,58,237,0.08)' }}>
        {/* Arc Network Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-xs font-semibold text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Arc Testnet
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {showBalance ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* Private Balance */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Shielded Balance
          </p>
          <div className="flex items-end gap-2">
            {showBalance ? (
              <>
                <span className="text-5xl font-bold text-white tracking-tight">{isBalanceLoading ? '...' : wholePart}</span>
                <span className="text-2xl font-semibold text-gray-400 mb-1">.{decimalPart}</span>
                <span className="text-lg font-bold text-violet-400 mb-1 ml-1">USDC</span>
              </>
            ) : (
              <span className="text-5xl font-bold text-white tracking-tight">••••••</span>
            )}
          </div>
          {showBalance && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">+0.0%</span>
              <span>this month</span>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/5 mb-5" />

        {/* Public Balance Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Public Balance</p>
            <p className="text-base font-bold text-gray-300">
              {showBalance ? `${isBalanceLoading ? '...' : parseFloat(publicBalance).toLocaleString()} USDC` : '•••••••'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Total Value</p>
            <p className="text-base font-bold text-gray-300">
              {showBalance ? `${isBalanceLoading ? '...' : parseFloat(totalValue).toLocaleString()} USDC` : '•••••••'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="animate-fade-in-up animate-delay-100">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "stat-card p-3 flex flex-col items-center gap-2 text-center group transition-all duration-200",
                action.bgHover
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200",
                action.color, action.glow
              )}>
                <action.icon className="w-4.5 h-4.5 text-white w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{action.label}</p>
                <p className="text-[10px] text-gray-500 leading-tight hidden sm:block">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Privacy Status ── */}
      <div className="animate-fade-in-up animate-delay-200">
        <div className="stat-card p-4 flex items-center gap-4" style={{ borderColor: 'rgba(124,58,237,0.2)' }}>
          <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Arc Opt-in Privacy Active</p>
            <p className="text-xs text-gray-500 leading-snug mt-0.5">
              Your transfers are shielded with zero-knowledge proofs on Arc Network
            </p>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="animate-fade-in-up animate-delay-300">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Activity</p>
          <Link href="/history" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 transition-colors">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="glass-panel overflow-hidden" style={{ borderRadius: '20px' }}>
          {isActivityLoading ? (
            <div className="p-10 flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
              <p className="text-xs text-gray-500">Loading activity...</p>
            </div>
          ) : !isConnected ? (
            <div className="p-8 text-center">
              <p className="text-xs text-gray-600">Connect wallet to see activity</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-gray-600">No recent activity</p>
            </div>
          ) : (
            activities.map((log, i) => {
              const type = log.eventName;
              const args = log.args;
              const amount = formatUnits(args.amount || 0n, 6);
              
              const isDeposit = type === 'Shielded';
              const isWithdraw = type === 'Unshielded';
              const isSend = type === 'PrivateTransfer' && args.from?.toLowerCase() === address?.toLowerCase();
              const isReceive = type === 'PrivateTransfer' && args.to?.toLowerCase() === address?.toLowerCase();

              const cfg = isDeposit ? typeConfig.shield : isWithdraw ? typeConfig.unshield : typeConfig.send;
              const Icon = cfg.icon;

              return (
                <div
                  key={log.transactionHash}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 hover:bg-white/3 transition-colors",
                    i < activities.length - 1 && "border-b border-white/5"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {isDeposit ? 'Deposit' : isWithdraw ? 'Withdraw' : isReceive ? 'Private Receive' : 'Private Send'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn("text-sm font-bold", (isDeposit || isReceive) ? "text-emerald-400" : "text-gray-300")}>
                      {showBalance ? ((isDeposit || isReceive) ? `+${amount}` : `-${amount}`) : '••••'} <span className="text-xs font-normal text-gray-500">{args.token === USDC_ADDRESS ? 'USDC' : args.token === EURC_ADDRESS ? 'EURC' : 'Asset'}</span>
                    </p>
                    <div className={cn("flex items-center justify-end gap-0.5 text-xs", (isDeposit || isReceive) ? "text-emerald-500" : "text-gray-500")}>
                      {(isDeposit || isReceive) ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {isDeposit ? 'Received' : isWithdraw ? 'Withdrawn' : isReceive ? 'Received' : 'Sent'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
