"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Eye, LayoutDashboard, PlusCircle, History, Wallet, UserCircle, ArrowRight } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Create Payment', href: '/dashboard/create', icon: PlusCircle },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Account', href: '/dashboard/account', icon: UserCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();

  const isLandingPage = pathname === '/';
  const isPaymentPage = pathname.startsWith('/pay/') || 
                        pathname.startsWith('/checkout/') || 
                        pathname.startsWith('/invoice/') || 
                        pathname.startsWith('/subscribe/') || 
                        pathname.startsWith('/tip/');

  const isActive = (href: string) => pathname === href;

  if (isPaymentPage) return null;
  if (!isLandingPage && !isConnected) return null;

  return (
    <>
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white/30 border-b border-gray-200/50 backdrop-blur-xl fixed top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo — Caldera style: chunky pill badge */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-2xl bg-[#fc5000] flex items-center justify-center shadow-[0_0_18px_rgba(252,80,0,0.45)] group-hover:shadow-[0_0_24px_rgba(252,80,0,0.65)] transition-all">
              <Eye className="w-4.5 h-4.5 text-slate-900" fill="currentColor" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-dm-sans)' }}>
              Lumi<span className="text-[#fc5000]">Pay</span>
            </span>
          </Link>

          {/* Desktop Nav — Pill container, Caldera block-link style */}
          {!isLandingPage && isConnected && (
            <nav className="hidden md:flex items-center bg-white/80 rounded-full p-1 border border-gray-200 gap-0.5 animate-fade-in">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1.5",
                      active
                        ? "bg-gray-100 text-slate-900 border border-gray-300"
                        : "text-gray-500 hover:text-slate-900 hover:bg-white"
                    )}
                  >
                    <item.icon className={cn("w-3.5 h-3.5", active ? "text-slate-900" : "")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Wallet Button / Launch App Button */}
          <div className="flex items-center gap-2 shrink-0">
            {isLandingPage ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-white text-xs sm:text-sm font-black rounded-full flex items-center gap-1.5 border transition-all group bg-[#fc5000] hover:bg-[#e04500] border-[#fc5000]/30 shadow-[0_0_20px_rgba(252,80,0,0.35)] hover:shadow-[0_0_28px_rgba(252,80,0,0.50)]"
              >
                <span>LAUNCH APP</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <button
                onClick={() => open()}
                className={cn(
                  "px-5 py-2.5 text-white text-xs sm:text-sm font-black rounded-full flex items-center gap-2 border transition-all group",
                  "bg-[#fc5000] hover:bg-[#e04500] border-[#fc5000]/30 shadow-[0_0_20px_rgba(252,80,0,0.35)] hover:shadow-[0_0_28px_rgba(252,80,0,0.50)]"
                )}
              >
                <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>
                  {isConnected && address
                    ? `${address.slice(0, 6)}...${address.slice(-4)}`
                    : 'Connect Wallet'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav — Caldera chunky pill icons */}
      {!isLandingPage && isConnected && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/30 backdrop-blur-xl border-t border-gray-200/50 z-50 animate-fade-in">
          <nav className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-1 rounded-2xl min-w-0 flex-1 transition-all text-center",
                    active ? "text-slate-900" : "text-gray-500 hover:text-gray-600"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-2xl transition-all mx-auto",
                    active
                      ? "bg-[#fc5000] shadow-[0_0_14px_rgba(252,80,0,0.45)]"
                      : "hover:bg-white"
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold leading-none truncate block mt-0.5">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
