"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Eye, LayoutDashboard, PlusCircle, Globe, History, Wallet, RefreshCw, Shield, Zap, UserCircle } from 'lucide-react';
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
  const { isConnected, address } = useAccount();
  const { open } = useAppKit();
  
  // Deteksi apakah pengguna berada di Halaman Awal / Beranda (Landing Page)
  const isLandingPage = pathname === '/';

  // Deteksi apakah pengguna berada di Halaman Pembayaran Mandiri (P2P Checkout)
  const isPaymentPage = pathname.startsWith('/pay/');

  // Fungsi pembantu penanda menu aktif
  const isActive = (href: string) => {
    return pathname === href;
  };

  // Aturan 1: Jika berada di halaman pembayaran (/pay/[sessionId]), sembunyikan seluruh navbar
  if (isPaymentPage) return null;

  return (
    <>
      {/* ── Top Navbar ── */}
      <header className="w-full bg-[#0A0A0F]/80 border-b border-white/5 backdrop-blur-xl fixed top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Sisi Kiri: Logo Premium UniPay */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.4)]">
              <Eye className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Uni<span className="gradient-text">Pay</span>
            </span>
          </Link>

          {/* Sisi Tengah: Desktop Navigation (Hanya muncul jika BUKAN di Landing Page) */}
          {!isLandingPage && (
            <nav className="hidden md:flex items-center bg-white/[0.03] rounded-full p-1 border border-white/5 gap-1 animate-fade-in">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5",
                      active
                        ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(124,58,237,0.15)] font-bold"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn("w-3.5 h-3.5", active ? "text-violet-400" : "")} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Sisi Kanan: Tombol Dompet Kustom Berwarna Ungu (Violet) Premium */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => open()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 border border-violet-500/30 shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all group"
            >
              <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>
                {isConnected && address 
                  ? `${address.slice(0, 6)}...${address.slice(-4)}`
                  : 'Connect Wallet'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar (Hanya muncul jika BUKAN di Landing Page) ── */}
      {!isLandingPage && (
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-[#0A0A0F]/95 backdrop-blur-xl border-t border-white/10 z-50 animate-fade-in">
          <nav className="flex items-center justify-around px-1 py-1.5 max-w-md mx-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 py-1 rounded-2xl min-w-0 flex-1 transition-all text-center",
                    active ? "text-violet-400 font-bold" : "text-gray-500 hover:text-gray-300"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-xl transition-all mx-auto",
                    active ? "bg-violet-600/20 border border-violet-500/30 shadow-[0_0_10px_rgba(124,58,237,0.1)]" : ""
                  )}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-semibold leading-none truncate block mt-0.5">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
