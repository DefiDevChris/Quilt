// ============================================================================
// OpenCV.js Loader — runs inside the seam-engine worker only.
//
// Loads the vendored `public/opencv/opencv.js` via `importScripts` and waits
// for the WASM runtime to initialize. Memoized so repeated calls resolve
// immediately to the same `cv` namespace.
// ============================================================================

type CvNamespace = unknown;

let loadPromise: Promise<CvNamespace> | null = null;

/**
 * Loads the vendored OpenCV build and returns the global `cv` namespace.
 * Must be called from a worker — relies on `importScripts`.
 */
export function loadOpenCv(): Promise<CvNamespace> {
  if (loadPromise) return loadPromise;
  loadPromise = doLoad().catch((err) => {
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}

async function doLoad(): Promise<CvNamespace> {
  const scope = self as unknown as {
    importScripts?: (url: string) => void;
    cv?: {
      getBuildInformation?: () => string;
      onRuntimeInitialized?: () => void;
    };
  };

  if (!scope.importScripts) {
    throw new Error('OpenCV loader must run in a worker (importScripts unavailable).');
  }

  scope.importScripts('/opencv/opencv.js');

  // OpenCV.js resolves `cv` synchronously but the WASM runtime is async.
  // If `getBuildInformation` is already callable, we're ready.
  if (scope.cv?.getBuildInformation) return scope.cv;

  return new Promise<CvNamespace>((resolve, reject) => {
    if (!scope.cv) {
      reject(new Error('OpenCV loader ran but global `cv` is undefined.'));
      return;
    }
    scope.cv.onRuntimeInitialized = () => resolve(scope.cv as CvNamespace);
  });
}
