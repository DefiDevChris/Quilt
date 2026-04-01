'use client';

import { useState, useLayoutEffect } from 'react';

const MOBILE_BREAKPOINT = '(max-width: 767px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(MOBILE_BREAKPOINT).matches;
  });

  useLayoutEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT);
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
