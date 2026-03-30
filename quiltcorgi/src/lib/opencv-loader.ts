/**
 * Lazy-loads and caches the OpenCV.js WASM instance.
 * ~8MB — only imported when the Photo to Pattern flow starts.
 */

import type { OpenCV } from '@/types/opencv-js';

let cvInstance: OpenCV | null = null;

export async function loadOpenCv(): Promise<OpenCV> {
  if (cvInstance) return cvInstance;

  const cv = await import('@techstark/opencv-js') as unknown as OpenCV;

  await new Promise<void>((resolve, reject) => {
    if (cv.Mat) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('OpenCV.js WASM initialization timed out after 30s'));
    }, 30_000);

    cv.onRuntimeInitialized = () => {
      clearTimeout(timeout);
      resolve();
    };
  });

  cvInstance = cv;
  return cv;
}

export function isOpenCvLoaded(): boolean {
  return cvInstance !== null;
}

export function resetOpenCv(): void {
  cvInstance = null;
}
