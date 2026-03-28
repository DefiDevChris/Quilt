'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { AppShell } from '@/components/layout/AppShell';
import { MobileShell } from '@/components/mobile/MobileShell';

export function ResponsiveShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileShell>{children}</MobileShell>;
  }

  return <AppShell>{children}</AppShell>;
}
