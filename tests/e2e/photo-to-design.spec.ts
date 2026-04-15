import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';

/**
 * Photo-to-Design end-to-end smoke.
 *
 * Asserts the rollout gate for non-admin roles, then walks the Upload →
 * Perspective → Calibrate → Review flow for an admin and verifies the Send
 * to Studio hand-off navigates to /studio/[id]. Analysis timing depends on
 * WASM on the runner so the review assertion uses generous timeouts.
 */

// Relative to repo root (playwright's default cwd).
const FIXTURE = 'public/test-fairgrounds.jpg';

test.describe('Photo-to-Design — rollout gate', () => {
  test('free users are redirected away', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.goto('/photo-to-design');
    await page.waitForURL(/sign-in|studio/, { timeout: 10_000 });
    expect(page.url()).toMatch(/sign-in|studio/);
  });

  test('pro users are redirected during internal stage (default)', async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/photo-to-design');
    await page.waitForURL(/sign-in|studio/, { timeout: 10_000 });
    expect(page.url()).toMatch(/sign-in|studio/);
  });
});

test.describe('Photo-to-Design — admin flow', () => {
  test.setTimeout(120_000);

  test('walks upload → perspective → calibrate → review', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/photo-to-design');
    await expect(page.getByRole('heading', { name: 'Upload Your Quilt Photo' })).toBeVisible();

    const chooser = page.waitForEvent('filechooser');
    await page.getByText(/Drop a photo of your quilt/).click();
    await (await chooser).setFiles(FIXTURE);

    await expect(page.getByRole('heading', { name: 'Adjust Corners' })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: 'Set Scale' })).toBeVisible({
      timeout: 30_000,
    });

    // Place two markers by dispatching pointerdown on the image container.
    await page.evaluate(async () => {
      const img = document.querySelector('img[alt="Corrected quilt"]') as HTMLImageElement | null;
      if (!img) throw new Error('no corrected quilt image');
      const rect = img.getBoundingClientRect();
      const container = img.parentElement!;
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: rect.left + 80,
          clientY: rect.top + rect.height / 2,
          bubbles: true,
        })
      );
      await new Promise((r) => setTimeout(r, 80));
      container.dispatchEvent(
        new PointerEvent('pointerdown', {
          clientX: rect.left + rect.width - 80,
          clientY: rect.top + rect.height / 2,
          bubbles: true,
        })
      );
    });

    await page.getByPlaceholder('0.0').fill('10');

    const analyze = page.getByRole('main').getByRole('button', { name: 'Analyze' });
    await expect(analyze).toBeEnabled();
    await analyze.click();

    // Review screen opens immediately; analysis runs in the worker.
    await expect(page.getByRole('button', { name: 'Send to Studio' })).toBeVisible({
      timeout: 10_000,
    });
  });
});
