"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isWidgetOrPayment = pathname.startsWith('/pay/') || 
                            pathname.startsWith('/checkout/') || 
                            pathname.startsWith('/invoice/') || 
                            pathname.startsWith('/subscribe/') || 
                            pathname.startsWith('/donate/') || 
                            pathname.includes('widget');

  return (
    <main className={cn(
      "flex-1 relative z-10 w-full",
      isLandingPage || isWidgetOrPayment ? "" : "pt-24 px-4 pb-28 md:pb-16 max-w-6xl mx-auto"
    )}>
      {children}
    </main>
  );
}
