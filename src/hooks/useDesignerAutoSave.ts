'use client';

import { useEffect, useRef } from 'react';
import { useDesignerStore } from '@/stores/designerStore';
import { useAuthStore } from '@/stores/authStore';
import { AUTO_SAVE_INTERVAL_MS } from '@/lib/constants';

const MAX_SAVE_RETRIES = 3;
const RETRY_DELAY_BASE_MS = 2000;
const RETRY_DELAY_MAX_MS = 30000;

interface DesignerAutoSaveOptions {
  fabricCanvas: unknown;
  projectId: string | null;
}

/** Current project version, updated after each successful save. */
let currentVersion = 1;

/**
 * Calculate exponential backoff delay for retries.
 */
function getRetryDelayMs(retryCount: number): number {
  return Math.min(RETRY_DELAY_BASE_MS * Math.pow(2, retryCount), RETRY_DELAY_MAX_MS);
}

/**
 * Generate a thumbnail from the canvas and upload to S3.
 * Returns the thumbnail URL or null on failure.
 */
async function generateAndUploadThumbnail(fabricCanvas: unknown): Promise<string | null> {
  try {
    const canvas = fabricCanvas as {
      toDataURL: (opts?: Record<string, unknown>) => string;
    };
    const dataUrl = canvas.toDataURL({ format: 'jpeg', quality: 0.8, multiplier: 0.3 });

    // Convert data URL to blob
    const res = await fetch(dataUrl);
    const blob = await res.blob();

    // Get presigned URL and upload
    const presignedRes = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `designer-thumb-${Date.now()}.jpg`,
        contentType: 'image/jpeg',
        purpose: 'thumbnail',
      }),
    });

    if (!presignedRes.ok) return null;

    const { uploadUrl, fileUrl } = await presignedRes.json();

    await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    return fileUrl;
  } catch {
    return null;
  }
}

/**
 * Save the designer project to the server.
 */
async function saveDesignerProject(
  projectId: string,
  fabricCanvas: unknown,
  version: number,
  signal?: AbortSignal
): Promise<{ ok: boolean; status: number; data?: unknown }> {
  const canvas = fabricCanvas as { toJSON: () => Record<string, unknown> };
  const canvasData = canvas.toJSON();

  // Embed designer store state into canvasData for reconstruction on reload
  const designerState = useDesignerStore.getState();
  (canvasData as Record<string, unknown>).__designerState = {
    rows: designerState.rows,
    cols: designerState.cols,
    blockSize: designerState.blockSize,
    sashingWidth: designerState.sashingWidth,
    sashingFabricId: designerState.sashingFabricId,
    sashingFabricUrl: designerState.sashingFabricUrl,
    borders: designerState.borders,
    realisticMode: designerState.realisticMode,
  };

  // Generate thumbnail
  const thumbnailUrl = await generateAndUploadThumbnail(fabricCanvas);

  const res = await fetch(`/api/designer/projects/${projectId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      canvasData,
      thumbnailUrl,
      version,
    }),
    signal,
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Auto-save hook for the Simple Quilt Designer.
 *
 * Saves every 30 seconds if dirty and the user is Pro.
 * Captures canvas JSON + designerStore config.
 * Generates thumbnail via canvas.toDataURL.
 * Retries on failure with exponential backoff.
 * Preserves in-memory state on save failure.
 */
export function useDesignerAutoSave({ fabricCanvas, projectId }: DesignerAutoSaveOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef(0);
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!fabricCanvas || !projectId) return;

    // Reset version when project changes
    currentVersion = 1;

    const { isPro } = useAuthStore.getState();
    if (!isPro) return;

    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    const timer = setInterval(() => {
      if (isSavingRef.current) return;

      // Check dirty state from designerStore
      if (!useDesignerStore.getState().isDirty) return;

      isSavingRef.current = true;
      const currentController = abortControllerRef.current;

      saveDesignerProject(
        projectId,
        fabricCanvas,
        currentVersion,
        currentController?.signal
      )
        .then((result) => {
          if (result.ok) {
            retryCountRef.current = 0;
            // Update version from server response for next save
            if (result.data && typeof result.data === 'object' && 'version' in result.data) {
              currentVersion = (result.data as { version: number }).version;
            } else {
              currentVersion++;
            }
            // Dispatch success event
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('quiltcorgi:designer-save-success', {
                  detail: { projectId },
                })
              );
            }
          } else if (result.status === 403) {
            // Pro required — stop retrying
            retryCountRef.current = 0;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('quiltcorgi:designer-save-error', {
                  detail: {
                    message:
                      'Saving requires a Pro subscription. Upgrade to Pro to save your work.',
                    code: 'PRO_REQUIRED',
                  },
                })
              );
            }
          } else {
            throw new Error('Save failed');
          }
        })
        .catch((err) => {
          if (err instanceof Error && err.name === 'AbortError') return;

          const retryCount = retryCountRef.current;
          if (retryCount < MAX_SAVE_RETRIES) {
            const delayMs = getRetryDelayMs(retryCount);
            retryCountRef.current = retryCount + 1;

            setTimeout(() => {
              isSavingRef.current = false;
              // Trigger another save cycle on next interval
            }, delayMs);
          } else {
            // Max retries exhausted — preserve in-memory state
            retryCountRef.current = 0;
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('quiltcorgi:designer-save-error', {
                  detail: {
                    message:
                      err instanceof Error
                        ? err.message
                        : 'Auto-save failed. Your changes may not be saved.',
                  },
                })
              );
            }
          }
        })
        .finally(() => {
          isSavingRef.current = false;
        });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      abortControllerRef.current?.abort();
      isSavingRef.current = false;
    };
  }, [fabricCanvas, projectId]);
}
