'use client';

import { useState, useLayoutEffect } from 'react';
import { AppShell, type AppShellVariant } from '@/components/layout/AppShell';
import { MobileGate } from '@/components/mobile/MobileGate';

const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

/**
 * ResponsiveShell shows a simple mobile landing page on small screens
 * and the full AppShell on desktop.
 */
export function ResponsiveShell({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: AppShellVariant;
}) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useLayoutEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    setIsMobile(mql.matches);

    function onChange(e: MediaQueryListEvent | { matches: boolean }) {
      setIsMobile(e.matches);
    }

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  if (isMobile) {
    return <MobileGate />;
  }

  return <AppShell variant={variant}>{children}</AppShell>;
}
