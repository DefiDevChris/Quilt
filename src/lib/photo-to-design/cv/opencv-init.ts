/**
 * Wait for the OpenCV runtime to finish its WASM initialization.
 *
 * @param cv - The cv object exposed by opencv.js.
 * @returns Promise that resolves when `cv.getBuildInformation` is available.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function waitForOpenCVReady(cv: any): Promise<void> {
  if (typeof cv.getBuildInformation === 'function') {
    return;
  }
  await new Promise<void>((resolve) => {
    cv.onRuntimeInitialized = () => resolve();
  });
}
