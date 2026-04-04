'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { MobileShell } from '@/components/mobile/MobileShell';

interface ResponsivePublicShellProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export function ResponsivePublicShell({
  children,
  maxWidth = 'max-w-3xl',
}: ResponsivePublicShellProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileShell>{children}</MobileShell>;
  }

  return (
    <>
      <PublicNav />
      <main className={`${maxWidth} mx-auto px-6 py-8`}>{children}</main>
      <Footer />
    </>
  );
}
