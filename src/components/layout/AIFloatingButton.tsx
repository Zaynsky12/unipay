"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  MessageSquare, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { usePathname } from 'next/navigation';

type Message = {
  role: 'assistant' | 'user';
  content: string;
};

const QUICK_PROMPTS = [
  "How to create a Paylink?",
  "What is UniPay Registry?",
  "How to withdraw my funds?",
  "Is UniPay non-custodial?"
];

export function AIFloatingButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your UniPay Assistant. How can I help you navigate the protocol today?" }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (pathname === '/') return null;

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

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
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my neural network. Please check your internet or API key." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* ── THE BUTTON ── */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 sm:bottom-12 sm:right-12 z-[100] group transition-all duration-500 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 bg-violet-600 rounded-full blur-xl opacity-40 group-hover:opacity-70 group-hover:scale-125 transition-all duration-500 animate-pulse" />
        <div className="relative w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center border border-violet-400/30 shadow-[0_10px_30px_rgba(124,58,237,0.5)] transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
          <div className="absolute right-full mr-4 bg-[#0B0B12] border border-white/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              Ask UniPay AI
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            </p>
          </div>
        </div>
      </button>

      {/* ── CHAT MODAL ── */}
      <div className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-12 sm:bottom-12 z-[101] sm:w-full sm:max-w-[400px] transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#0B0B12] border border-white/10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col h-[550px] max-h-[calc(100vh-8rem)] overflow-hidden">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">UniPay AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Protocol Intelligence</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-[11px] leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-violet-600 text-white rounded-tr-none' 
                    : 'bg-white/[0.03] border border-white/10 text-gray-300 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-white/[0.03] border border-white/10 p-4 rounded-2xl rounded-tl-none">
                  <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
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
                  onClick={() => handleSend(p)}
                  className="px-3 py-1.5 bg-white/[0.02] border border-white/5 hover:border-violet-500/50 rounded-lg text-[9px] font-bold text-gray-500 hover:text-white transition-all"
                 >
                   {p}
                 </button>
               ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-6 pt-0">
            <div className="relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Ask something..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-xs font-bold text-white focus:border-violet-500 outline-none transition-all"
              />
              <button 
                onClick={() => handleSend(input)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-lg transition-all active:scale-90"
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
