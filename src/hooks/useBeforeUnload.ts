'use client';

import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';

export function useBeforeUnload() {
  const isDirty = useProjectStore((s) => s.isDirty);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
}
