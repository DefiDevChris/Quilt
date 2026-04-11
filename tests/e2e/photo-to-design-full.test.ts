import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';
import * as path from 'path';

/**
 * Smoke test for the full perspective-first photo-to-design happy path.
 *
 * Coverage is intentionally shallow — the step-by-step assertions live in
 * `photo-layout.spec.ts`. This file just verifies the wizard survives an
 * upload + Continue click without throwing, which is the regression signal
 * that matters when refactoring the pipeline.
 */
test.describe('Photo-to-Design Full Happy Path', () => {
  test('upload → calibrate transition survives a real image', async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/photo-to-design');
    await page.waitForLoadState('networkidle');

    const wizard = page.locator('[data-testid="photo-pattern-wizard"]');
    await wizard.waitFor({ state: 'visible', timeout: 15_000 });

    const fixturePath = path.resolve(__dirname, '../fixtures/test-quilt-grid.png');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(fixturePath, { force: true });

    await expect(page.getByAltText('Uploaded quilt photo preview')).toBeVisible({
      timeout: 5_000,
    });

    await page.getByRole('button', { name: 'Continue' }).click();

    // Calibration step landed — block size inputs are the tell.
    await expect(page.getByLabel('Block width (inches)')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByLabel('Block height (inches)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flatten block' })).toBeVisible();
  });
});
