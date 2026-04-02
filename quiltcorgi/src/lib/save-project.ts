import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';
import { saveTempProject } from '@/lib/temp-project-storage';

const MAX_SAVE_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 2000;
const RETRY_DELAY_MAX_MS = 30000;

// Track active save operations for cleanup - separate by source
const manualSaveControllers = new Map<string, AbortController>();
const autoSaveControllers = new Map<string, AbortController>();

export type SaveSource = 'manual' | 'auto';

export interface SaveProjectOptions {
  projectId: string | null;
  fabricCanvas: unknown;
  retryCount?: number;
  signal?: AbortSignal;
  source?: SaveSource;
}

/**
 * Calculate exponential backoff delay for retries.
 * Formula: base * 2^retryCount, capped at max delay.
 */
function getRetryDelayMs(retryCount: number): number {
  return Math.min(RETRY_DELAY_BASE_MS * Math.pow(2, retryCount), RETRY_DELAY_MAX_MS);
}

/**
 * Get the appropriate controller map based on save source.
 */
function getControllerMap(source: SaveSource): Map<string, AbortController> {
  return source === 'manual' ? manualSaveControllers : autoSaveControllers;
}

/**
 * Save a project to the server with automatic retry logic.
 *
 * @param options - Save options including projectId, fabricCanvas, and optional abort signal
 * @returns Promise that resolves when save completes or rejects on abort/permanent failure
 *
 * @example
 * // Basic usage (manual save)
 * await saveProject({ projectId: '123', fabricCanvas });
 *
 * @example
 * // Auto-save usage
 * await saveProject({ projectId: '123', fabricCanvas, source: 'auto' });
 *
 * @example
 * // With cancellation support
 * const controller = new AbortController();
 * saveProject({ projectId: '123', fabricCanvas, signal: controller.signal });
 * // Later: cancel any pending retries
 * controller.abort();
 */
export async function saveProject(options: SaveProjectOptions): Promise<void> {
  const { projectId, fabricCanvas, retryCount = 0, signal, source = 'manual' } = options;

  if (!projectId || !fabricCanvas) return;

  const isPro = useAuthStore.getState().isPro;
  const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
  const canvasData = canvas.toJSON();
  const { unitSystem, gridSettings } = useCanvasStore.getState();
  const { fabricPresets, canvasWidth, canvasHeight, worktables, activeWorktableId, version } =
    useProjectStore.getState();

  // Update active worktable with current canvas
  const updatedWorktables = worktables.map((w) =>
    w.id === activeWorktableId ? { ...w, canvasData } : w
  );

  // Free users: save to localStorage only
  if (!isPro) {
    saveTempProject(projectId, {
      canvasData,
      unitSystem,
      gridSettings,
      fabricPresets,
      canvasWidth,
      canvasHeight,
      worktables: updatedWorktables,
    });
    const store = useProjectStore.getState();
    store.setSaveStatus('saved');
    store.setDirty(false);
    store.setLastSavedAt(new Date());
    return;
  }

  // Pro users: save to server
  // Auto-save yields to in-flight manual saves
  if (source === 'auto' && manualSaveControllers.has(projectId)) {
    return;
  }

  const controllerMap = getControllerMap(source);

  // Cancel any existing save of the same type for this project
  const existingController = controllerMap.get(projectId);
  if (existingController) {
    existingController.abort();
  }

  // Manual saves also cancel auto-saves (manual has priority)
  if (source === 'manual') {
    const autoController = autoSaveControllers.get(projectId);
    if (autoController) {
      autoController.abort();
      autoSaveControllers.delete(projectId);
    }
  }

  // Create new abort controller for this save operation
  const controller = new AbortController();
  controllerMap.set(projectId, controller);

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
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvasData,
        worktables: updatedWorktables,
        unitSystem,
        gridSettings,
        fabricPresets,
        canvasWidth,
        canvasHeight,
        version,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Handle version conflicts — project was modified elsewhere
      if (res.status === 409) {
        try {
          const data = await res.json();
          if (data.code === 'VERSION_CONFLICT') {
            store.setSaveStatus('error');
            // TODO: Show conflict resolution UI
            return; // Don't retry
          }
        } catch {
          // Fall through to normal error handling
        }
      }

      // Don't retry Pro-required errors — free users can design but not save
      if (res.status === 403) {
        try {
          const data = await res.json();
          if (data.code === 'PRO_REQUIRED') {
            store.setSaveStatus('error');
            return; // Don't retry
          }
        } catch {
          // If JSON parsing fails, fall through to normal error handling
        }
      }
      throw new Error('Save failed');
    }
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
      const delayMs = getRetryDelayMs(retryCount);
      setTimeout(() => {
        // Only retry if this is still the active controller for this project and source
        if (
          controllerMap.get(projectId) === controller &&
          useProjectStore.getState().saveStatus === 'error' &&
          !controller.signal.aborted
        ) {
          saveProject({
            projectId,
            fabricCanvas,
            retryCount: retryCount + 1,
            signal: controller.signal,
            source,
          });
        }
      }, delayMs);
    }
  } finally {
    // Clean up controller if it's still the active one for this project and source
    if (controllerMap.get(projectId) === controller) {
      controllerMap.delete(projectId);
    }
  }
}

/**
 * Cancel any pending save operation for a project.
 *
 * @param projectId - The project ID to cancel saves for
 */
export function cancelSaveProject(projectId: string): void {
  const manualController = manualSaveControllers.get(projectId);
  if (manualController) {
    manualController.abort();
    manualSaveControllers.delete(projectId);
  }
  const autoController = autoSaveControllers.get(projectId);
  if (autoController) {
    autoController.abort();
    autoSaveControllers.delete(projectId);
  }
}

/**
 * Cancel all pending save operations.
 * Useful when navigating away from the studio.
 */
export function cancelAllSaveProjects(): void {
  for (const [projectId, controller] of manualSaveControllers) {
    controller.abort();
    manualSaveControllers.delete(projectId);
  }
  for (const [projectId, controller] of autoSaveControllers) {
    controller.abort();
    autoSaveControllers.delete(projectId);
  }
}
