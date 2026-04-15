// ============================================================================
// Manual-only Playwright config for the Seam Engine sweep (U8).
//
// Kept separate from the main `playwright.config.ts` so the CI pipeline does
// not try to download the SAM2 weights (~150 MB from Hugging Face CDN) or
// demand a WebGPU-capable GPU. Run locally with:
//
//   npm run test:manual:seam-engine
//
// Desktop chromium only — matches the product's "WebGPU or feature
// unavailable" constraint. Launch flags enable WebGPU inside headless-shell
// and grant a larger worker heap so the SAM2 + OpenCV combo fits.
// ============================================================================

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  // Model download + 5-pass pipeline on a warm cache fits well inside 3 min.
  timeout: 5 * 60_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
      args: [
        '--enable-unsafe-webgpu',
        '--enable-features=Vulkan',
        '--use-angle=vulkan',
        '--js-flags=--expose-gc',
      ],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
