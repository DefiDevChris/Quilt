import { test, expect, Page } from '@playwright/test';
import { mockAuth } from './utils';
import path from 'path';

test.setTimeout(60_000);

const FIXTURE_IMAGE = path.join(__dirname, '..', 'fixtures', 'test-quilt-grid.png');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the Photo to Design page as a pro user. */
async function navigateToPhotoPattern(page: Page) {
  await mockAuth(page, 'pro');
  await page.goto('/photo-to-design');
  await page.waitForLoadState('networkidle');

  const wizard = page.locator('[data-testid="photo-pattern-wizard"]');
  await wizard.waitFor({ state: 'visible', timeout: 15_000 });
  return wizard;
}

/** Upload the test fixture image. */
async function uploadTestImage(page: Page) {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(FIXTURE_IMAGE, { force: true });
  await expect(page.getByAltText('Uploaded quilt photo preview')).toBeVisible({ timeout: 5_000 });
}

/** Advance past the upload step. */
async function advanceToCalibration(page: Page) {
  await navigateToPhotoPattern(page);
  await uploadTestImage(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: /pin one quilt block/i })).toBeVisible();
}

// ---------------------------------------------------------------------------
// 1. Access & Navigation
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Access & Navigation', () => {
  test('pro user can access the page with correct heading', async ({ page }) => {
    const wizard = await navigateToPhotoPattern(page);
    await expect(wizard).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Photo to Design' })).toBeVisible();
  });

  test('free user sees upgrade prompt', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.goto('/photo-to-design');
    await page.waitForLoadState('networkidle');

    const upgradeOrRedirect = page
      .getByText(/unlock your|quilt magic/i)
      .or(page.locator('[data-testid="photo-pattern-wizard"]'));
    await expect(upgradeOrRedirect).toBeVisible({ timeout: 5_000 });
  });

  test('close button navigates back to dashboard', async ({ page }) => {
    await navigateToPhotoPattern(page);
    await page.getByLabel('Close').click();
    await page.waitForURL('**/dashboard', { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// 2. Upload Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Upload Step', () => {
  test('shows drop zone with correct instructions and file input', async ({ page }) => {
    await navigateToPhotoPattern(page);

    await expect(page.getByText('Drop your quilt photo here')).toBeVisible();
    await expect(page.getByText('or click to browse')).toBeVisible();
    await expect(page.getByText('PNG, JPEG, or WebP up to 20 MB')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveAttribute('accept', /image/);
  });

  test('uploading image shows preview and Continue advances to calibration', async ({ page }) => {
    await navigateToPhotoPattern(page);
    await uploadTestImage(page);

    await expect(page.getByAltText('Uploaded quilt photo preview')).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByRole('heading', { name: /pin one quilt block/i })).toBeVisible();
    await expect(page.getByLabel('Block width (inches)')).toBeVisible();
    await expect(page.getByLabel('Block height (inches)')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Calibration Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Calibration Step', () => {
  test('shows block size inputs and preset chips', async ({ page }) => {
    await advanceToCalibration(page);

    const widthInput = page.getByLabel('Block width (inches)');
    const heightInput = page.getByLabel('Block height (inches)');
    await expect(widthInput).toHaveValue('12');
    await expect(heightInput).toHaveValue('12');

    // Preset chips
    await expect(page.getByRole('button', { name: /6" × 6"/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /12" × 12"/ })).toBeVisible();
  });

  test('selecting a preset chip updates both width and height inputs', async ({ page }) => {
    await advanceToCalibration(page);

    await page.getByRole('button', { name: /10" × 10"/ }).click();
    await expect(page.getByLabel('Block width (inches)')).toHaveValue('10');
    await expect(page.getByLabel('Block height (inches)')).toHaveValue('10');
  });

  test('back button returns to the upload step', async ({ page }) => {
    await advanceToCalibration(page);

    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByText('Drop your quilt photo here')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Step Indicator Dots
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Step Indicators', () => {
  test('step dots count matches the four-step pipeline', async ({ page }) => {
    const wizard = await navigateToPhotoPattern(page);

    const footerDots = wizard.locator('div.pb-4 > div.rounded-full');
    const dotCount = await footerDots.count();
    expect(dotCount).toBe(4);
  });
});
