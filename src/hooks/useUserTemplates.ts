import { useState, useEffect } from 'react';
import type { UserTemplate } from '@/types/userTemplate';

/**
 * Fetches the authenticated user's saved templates from /api/templates.
 */
export function useUserTemplates() {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: UserTemplate[] = await res.json();
        if (!cancelled) setTemplates(data);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTemplates();
    return () => { cancelled = true; };
  }, []);

  return { templates, loading, error };
}
