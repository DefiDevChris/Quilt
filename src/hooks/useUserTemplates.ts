'use client';

import { useCallback, useEffect, useState } from 'react';
import type { UserTemplate } from '@/types/userTemplate';

interface UseUserTemplatesResult {
  templates: UserTemplate[];
  loading: boolean;
  error: string | null;
  /** Manually re-fetch (useful after a save/delete). */
  refetch: () => Promise<void>;
}

/**
 * useUserTemplates
 *
 * Fetches the authenticated user's saved templates from
 * `GET /api/templates?scope=mine`. Mirrors the pattern used by the
 * blocks library: lazy load on mount, refetch on demand.
 *
 * Used by the My Templates tab in `SelectionShell`.
 */
export function useUserTemplates(): UseUserTemplatesResult {
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates?scope=mine');
      const body = (await res.json()) as {
        success: boolean;
        data?: { templates: UserTemplate[] };
        error?: string;
      };
      if (!res.ok || !body.success) {
        throw new Error(body.error ?? 'Failed to load templates');
      }
      setTemplates(body.data?.templates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  return { templates, loading, error, refetch: fetchTemplates };
}
