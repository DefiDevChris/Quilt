import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

const MAX_SAVE_RETRIES = 3;
const RETRY_DELAY_MS = 10_000;

// Track active save operations for cleanup
const activeSaveControllers = new Map<string, AbortController>();

export interface SaveProjectOptions {
  projectId: string | null;
  fabricCanvas: unknown;
  retryCount?: number;
  signal?: AbortSignal;
}

/**
 * Save a project to the server with automatic retry logic.
 *
 * @param options - Save options including projectId, fabricCanvas, and optional abort signal
 * @returns Promise that resolves when save completes or rejects on abort/permanent failure
 *
 * @example
 * // Basic usage
 * await saveProject({ projectId: '123', fabricCanvas });
 *
 * @example
 * // With cancellation support
 * const controller = new AbortController();
 * saveProject({ projectId: '123', fabricCanvas, signal: controller.signal });
 * // Later: cancel any pending retries
 * controller.abort();
 */
export async function saveProject(options: SaveProjectOptions): Promise<void> {
  const { projectId, fabricCanvas, retryCount = 0, signal } = options;

  if (!projectId || !fabricCanvas) return;

  // Cancel any existing save for this project
  const existingController = activeSaveControllers.get(projectId);
  if (existingController) {
    existingController.abort();
  }

  // Create new abort controller for this save operation
  const controller = new AbortController();
  activeSaveControllers.set(projectId, controller);

  // If caller provided a signal, connect it to our controller
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
    if (signal.aborted) {
      controller.abort();
    }
  }

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
      signal: controller.signal,
    });

    if (!res.ok) throw new Error('Save failed');
    store.setSaveStatus('saved');
    store.setDirty(false);
    store.setLastSavedAt(new Date());
  } catch (error) {
    // Don't update status if aborted
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    store.setSaveStatus('error');

    if (retryCount < MAX_SAVE_RETRIES && !controller.signal.aborted) {
      setTimeout(() => {
        // Only retry if this is still the active controller for this project
        if (activeSaveControllers.get(projectId) === controller &&
            useProjectStore.getState().saveStatus === 'error' &&
            !controller.signal.aborted) {
          saveProject({ projectId, fabricCanvas, retryCount: retryCount + 1, signal: controller.signal });
        }
      }, RETRY_DELAY_MS);
    }
  } finally {
    // Clean up controller if it's still the active one for this project
    if (activeSaveControllers.get(projectId) === controller) {
      activeSaveControllers.delete(projectId);
    }
  }
}

/**
 * Cancel any pending save operation for a project.
 *
 * @param projectId - The project ID to cancel saves for
 */
export function cancelSaveProject(projectId: string): void {
  const controller = activeSaveControllers.get(projectId);
  if (controller) {
    controller.abort();
    activeSaveControllers.delete(projectId);
  }
}

/**
 * Cancel all pending save operations.
 * Useful when navigating away from the studio.
 */
export function cancelAllSaveProjects(): void {
  for (const [projectId, controller] of activeSaveControllers) {
    controller.abort();
    activeSaveControllers.delete(projectId);
  }
}
