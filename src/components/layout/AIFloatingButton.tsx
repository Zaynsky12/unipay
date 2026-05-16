"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function AIFloatingButton() {
  const pathname = usePathname();
  
  // Jangan tampilkan di halaman landing page utama
  if (pathname === '/') return null;

  return (
    <Link 
      href="/dashboard/insights"
      className="fixed bottom-24 right-6 md:bottom-10 md:right-10 z-[100] group"
    >
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-violet-600 rounded-full blur-xl opacity-40 group-hover:opacity-70 group-hover:scale-125 transition-all duration-500 animate-pulse" />
      
      {/* The Button Body */}
      <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center border border-violet-400/30 shadow-[0_10px_30px_rgba(124,58,237,0.5)] transform transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
        <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white animate-pulse" />
        
        {/* Label on Hover */}
        <div className="absolute right-full mr-4 bg-[#0B0B12] border border-white/10 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
            Ask AI Assistant
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          </p>
        </div>
      </div>
    </Link>
  );
}
