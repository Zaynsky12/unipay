"use client";

import React, { useState } from 'react';
import { Settings, ArrowDown, Send, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { VAULT_ADDRESS, VAULT_ABI, USDC_ADDRESS, EURC_ADDRESS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'sending' | 'success';

export default function PrivateSendPage() {
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<"USDC" | "EURC">("USDC");
  const [status, setStatus] = useState<Status>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  const tokenAddress = selectedToken === "USDC" ? USDC_ADDRESS : EURC_ADDRESS;
  const { writeContractAsync } = useWriteContract();

  // Fetch real shielded balance (Vault)
  const { data: shieldedRaw, isLoading: isBalanceLoading } = useReadContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_ABI,
    functionName: 'balances',
    args: address ? [address as `0x${string}`, tokenAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    }
  });

  const vaultBalance = shieldedRaw ? formatUnits(shieldedRaw as bigint, 6) : '0.00';

  const handleSend = async () => {
    if (!recipient || !amount || status !== 'idle' || !isConnected || !address) return;
    setStatus('sending');
    
    try {
      const parsedAmount = parseUnits(amount, 6); // Both USDC and EURC use 6 decimals

      // Call privateTransfer on MorphicVault
      const hash = await writeContractAsync({
        address: VAULT_ADDRESS as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'privateTransfer',
        args: [tokenAddress as `0x${string}`, recipient as `0x${string}`, parsedAmount],
      });

      setTxHash(hash);

      // Record transaction to backend for history
      try {
        await fetch('/api/transactions/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: address,
            type: 'SEND',
            amount: amount,
            token: selectedToken,
            txHash: hash
          }),
        });
      } catch (e) {
        console.error("Backend recording failed", e);
      }

      setStatus('success');
    } catch (error) {
      console.error("Send failed:", error);
      setStatus('idle');
      alert("Transaction failed: " + (error as Error).message);
    }
  };

  const reset = () => {
    setStatus('idle');
    setAmount('');
    setRecipient('');
    setTxHash(null);
  };

  if (status === 'success') {
    return (
      <div className="glass-panel w-full p-8 mt-8 flex flex-col items-center text-center gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 60px rgba(59,130,246,0.1)' }}>
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-1">
          <CheckCircle2 className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Sent!</h2>
          <p className="text-gray-400 mt-2 font-medium">
            <span className="text-white font-bold">{amount} Shielded {selectedToken}</span> sent to<br />
            <span className="text-blue-400 font-bold break-all">{recipient}</span>
          </p>
        </div>
        <div className="w-full p-3 rounded-2xl bg-blue-500/8 border border-blue-500/15 text-xs text-blue-300 font-medium">
          ✓ Transfer is private — actual amount hidden on Arc Network
        </div>
        {txHash && txHash !== "0x_mock_hash" && (
          <a 
            href={`https://testnet.arcscan.app/tx/${txHash}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium mt-1 mb-2 underline decoration-blue-500/30 underline-offset-4"
          >
            View on Arc Explorer ↗
          </a>
        )}
        <button onClick={reset} className="w-full py-4 rounded-[20px] font-bold text-base bg-blue-600 text-white hover:bg-blue-500 hover:-translate-y-0.5 shadow-lg hover:shadow-blue-500/25 transition-all">
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel w-full p-4 mt-8 flex flex-col gap-4 animate-fade-in-up" style={{ boxShadow: '0 0 40px rgba(59,130,246,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-1">
        <div>
          <h2 className="text-lg font-bold text-white">Private Send</h2>
          <p className="text-xs text-gray-500">Transfer from your shielded vault</p>
        </div>
        <button className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/8">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Recipient Input */}
      <div className="bg-black/40 rounded-3xl p-4 border border-white/6 hover:border-white/10 transition-colors">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-2 block">Recipient</label>
        <div className="relative">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={status === 'sending'}
            className="w-full bg-transparent text-xl font-bold text-white placeholder-gray-700 focus:outline-none px-1"
          />
        </div>
      </div>

      {/* Arrow Separator */}
      <div className="relative h-1 flex justify-center items-center">
        <div className="absolute w-9 h-9 rounded-2xl bg-black/70 border border-white/10 flex items-center justify-center z-10 text-blue-400 shadow-xl">
          <ArrowDown className="w-4 h-4" />
        </div>
      </div>

      {/* Amount Input */}
      <div className="bg-black/40 rounded-3xl p-4 border border-white/6 hover:border-white/10 transition-colors">
        <div className="flex justify-between items-center mb-3">
          <button 
            onClick={() => setSelectedToken(selectedToken === "USDC" ? "EURC" : "USDC")}
            disabled={status !== 'idle'}
            className="flex items-center gap-2 bg-white/6 hover:bg-white/10 transition-colors rounded-full px-3 py-1.5 border border-white/8">
            <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white", selectedToken === "USDC" ? "bg-blue-500" : "bg-emerald-500")}>
              {selectedToken === "USDC" ? "U" : "€"}
            </div>
            <span className="text-sm font-bold text-white">{selectedToken}</span>
            <ArrowDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            disabled={status === 'sending'}
            className="bg-transparent text-right text-4xl font-bold text-white placeholder-gray-700 focus:outline-none w-1/2"
          />
        </div>
        <div className="flex justify-between items-center text-xs font-medium text-gray-500">
          <span>Vault Balance: <span className="text-gray-400">{isBalanceLoading ? '...' : vaultBalance}</span></span>
          <div className="flex items-center gap-2">
            <span>{amount ? `≈ $${parseFloat(amount).toLocaleString()}` : '~$0.00'}</span>
            <button
              onClick={() => setAmount(vaultBalance)}
              className="text-blue-400 hover:text-blue-300 font-bold bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 rounded-md transition-all"
            >MAX</button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/8 border border-blue-500/15">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200/70 leading-relaxed">
          Zero-knowledge proofs hide both the token amount and recipient address on Arc's public ledger.
        </p>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSend}
        disabled={!amount || !recipient || status === 'sending'}
        className={cn(
          "w-full py-4 rounded-[20px] font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg",
          (!amount || !recipient)
            ? "bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed"
            : status === 'sending'
              ? "bg-blue-600/50 text-white cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-500 hover:-translate-y-0.5 hover:shadow-blue-500/25"
        )}
      >
        {status === 'sending' ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Encrypting Transfer...</>
        ) : !recipient ? (
          'Enter recipient'
        ) : !amount ? (
          'Enter an amount'
        ) : (
          <><Send className="w-5 h-5" /> Send Confidentially</>
        )}
      </button>
    </div>
  );
}
