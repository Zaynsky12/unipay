"use client";

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <main className={cn(
      "flex-1 relative z-10",
      isLandingPage ? "" : "pt-24 px-4 pb-28 md:pb-12 flex items-start justify-center"
    )}>
      <div className={cn(
        "w-full",
        isLandingPage ? "" : "max-w-[480px]"
      )}>
        {children}
      </div>
    </main>
  );
}
