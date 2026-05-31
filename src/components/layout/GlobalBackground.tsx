"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function GlobalBackground() {
  const pathname = usePathname();
  const isPaymentPage = pathname.startsWith('/pay/') || 
                        pathname.startsWith('/checkout/') || 
                        pathname.startsWith('/invoice/') || 
                        pathname.startsWith('/subscribe/') || 
                        pathname.startsWith('/donate/');

  useEffect(() => {
    if (isPaymentPage) {
      document.body.style.backgroundColor = '#050508'; // Dark for payment
    } else {
      document.body.style.backgroundColor = '#FEF7ED'; // Cream for main
    }
  }, [isPaymentPage]);

  if (isPaymentPage) return null;

  return <div className="glow-bg pixel-grid" />;
}
