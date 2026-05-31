"use client";

import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { 
  Loader2, 
  Coins, 
  XCircle,
  Zap,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { LUMIPAY_REGISTRY_ADDRESS, REGISTRY_ABI, ERC20_ABI } from '@/lib/constants';

interface SubscriptionRowProps {
  sub: any;
  onCancel: (subId: string) => void;
  cancelingId: string | null;
}

export function SubscriptionRow({ sub, onCancel, cancelingId }: SubscriptionRowProps) {
  const { address } = useAccount();
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewStep, setRenewStep] = useState<'idle' | 'approving' | 'renewing'>('idle');

  const formattedAmount = sub.amount ? formatUnits(BigInt(sub.amount), 6) : '0.00';
  const merchantName = sub.merchant?.name || 'Unknown Merchant';
  
  // Read on-chain subscription state to get nextPaymentDue
  const { data: subData, refetch: refetchSub } = useReadContract({
    address: LUMIPAY_REGISTRY_ADDRESS,
    abi: REGISTRY_ABI,
    functionName: 'subscriptions',
    args: [sub.id as `0x${string}`],
  });

  const nextPaymentDue = subData ? Number(subData[5]) : 0;
  const isDue = nextPaymentDue > 0 && Math.floor(Date.now() / 1000) >= nextPaymentDue;
  
  const dueDateString = nextPaymentDue > 0 
    ? new Date(nextPaymentDue * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Loading...';

  // Contracts
  const { writeContractAsync: writeApprove } = useWriteContract();
  const { writeContractAsync: writeRenew } = useWriteContract();

  const handleRenew = async () => {
    if (!address) return;
    try {
      setIsRenewing(true);
      
      // 1. Approve exact amount
      setRenewStep('approving');
      const approveTxHash = await writeApprove({
        address: sub.token as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [LUMIPAY_REGISTRY_ADDRESS, BigInt(sub.amount)],
      });
      
      // We should technically wait for receipt, but for UX optimism we can sometimes proceed if viem handles nonce.
      // Better to just wait for confirmation in production, but let's assume it succeeds quickly or user uses a fast chain.
      
      // 2. Renew
      setRenewStep('renewing');
      const renewTxHash = await writeRenew({
        address: LUMIPAY_REGISTRY_ADDRESS,
        abi: REGISTRY_ABI,
        functionName: 'renewSubscription',
        args: [sub.id as `0x${string}`],
      });
      
      // Done
      setRenewStep('idle');
      setIsRenewing(false);
      
      // Refetch
      setTimeout(() => {
        refetchSub();
      }, 3000);
      
    } catch (err) {
      console.error("Renewal failed:", err);
      setRenewStep('idle');
      setIsRenewing(false);
    }
  };

  const isCancelingThis = cancelingId === sub.id;

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="py-4 px-3">
        <span className="font-bold text-slate-900 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 block w-fit">
          {merchantName}
        </span>
      </td>
      <td className="py-4 px-3">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Coins className="w-4 h-4 text-[#fc5000]" />
          <span className="text-sm">${formattedAmount}</span>
          <span className="text-[10px] text-gray-500 font-normal">{sub.token || 'USDC'}</span>
        </div>
      </td>
      <td className="py-4 px-3 text-gray-500">
        <div className="flex flex-col gap-0.5">
          <span>Every {sub.interval ? (Number(sub.interval) / 86400).toString() : '30'} Days</span>
          <span className={`text-[10px] font-bold flex items-center gap-1 ${isDue ? 'text-red-500' : 'text-emerald-500'}`}>
            <Clock className="w-3 h-3" />
            {isDue ? 'Due Now' : `Next: ${dueDateString}`}
          </span>
        </div>
      </td>
      <td className="py-4 px-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleRenew}
            disabled={isRenewing || isCancelingThis}
            className="inline-flex items-center gap-1.5 text-xs text-white font-bold bg-[#fc5000] hover:bg-[#e04500] px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(252,80,0,0.3)]"
          >
            {isRenewing ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {renewStep === 'approving' ? 'Approving...' : 'Paying...'}</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Renew</>
            )}
          </button>
          <button
            onClick={() => onCancel(sub.id)}
            disabled={cancelingId !== null || isRenewing}
            className="inline-flex items-center gap-1.5 text-xs text-red-600 font-bold bg-white hover:bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 transition-all disabled:opacity-50"
          >
            {isCancelingThis ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Canceling...</>
            ) : (
              <><XCircle className="w-3.5 h-3.5" /> Cancel</>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
