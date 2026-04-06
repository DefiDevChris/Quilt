'use client';

import { useState, useEffect, useRef } from 'react';

let cachedResult: boolean | null = null;
let fetchPromise: Promise<boolean> | null = null;

/**
 * Hook to check if the fabric shop is enabled via the site settings API.
 * Caches the result in memory so repeated renders don't re-fetch.
 */
export function useShopEnabled(): boolean {
  const [enabled, setEnabled] = useState(() => cachedResult ?? false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    if (cachedResult !== null) return;

    if (!fetchPromise) {
      fetchPromise = fetch('/api/shop/settings')
        .then((res) => (res.ok ? res.json() : { data: { enabled: false } }))
        .then((json) => {
          const result = json.data?.enabled === true;
          cachedResult = result;
          return result;
        })
        .catch(() => {
          cachedResult = false;
          return false;
        });
    }

    fetchPromise.then((result) => {
      if (mounted.current) {
        setEnabled(result);
      }
    });

    return () => {
      mounted.current = false;
    };
  }, []);

  return enabled;
}

/**
 * Invalidate the cached shop status (call after admin toggles shop).
 */
export function invalidateShopCache(): void {
  cachedResult = null;
  fetchPromise = null;
}
