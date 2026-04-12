'use client';

import { useState, useLayoutEffect } from 'react';
import { BREAKPOINTS } from '@/lib/design-system';

const MOBILE_MEDIA_QUERY = `(max-width: ${BREAKPOINTS.mobile - 1}px)`;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useLayoutEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mql.matches);

    function onChange(e: MediaQueryListEvent | { matches: boolean }) {
      setIsMobile(e.matches);
    }

    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
