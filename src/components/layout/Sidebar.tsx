"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Shield, Send, Unlock, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Deposit', href: '/deposit', icon: Shield },
  { name: 'Private Send', href: '/send', icon: Send },
  { name: 'Withdraw', href: '/withdraw', icon: Unlock },
  { name: 'Compliance', href: '/compliance', icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 glass-panel border-r border-white/5 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Morphic
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                isActive 
                  ? "bg-primary/10 text-primary-300 border border-primary/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary-400" : "text-gray-500")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-4 rounded-xl bg-black/40 border border-white/5">
        <div className="text-xs text-gray-500 mb-1">Network</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-green-400 font-medium">Arc Mainnet</span>
        </div>
      </div>
    </aside>
  );
}
