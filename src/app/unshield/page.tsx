"use client";

import React, { useState } from 'react';
import { Settings, ArrowDown, ShieldAlert, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { useAccount } from 'wagmi';

type Status = 'idle' | 'unshielding' | 'success';

export default function UnshieldPage() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const handleUnshield = async () => {
    if (!amount || status !== 'idle' || !isConnected || !address) return;
    setStatus('unshielding');
    
    try {
      if (!window.ethereum) throw new Error("Wallet not found");
      
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as any,
      });
      const kit = new AppKit();

      // For Unshielding, we simulate an interaction where the Vault sends USDC back.
      // Since kit.send only sends from the current user, in a real app this would call
      // a specific smart contract function (e.g. unshield()). Here we mock the behavior
      // to demonstrate the integration with Arc AppKit for the demo.
      const mockResult = await kit.send({
        from: { adapter, chain: "Arc_Testnet" },
        to: address, // sending to self just to trigger an Arc testnet transaction
        amount: "0.000001", // minimal amount just to get a real tx hash
        token: "USDC",
      });

      const hash = mockResult as any || "0x_mock_hash";
      setTxHash(hash);

      // Record transaction to backend for history
      try {
        await fetch('/api/transactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            type: 'UNSHIELD',
            amount,
            txHash: hash
          }),
        });
      } catch (e) {
        console.error("Backend recording failed", e);
      }

      setStatus('success');
    } catch (error) {
      console.error("Unshield failed:", error);
      setStatus('idle');
      alert("Unshield failed: " + (error as Error).message);
    }
  };

  const reset = () => {
    setStatus('idle');
    setAmount('');
    setTxHash(null);
  };

  if (status === 'success') {
    return (
      <div className="glass-panel w-full p-8 mt-8 flex flex-col items-center text-center gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 60px rgba(16,185,129,0.08)' }}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-1">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Withdrawn!</h2>
          <p className="text-gray-400 mt-2 font-medium">
            <span className="text-white font-bold">{amount} USDC</span> moved to your<br />
            <span className="text-emerald-400 font-bold">public wallet</span>
          </p>
        </div>
        <div className="w-full p-3 rounded-2xl bg-orange-500/8 border border-orange-500/15 text-xs text-orange-300 font-medium">
          ⚠ This amount is now visible on Arc Network explorer
        </div>
        {txHash && txHash !== "0x_mock_hash" && (
          <a 
            href={`https://testnet.arcscan.app/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium mt-1 mb-2 underline decoration-emerald-500/30 underline-offset-4"
          >
            View on Arc Explorer ↗
          </a>
        )}
        <button onClick={reset} className="w-full py-4 rounded-[20px] font-bold text-base bg-emerald-600 text-white hover:bg-emerald-500 hover:-translate-y-0.5 shadow-lg hover:shadow-emerald-500/25 transition-all">
          Unshield More
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel w-full p-4 mt-8 flex flex-col gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 40px rgba(16,185,129,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-1">
        <div>
          <h2 className="text-lg font-bold text-white">Unshield</h2>
          <p className="text-xs text-gray-500">Withdraw from your private vault</p>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/8">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Input — Morphic Vault */}
      <div className="bg-violet-950/20 rounded-3xl p-4 border border-violet-500/15 hover:border-violet-500/25 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 px-1">
            <Shield className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-bold text-white">Morphic Vault</span>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="bg-transparent text-right text-4xl font-bold text-white placeholder-gray-700 focus:outline-none w-1/2"
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Shielded Balance: <span className="text-violet-400">4,500.00</span></span>
          <div className="flex items-center gap-2">
            <span>{amount ? `≈ $${parseFloat(amount).toLocaleString()}` : '~$0.00'}</span>
            <button
              onClick={() => setAmount('4500')}
              className="text-violet-400 hover:text-violet-300 font-bold bg-violet-500/10 hover:bg-violet-500/20 px-2 py-0.5 rounded-md transition-all"
            >MAX</button>
          </div>
        </div>
      </div>

      {/* Arrow Separator */}
      <div className="relative h-1 flex justify-center items-center">
        <div className="absolute w-9 h-9 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center z-10 text-emerald-400 shadow-xl">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* Output — Public USDC */}
      <div className="bg-black/40 rounded-3xl p-4 border border-white/6">
        <div className="flex justify-between items-center mb-3">
          <button className="flex items-center gap-2 bg-white/6 rounded-full px-3 py-1.5 border border-white/8">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">U</div>
            <span className="text-sm font-bold text-white">USDC</span>
          </button>
          <div className="text-right text-4xl font-bold text-gray-500">
            {amount || '0'}
          </div>
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Public Balance: <span className="text-gray-400">1,250.00</span></span>
          <span className="text-gray-600">1:1 ratio</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-orange-500/8 border border-orange-500/20">
        <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
        <p className="text-xs text-orange-200/70 leading-relaxed">
          Unshielding reveals this amount on Arc's public explorer. Your previous private history remains hidden.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleUnshield}
        disabled={!amount || status === 'unshielding'}
        className={cn(
          "w-full py-4 rounded-[20px] font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg",
          !amount
            ? "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
            : status === 'unshielding'
              ? "bg-emerald-600/50 text-white cursor-not-allowed"
              : "bg-white text-black hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-white/20"
        )}
      >
        {status === 'unshielding' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
        ) : !amount ? (
          'Enter an amount'
        ) : (
          'Unshield Assets'
        )}
      </button>
    </div>
  );
}
