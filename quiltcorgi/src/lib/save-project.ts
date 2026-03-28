import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

const MAX_SAVE_RETRIES = 3;

export async function saveProject(
  projectId: string | null,
  fabricCanvas: unknown,
  retryCount = 0
): Promise<void> {
  if (!projectId || !fabricCanvas) return;
  const store = useProjectStore.getState();
  store.setSaveStatus('saving');
  try {
    const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
    const canvasData = canvas.toJSON();
    const { unitSystem, gridSettings } = useCanvasStore.getState();

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData, unitSystem, gridSettings }),
    });

    if (!res.ok) throw new Error('Save failed');
    store.setSaveStatus('saved');
    store.setDirty(false);
    store.setLastSavedAt(new Date());
  } catch {
    store.setSaveStatus('error');
    if (retryCount < MAX_SAVE_RETRIES) {
      setTimeout(() => {
        if (useProjectStore.getState().saveStatus === 'error') {
          saveProject(projectId, fabricCanvas, retryCount + 1);
        }
      }, 10_000);
    }
  }
}
