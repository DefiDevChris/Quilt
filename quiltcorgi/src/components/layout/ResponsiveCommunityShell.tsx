'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { CommunityNav } from '@/components/community/CommunityNav';
import { MobileShell } from '@/components/mobile/MobileShell';

export function ResponsiveCommunityShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileShell>{children}</MobileShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <CommunityNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
