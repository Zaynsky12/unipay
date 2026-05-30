'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';

export function InlineAuth() {
  const { login, authenticated } = usePrivy();
  const { state, sendCode, loginWithCode } = useLoginWithEmail();
  
  const [emailInput, setEmailInput] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync internal error state with Privy state
  useEffect(() => {
    if (state.status === 'error') {
      setErrorMsg(state.error?.message || 'Verification failed. Please try again.');
    } else {
      setErrorMsg(null);
    }
  }, [state]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg(null);
    try {
      await sendCode({ email: emailInput });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to send code.');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter a 6-digit code.');
      return;
    }
    setErrorMsg(null);
    try {
      await loginWithCode({ code });
      // On success, Privy context updates and the parent unmounts this component
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid code.');
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  // Auto-submit OTP when all 6 digits are entered
  useEffect(() => {
    if (otp.join('').length === 6) {
      handleOtpSubmit();
    }
  }, [otp]);

  // If successfully verified or already authenticated but waiting for wagmi connection
  if (state.status === 'done' || authenticated) {
    return (
      <div className="w-full flex flex-col items-center justify-center space-y-4 py-8 mb-8 animate-fade-in">
        <Loader2 className="w-8 h-8 text-[#fc5000] animate-spin" />
        <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">
          Provisioning Wallet...
        </p>
      </div>
    );
  }

  // UI rendering based on state
  if (state.status === 'awaiting-code-input' || state.status === 'submitting-code') {
    return (
      <div className="w-full space-y-6 mb-8 text-left mt-2 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#fc5000]/10 rounded-2xl border border-[#fc5000]/20 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6 text-[#fc5000]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Enter Code</h3>
          <p className="text-[13px] text-gray-500">
            We sent a 6-digit code to <span className="font-semibold text-slate-700">{emailInput}</span>
          </p>
        </div>

        <form onSubmit={handleOtpSubmit} className="flex flex-col items-center gap-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={state.status === 'submitting-code'}
                className="w-12 h-14 text-center text-xl font-black text-slate-900 bg-gray-100 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fc5000]/50 focus:border-[#fc5000]/50 focus:bg-white transition-all disabled:opacity-50"
                maxLength={1}
              />
            ))}
          </div>

          {errorMsg && (
            <p className="text-[12px] font-semibold text-red-500 text-center animate-shake">
              {errorMsg}
            </p>
          )}

          <button
            type="button"
            onClick={() => sendCode({ email: emailInput })}
            className="text-[13px] font-semibold text-slate-500 hover:text-[#fc5000] transition-colors"
            disabled={state.status === 'submitting-code'}
          >
            Didn't receive it? Resend code
          </button>
        </form>
      </div>
    );
  }

  // Initial Email Input View
  return (
    <div className="w-full space-y-5 mb-8 text-left mt-2">
      <form 
        onSubmit={handleEmailSubmit} 
        className={`w-full relative flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl border border-gray-200 group focus-within:ring-2 focus-within:ring-[#fc5000]/20 focus-within:border-[#fc5000]/50 ${errorMsg ? 'border-red-300 ring-1 ring-red-200' : ''}`}
      >
        <div className="absolute left-4 text-gray-400 group-focus-within:text-[#fc5000] transition-colors">
          <Mail className="w-5 h-5" />
        </div>
        <input 
          type="email"
          placeholder="Enter your email"
          value={emailInput}
          onChange={(e) => {
            setEmailInput(e.target.value);
            setErrorMsg(null);
          }}
          disabled={state.status === 'sending-code'}
          className="w-full bg-transparent border-none py-3.5 pl-11 pr-12 text-[14px] font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0 text-center disabled:opacity-50"
          required
        />
        <button 
          type="submit" 
          disabled={state.status === 'sending-code'}
          className="absolute right-4 text-slate-400 group-focus-within:text-[#fc5000] hover:text-slate-900 transition-colors disabled:opacity-50"
        >
          {state.status === 'sending-code' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </form>

      {errorMsg && (
        <p className="text-[12px] font-semibold text-red-500 text-center -mt-2 animate-fade-in">
          {errorMsg}
        </p>
      )}
      
      <button 
        onClick={() => login({ loginMethods: ['wallet'] })}
        type="button"
        className="text-[14px] font-semibold text-slate-900 hover:text-[#fc5000] transition-colors block w-full text-center"
      >
        Sign in with wallet
      </button>
    </div>
  );
}
