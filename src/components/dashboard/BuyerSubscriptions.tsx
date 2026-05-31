"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits } from 'viem';
import { 
  Loader2, 
  Coins, 
  Calendar,
  XCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI } from '@/lib/constants';
import { goldskyClient, GET_BUYER_SUBSCRIPTIONS } from '@/lib/goldsky';
import { usePrivy } from '@privy-io/react-auth';
import { SubscriptionRow } from './SubscriptionRow';

export function BuyerSubscriptions() {
  const { user } = usePrivy();
  const { address } = useAccount();
  const userAddress = address || (user?.wallet?.address as `0x${string}`) || undefined;
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess, error: confirmError } = useWaitForTransactionReceipt({ hash: txHash });

  const fetchSubscriptions = useCallback(async () => {
    if (!userAddress) return;
    setIsLoading(true);
    try {
      const data: any = await goldskyClient.request(GET_BUYER_SUBSCRIPTIONS, {
        subscriber: userAddress.toLowerCase()
      });
      setSubscriptions(data.subscriptionPlans || []);
    } catch (err) {
      console.error('Failed to fetch buyer subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Refetch when cancel succeeds
  useEffect(() => {
    if (isSuccess) {
      setCancelingId(null);
      fetchSubscriptions();
    }
  }, [isSuccess, fetchSubscriptions]);

  useEffect(() => {
    if (writeError || confirmError) {
      setCancelingId(null);
    }
  }, [writeError, confirmError]);

  const handleCancel = (subId: string) => {
    if (!userAddress) return;
    setCancelingId(subId);
    const formattedId = (subId.startsWith('0x') ? subId : `0x${subId}`) as `0x${string}`;
    writeContract({
      address: LUMIPAY_REGISTRY_ADDRESS,
      abi: REGISTRY_ABI,
      functionName: 'cancelSubscription',
      args: [formattedId],
      gas: 100000n,
    });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-gray-200 rounded-[2.5rem] p-8">
        <Loader2 className="w-8 h-8 text-[#fc5000] animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-900 tracking-tight">Loading your subscriptions...</p>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter((sub: any) => sub.isActive);

  if (activeSubscriptions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl py-16 text-center space-y-4 px-6">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-200 text-gray-600">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Subscriptions</h2>
        <p className="text-xs text-gray-500 font-medium">You haven't subscribed to any merchants yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 sm:p-12 space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">My Subscriptions</h2>
        <p className="text-gray-500 text-xs uppercase tracking-widest leading-relaxed mt-1">Manage your recurring payments to merchants.</p>
      </div>

      {(writeError || confirmError) && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Cancellation Failed</p>
            <p className="text-xs font-semibold text-gray-600">Transaction was rejected or failed on the blockchain.</p>
          </div>
        </div>
      )}

      {isSuccess && !cancelingId && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Subscription Canceled</p>
            <p className="text-xs font-semibold text-gray-600">You will no longer be billed for this subscription.</p>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-200">
              <th className="pb-3.5 font-bold px-3">Merchant</th>
              <th className="pb-3.5 font-bold px-3">Plan Volume</th>
              <th className="pb-3.5 font-bold px-3">Billing Cycle</th>
              <th className="pb-3.5 font-bold text-right px-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-medium text-gray-600">
            {activeSubscriptions.map((sub: any) => {
              const isCancelingThis = cancelingId === sub.id && (isPending || isTxConfirming);
              
              return (
                <SubscriptionRow 
                  key={sub.id} 
                  sub={sub} 
                  onCancel={handleCancel} 
                  cancelingId={isCancelingThis ? sub.id : null} 
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
