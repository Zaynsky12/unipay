"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Bot,
  Loader2
} from 'lucide-react';
import { usePathname } from 'next/navigation';

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

const QUICK_PROMPTS = [
  "How do I create a new smart Paylink?",
  "What is the purpose of the LumiPay Registry?",
  "Do I need to manually withdraw my funds?",
  "Is the LumiPay Protocol fully non-custodial?"
];

export function AIFloatingButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your LumiPay Assistant. How can I help you navigate the protocol today?" }
  ]);
  const [messageCount, setMessageCount] = useState(0);
  const MAX_DAILY_MESSAGES = 15;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const today = new Date().toDateString();
      const stored = localStorage.getItem('lumipay_ai_limit');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.date === today) {
            setMessageCount(parsed.count || 0);
          } else {
            localStorage.setItem('lumipay_ai_limit', JSON.stringify({ date: today, count: 0 }));
            setMessageCount(0);
          }
        } catch (e) {
          localStorage.setItem('lumipay_ai_limit', JSON.stringify({ date: today, count: 0 }));
          setMessageCount(0);
        }
      } else {
        localStorage.setItem('lumipay_ai_limit', JSON.stringify({ date: today, count: 0 }));
        setMessageCount(0);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const isPaymentPage = pathname.startsWith('/pay/') || 
                        pathname.startsWith('/checkout/') || 
                        pathname.startsWith('/invoice/') || 
                        pathname.startsWith('/subscribe/') || 
                        pathname.startsWith('/tip/');

  if (pathname === '/' || isPaymentPage) return null;

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const today = new Date().toDateString();
    const stored = localStorage.getItem('lumipay_ai_limit');
    let currentCount = 0;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          currentCount = parsed.count || 0;
        }
      } catch (e) {}
    }

    if (currentCount >= MAX_DAILY_MESSAGES) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Daily limit reached! You've used all ${MAX_DAILY_MESSAGES} AI queries for today. Limit resets tomorrow.`
      }]);
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);

      const newCount = currentCount + 1;
      localStorage.setItem('lumipay_ai_limit', JSON.stringify({ date: today, count: newCount }));
      setMessageCount(newCount);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my neural network. Please check your internet or API key." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── THE BUTTON ── Orange Caldera style */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 sm:bottom-12 sm:right-12 z-[100] group transition-all duration-500 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        {/* Orange glow pulse */}
        <div className="absolute inset-0 bg-[#fc5000] rounded-full blur-xl opacity-35 group-hover:opacity-60 group-hover:scale-125 transition-all duration-500 animate-pulse" />
        {/* Button body */}
        <div className="relative w-14 h-14 bg-[#fc5000] hover:bg-[#e04500] rounded-full flex items-center justify-center border border-[#fc5000]/40 shadow-[0_10px_30px_rgba(252,80,0,0.45)] transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
          <Sparkles className="w-6 h-6 text-slate-900" />
          <div className="absolute right-full mr-4 bg-white border border-gray-200 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              Ask LumiPay AI
              <span className="w-1.5 h-1.5 rounded-full bg-[#fc5000] animate-pulse" />
            </p>
          </div>
        </div>
      </button>

      {/* ── CHAT MODAL ── */}
      <div className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-12 sm:bottom-12 z-[101] sm:w-full sm:max-w-[400px] transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col h-[550px] max-h-[calc(100vh-8rem)] overflow-hidden">

          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-[#fc5000]/10 to-transparent border-b border-gray-200 flex items-center justify-between">
            {/* Orange accent top bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#fc5000]/60 via-[#fc5000]/30 to-transparent rounded-t-[2.5rem]" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#fc5000] rounded-2xl flex items-center justify-center shadow-[0_0_16px_rgba(252,80,0,0.40)]">
                <Bot className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">LumiPay AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Intelligence</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/[0.05] rounded-xl transition-colors text-gray-500 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#fc5000] text-slate-900 rounded-tr-none font-semibold'
                    : 'bg-gray-50 border border-gray-200 text-gray-600 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-4 h-4 text-[#fc5000] animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          {messages.length === 1 && (
            <div className="px-6 pb-4 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => messageCount < MAX_DAILY_MESSAGES && handleSend(p)}
                  disabled={messageCount >= MAX_DAILY_MESSAGES}
                  className={`px-3 py-1.5 border rounded-full text-[9px] font-bold transition-all ${
                    messageCount >= MAX_DAILY_MESSAGES
                      ? 'bg-white/[0.01] border-gray-200 text-gray-700 cursor-not-allowed opacity-40'
                      : 'bg-white border-gray-200 hover:border-[#fc5000]/40 hover:bg-[#fc5000]/8 text-gray-500 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Daily Usage */}
          <div className="px-6 pb-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
            <span className="text-gray-600">Daily AI Usage</span>
            <span className={messageCount >= MAX_DAILY_MESSAGES ? "text-rose-500 animate-pulse font-bold" : "text-[#fc5000] font-bold"}>
              {messageCount} / {MAX_DAILY_MESSAGES} Queries
            </span>
          </div>

          {/* Input */}
          <div className="p-6 pt-0">
            <div className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && messageCount < MAX_DAILY_MESSAGES && handleSend(input)}
                placeholder={messageCount >= MAX_DAILY_MESSAGES ? `Daily limit reached (${MAX_DAILY_MESSAGES}/${MAX_DAILY_MESSAGES})...` : "Ask something..."}
                disabled={messageCount >= MAX_DAILY_MESSAGES}
                className={`w-full bg-gray-50 border-[1.5px] rounded-2xl py-4 pl-5 pr-12 text-xs font-bold text-slate-900 focus:border-[#fc5000] focus:shadow-[0_0_0_3px_rgba(252,80,0,0.12)] outline-none transition-all ${
                  messageCount >= MAX_DAILY_MESSAGES
                    ? 'border-gray-200 opacity-50 cursor-not-allowed placeholder-gray-600'
                    : 'border-gray-200'
                }`}
              />
              <button
                onClick={() => messageCount < MAX_DAILY_MESSAGES && handleSend(input)}
                disabled={messageCount >= MAX_DAILY_MESSAGES || !input.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl shadow-lg transition-all active:scale-90 ${
                  messageCount >= MAX_DAILY_MESSAGES || !input.trim()
                    ? 'bg-white/[0.03] text-gray-600 cursor-not-allowed shadow-none'
                    : 'bg-[#fc5000] hover:bg-[#e04500] text-slate-900 shadow-[0_0_12px_rgba(252,80,0,0.35)]'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
