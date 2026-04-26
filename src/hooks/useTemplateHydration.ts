import { useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';

/**
 * When the studio is opened with mode=template and a templateId,
 * this hook fetches the saved template and hydrates the canvas / fabric list.
 */
export function useTemplateHydration() {
  const { mode, templateId, isLocked } = useProjectStore();
  const { setCanvasJson } = useLayoutStore();

  useEffect(() => {
    if (!isLocked || mode !== 'template' || !templateId) return;

    let cancelled = false;

    async function fetchAndHydrate() {
      try {
        const res = await fetch(`/api/templates/${templateId}`);
        if (!res.ok) throw new Error('Failed to fetch template');
        const data = await res.json();
        if (!cancelled && data.canvas_json) {
          setCanvasJson(JSON.parse(data.canvas_json));
        }
      } catch (err) {
        console.error('[useTemplateHydration]', err);
      }
    }

    fetchAndHydrate();
    return () => { cancelled = true; };
  }, [isLocked, mode, templateId, setCanvasJson]);
}
