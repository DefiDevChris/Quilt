'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import { AppShell, type AppShellVariant } from '@/components/layout/AppShell';
import { MobileShell } from '@/components/mobile/MobileShell';

/**
 * ResponsiveShell picks between AppShell (desktop) and MobileShell (mobile).
 *
 * The `variant` prop is forwarded to AppShell. For "studio" the desktop shell
 * renders without the left nav rail so the studio can own the full viewport.
 * MobileShell is unchanged — mobile studio is already gated separately via
 * `StudioGate`.
 */
export function ResponsiveShell({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: AppShellVariant;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileShell>{children}</MobileShell>;
  }

  return <AppShell variant={variant}>{children}</AppShell>;
}
