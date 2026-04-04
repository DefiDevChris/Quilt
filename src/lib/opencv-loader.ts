/**
 * Lazy-loads and caches the OpenCV.js WASM instance.
 * ~8MB — only imported when the Photo to Pattern flow starts.
 */

import type { OpenCV } from '@/types/opencv-js';

export type { OpenCV };
export type { Mat as OpenCVMat } from '@techstark/opencv-js';

let cvInstance: OpenCV | null = null;
let loadPromise: Promise<OpenCV> | null = null;

export async function loadOpenCv(): Promise<OpenCV> {
  if (cvInstance) return cvInstance;
  if (loadPromise) return loadPromise;

  loadPromise = (async (): Promise<OpenCV> => {
    try {
      const mod = await import('@techstark/opencv-js');
      const cv = mod as unknown as OpenCV;

      await new Promise<void>((resolve, reject) => {
        if (cv.Mat) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('OpenCV.js WASM initialization timed out after 30s'));
        }, 30_000);

        // onRuntimeInitialized is a WASM callback not in the TS types
        (cv as Record<string, unknown>).onRuntimeInitialized = () => {
          clearTimeout(timeout);
          resolve();
        };
      });

      cvInstance = cv;
      return cv;
    } catch (error) {
      loadPromise = null;
      throw error;
    }
  })();

  return loadPromise;
}

export function isOpenCvLoaded(): boolean {
  return cvInstance !== null;
}

/**
 * @deprecated Not currently used. Exists for testing purposes only.
 */
export function resetOpenCv(): void {
  cvInstance = null;
}
