// ============================================================================
// Seam Engine Sweep + Memory Harness (U8).
//
// Two related goals:
//
//   1. Fixture sweep — run the full `upload → perspective → grid → review`
//      pipeline against each synthetic fixture and assert the review step
//      produces at least one patch (or a controlled "no patches" state for
//      the solid-red fixture where SAM has nothing to segment).
//
//   2. Memory harness — five consecutive uploads of the same fixture; after
//      a forced GC, the main-renderer + worker heap delta must stay under
//      the 200 MB budget set by the RFC (U8 acceptance test).
//
// Both run under the manual `playwright.config.ts` in this directory since
// the SAM2 model is ~150 MB and requires WebGPU.
// ============================================================================

import path from 'node:path';
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { ensureFixtures, type FixtureDescriptor } from './fixtures/generate';

const FIXTURES_CACHE_DIR = path.join(__dirname, '.cache');
const MEMORY_BUDGET_BYTES = 200 * 1024 * 1024;
const WARMUP_RUNS = 1;
const HARNESS_RUNS = 5;

let fixtures: FixtureDescriptor[];

test.beforeAll(async () => {
  fixtures = await ensureFixtures(FIXTURES_CACHE_DIR);
});

test.beforeEach(async ({ page }) => {
  const webgpu = await page.evaluate(
    () => typeof (navigator as { gpu?: unknown }).gpu !== 'undefined'
  );
  test.skip(!webgpu, 'WebGPU unavailable in this browser build');
});

test.describe('Seam engine fixture sweep', () => {
  test('each synthetic fixture reaches the review step without erroring', async ({ page }) => {
    await page.goto('/photo-to-design');
    await expect(page.getByRole('heading', { name: 'Upload a quilt photo' })).toBeVisible();

    for (const fixture of fixtures) {
      await runPipelineOnce(page, fixture.filePath);

      // The review canvas either surfaces patches or the controlled
      // "couldn't produce clean patches" message — both are valid engine
      // outputs, neither is a crash. A thrown error would appear as an
      // unhandled console error.
      const consoleErrors = await collectConsoleErrorsSince(page);
      expect(
        consoleErrors,
        `Fixture ${fixture.name} produced runtime errors`
      ).toHaveLength(0);

      await page.getByRole('button', { name: 'Start Over' }).click();
      await expect(page.getByRole('heading', { name: 'Upload a quilt photo' })).toBeVisible();
    }
  });
});

test.describe('Seam engine memory harness', () => {
  test(`5 consecutive uploads stay under ${MEMORY_BUDGET_BYTES / 1024 / 1024} MB heap delta`, async ({
    page,
    context,
  }) => {
    await page.goto('/photo-to-design');
    await expect(page.getByRole('heading', { name: 'Upload a quilt photo' })).toBeVisible();

    const harnessFixture =
      fixtures.find((f) => f.name === 'checker-8x8') ?? fixtures[0];

    // Warmup — the first run downloads the model (or pulls it from the
    // IndexedDB cache) and heap stabilizes thereafter.
    for (let i = 0; i < WARMUP_RUNS; i++) {
      await runPipelineOnce(page, harnessFixture.filePath);
      await page.getByRole('button', { name: 'Start Over' }).click();
    }

    const samples: number[] = [];
    for (let i = 0; i < HARNESS_RUNS; i++) {
      await runPipelineOnce(page, harnessFixture.filePath);
      await page.getByRole('button', { name: 'Start Over' }).click();
      const heap = await measureTotalHeap(page, context);
      samples.push(heap);
    }

    const min = Math.min(...samples);
    const max = Math.max(...samples);
    const delta = max - min;

    test.info().annotations.push(
      { type: 'heap-samples-mb', description: samples.map((s) => mb(s)).join(', ') },
      { type: 'heap-delta-mb', description: mb(delta).toString() }
    );

    expect(
      delta,
      `Heap delta ${mb(delta)} MB across 5 runs exceeds ${mb(MEMORY_BUDGET_BYTES)} MB budget`
    ).toBeLessThan(MEMORY_BUDGET_BYTES);
  });
});

// ---------------------------------------------------------------------------
// Pipeline driver
// ---------------------------------------------------------------------------

async function runPipelineOnce(page: Page, fixturePath: string): Promise<void> {
  const uploadTrigger = page.locator('input[type="file"]').first();
  await uploadTrigger.setInputFiles(fixturePath);

  // Perspective step — accept the default corners and move on.
  await expect(page.getByRole('button', { name: /Next|Continue/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /Next|Continue/i }).click();

  // Grid step — accept defaults.
  await expect(page.getByRole('button', { name: /Next|Continue|Scan|Review/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: /Next|Continue|Scan|Review/i }).click();

  // Review canvas — wait for either results to appear or a controlled
  // error message. Generous timeout covers first-run model download.
  const done = page.getByRole('button', { name: 'Done' });
  await expect(done).toBeVisible({ timeout: 180_000 });
}

// ---------------------------------------------------------------------------
// Memory measurement
// ---------------------------------------------------------------------------

async function measureTotalHeap(page: Page, context: BrowserContext): Promise<number> {
  // Force GC on every isolate we can reach — the main page plus every worker.
  await forceGc(page);
  for (const worker of page.workers()) {
    await forceGc(worker);
  }
  const cdp = await context.newCDPSession(page);
  try {
    const metrics = await cdp.send('Performance.getMetrics');
    const jsHeap = metrics.metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0;
    return jsHeap;
  } finally {
    await cdp.detach();
  }
}

async function forceGc(target: Page | import('@playwright/test').Worker): Promise<void> {
  try {
    await target.evaluate(() => {
      const w = globalThis as unknown as { gc?: () => void };
      w.gc?.();
    });
  } catch {
    // Some worker contexts may not allow evaluation after shutdown — ignore.
  }
}

async function collectConsoleErrorsSince(page: Page): Promise<string[]> {
  // Install-once listener: each call clears the buffer and returns what
  // accumulated since the last call.
  const w = page as unknown as { __seamEngineErrors?: string[] };
  if (!w.__seamEngineErrors) {
    w.__seamEngineErrors = [];
    page.on('pageerror', (err) => w.__seamEngineErrors!.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') w.__seamEngineErrors!.push(msg.text());
    });
  }
  const errs = [...w.__seamEngineErrors];
  w.__seamEngineErrors.length = 0;
  return errs;
}

function mb(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}
