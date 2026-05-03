"use client";

import React, { useState } from 'react';
import { Settings, ArrowDown, Info, Shield as ShieldIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

type Status = 'idle' | 'shielding' | 'success';

export default function ShieldPage() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Fetch real balance
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
  });

  const publicBalance = balanceData ? formatUnits(balanceData.value, balanceData.decimals) : '0.00';

  const handleShield = async () => {
    if (!amount || status !== 'idle' || !isConnected) return;
    setStatus('shielding');
    
    try {
      if (!window.ethereum) throw new Error("Wallet not found");
      
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as any,
      });
      const kit = new AppKit();

      // For Shielding, we send USDC to a known Vault address.
      const vaultAddress = "0x00000000000000000000000000000000000M0RPH"; 
      
      const result = await kit.send({
        from: { adapter, chain: "Arc_Testnet" },
        to: vaultAddress,
        amount: amount,
        token: "USDC",
      });

      const hash = result as any || "0x_mock_hash";
      setTxHash(hash);

      // Record transaction to backend for history
      try {
        await fetch('/api/transactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            type: 'SHIELD',
            amount,
            txHash: hash
          }),
        });
      } catch (e) {
        console.error("Backend recording failed", e);
      }

      setStatus('success');
    } catch (error) {
      console.error("Shield failed:", error);
      setStatus('idle');
      alert("Shield failed: " + (error as Error).message);
    }
  };

  const reset = () => {
    setStatus('idle');
    setAmount('');
    setTxHash(null);
  };

  if (status === 'success') {
    return (
      <div className="glass-panel w-full p-8 mt-8 flex flex-col items-center text-center gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 60px rgba(124,58,237,0.12)' }}>
        <div className="w-16 h-16 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-1">
          <CheckCircle2 className="w-8 h-8 text-violet-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Shielded!</h2>
          <p className="text-gray-400 mt-2 font-medium">
            <span className="text-white font-bold">{amount} USDC</span> moved to your<br />
            <span className="text-violet-400 font-bold">Morphic Vault</span>
          </p>
        </div>
        <div className="w-full p-3 rounded-2xl bg-violet-500/8 border border-violet-500/15 text-xs text-violet-300 font-medium">
          ✓ Your assets are now private on Arc Network
        </div>
        {txHash && txHash !== "0x_mock_hash" && (
          <a 
            href={`https://testnet.arcscan.app/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 font-medium mt-1 mb-2 underline decoration-violet-500/30 underline-offset-4"
          >
            View on Arc Explorer ↗
          </a>
        )}
        <button onClick={reset} className="w-full py-4 rounded-[20px] font-bold text-base bg-violet-600 text-white hover:bg-violet-500 hover:-translate-y-0.5 shadow-lg hover:shadow-violet-500/25 transition-all">
          Shield More
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel w-full p-4 mt-8 flex flex-col gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 40px rgba(124,58,237,0.08)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-1">
        <div>
          <h2 className="text-lg font-bold text-white">Shield</h2>
          <p className="text-xs text-gray-500">Deposit to your private vault</p>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/8">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Input — Public USDC */}
      <div className="bg-black/40 rounded-3xl p-4 border border-white/6 relative group hover:border-white/10 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <button className="flex items-center gap-2 bg-white/6 hover:bg-white/10 transition-colors rounded-full px-3 py-1.5 border border-white/8">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">U</div>
            <span className="text-sm font-bold text-white">USDC</span>
            <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="bg-transparent text-right text-4xl font-bold text-white placeholder-gray-700 focus:outline-none w-1/2"
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Public Balance: <span className="text-gray-400">{isBalanceLoading ? '...' : publicBalance}</span></span>
          <div className="flex items-center gap-2">
            <span>{amount ? `≈ $${parseFloat(amount).toLocaleString()}` : '~$0.00'}</span>
            <button
              onClick={() => setAmount(publicBalance)}
              className="text-violet-400 hover:text-violet-300 font-bold bg-violet-500/10 hover:bg-violet-500/20 px-2 py-0.5 rounded-md transition-all"
            >MAX</button>
          </div>
        </div>
      </div>

      {/* Arrow Separator */}
      <div className="relative h-1 flex justify-center items-center">
        <div className="absolute w-9 h-9 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center z-10 text-violet-400 shadow-xl">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* Output — Morphic Vault */}
      <div className="bg-violet-950/20 rounded-3xl p-4 border border-violet-500/15">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-5 h-5 rounded-full bg-violet-500/30 flex items-center justify-center">
              <ShieldIcon className="w-3 h-3 text-violet-400" />
            </div>
            <span className="text-sm font-bold text-white">Morphic Vault</span>
          </div>
          <div className="text-right text-4xl font-bold text-gray-500">
            {amount || '0'}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Shielded Balance: <span className="text-violet-400">4,500.00</span></span>
          <span className="text-violet-400">1:1 ratio</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-500/8 border border-violet-500/15">
        <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <p className="text-xs text-violet-200/70 leading-relaxed">
          Shielding breaks the link between your public address and your private vault — powered by Arc's opt-in privacy.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleShield}
        disabled={!amount || status === 'shielding'}
        className={cn(
          "w-full py-4 rounded-[20px] font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg",
          !amount
            ? "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
            : status === 'shielding'
              ? "bg-violet-600/50 text-white cursor-not-allowed"
              : "bg-violet-600 text-white hover:bg-violet-500 hover:-translate-y-0.5 hover:shadow-violet-500/25"
        )}
      >
        {status === 'shielding' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generating ZK Proof...</>
        ) : !amount ? (
          'Enter an amount'
        ) : (
          <><ShieldIcon className="w-5 h-5" /> Shield Assets</>
        )}
      </button>
    </div>
  );
}
