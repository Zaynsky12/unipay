"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, Shield, Send, Unlock, History, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Deposit',   href: '/deposit',   icon: Shield },
  { name: 'Send',      href: '/send',      icon: Send },
  { name: 'Withdraw',  href: '/withdraw',  icon: Unlock },
  { name: 'History',   href: '/history',   icon: History },
];

export function Navbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href;
  };

  return (
    <>
      {/* ── Top Navbar ── */}
      <header className="w-full bg-[#07070a]/80 border-b border-white/5 backdrop-blur-xl fixed top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#00E5FF] flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
              <Eye className="w-4 h-4 text-black" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Morphic</span>
          </Link>

          {/* Desktop Navigation - Hidden on Landing Page */}
          {!isLandingPage && (
            <nav className="hidden md:flex items-center bg-white/4 rounded-full p-1 border border-white/6 gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                    isActive(item.href)
                      ? "bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                      : "text-gray-500 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right — Network Badge + Wallet */}
          <div className="flex items-center gap-2 shrink-0">
            <appkit-button balance="hide" />
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar - Hidden on Landing Page ── */}
      {!isLandingPage && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#07070a]/95 backdrop-blur-xl border-t border-white/8 z-50">
          <nav className="flex items-center justify-around px-1 py-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-2xl min-w-0 flex-1 transition-all",
                    active ? "text-violet-400" : "text-gray-600 hover:text-gray-400"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all",
                    active ? "bg-violet-500/15 border border-violet-500/20" : ""
                  )}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-semibold leading-none truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
