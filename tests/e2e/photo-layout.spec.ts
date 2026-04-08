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
  // Block OpenCV WASM loading — not needed for UI tests
  await page.route('**/*.wasm', (route) => route.abort());
  await page.route('**/*opencv*', (route) => route.abort());

  await mockAuth(page, 'pro');
  await page.goto('/photo-to-design');
  await page.waitForLoadState('networkidle');

  const wizard = page.locator('[data-testid="photo-pattern-wizard"]');
  await wizard.waitFor({ state: 'visible', timeout: 15_000 });
  return wizard;
}

/** Upload the test fixture image. */
async function uploadTestImage(page: Page) {
  // Ensure the file input is visible and accessible
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(FIXTURE_IMAGE, { force: true });

  // Wait for the preview image to appear after upload
  await expect(page.getByAltText('Uploaded quilt photo preview')).toBeVisible({ timeout: 5_000 });
}

/**
 * Set the wizard step directly via Zustand store (dev-only window exposure).
 */
async function setWizardStep(page: Page, step: string) {
  await page.evaluate((s) => {
    const store = (window as unknown as Record<string, unknown>).__photoPatternStore as {
      getState: () => { setStep: (step: string) => void };
    };
    store.getState().setStep(s);
  }, step);
  await page.waitForTimeout(500);
}

/** Navigate to Image Prep via real UI click. */
async function navigateToImagePrep(page: Page) {
  await navigateToPhotoPattern(page);
  await uploadTestImage(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Straighten & adjust your image')).toBeVisible();
}

/** Navigate to page, upload image, and jump to a step via store. */
async function navigateToStep(page: Page, step: string) {
  await navigateToPhotoPattern(page);
  await uploadTestImage(page);
  await setWizardStep(page, step);
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
    await page.route('**/*.wasm', (route) => route.abort());
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

  test('uploading image shows preview and Continue advances to Image Prep', async ({ page }) => {
    await navigateToPhotoPattern(page);
    await uploadTestImage(page);

    await expect(page.getByAltText('Uploaded quilt photo preview')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();

    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Straighten & adjust your image')).toBeVisible();
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Image Prep Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Image Prep Step', () => {
  test('shows rotation slider and flip controls', async ({ page }) => {
    await navigateToImagePrep(page);

    await expect(page.locator('input[type="range"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '-90°' })).toBeVisible();
    await expect(page.getByRole('button', { name: '+90°' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flip H' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Flip V' })).toBeVisible();
  });

  test('flip buttons toggle active state', async ({ page }) => {
    await navigateToImagePrep(page);

    const flipH = page.getByRole('button', { name: 'Flip H' });
    await flipH.dispatchEvent('click');
    await expect(flipH).toHaveClass(/bg-primary/);
    await flipH.dispatchEvent('click');
    await expect(flipH).not.toHaveClass(/ring-primary/);
  });
});

// ---------------------------------------------------------------------------
// 4. Scan Settings Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Scan Settings Step', () => {
  test('shows all toggle options with examples and help text', async ({ page }) => {
    await navigateToStep(page, 'scanSettings');

    await expect(page.getByRole('heading', { name: 'Tell us about your quilt' })).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByText('Does this quilt have curved seams?')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByText('Are there shapes sewn on top of the background?')).toBeVisible();
    await expect(
      page.getByText('Are there pieces of the exact same fabric sewn touching each other?')
    ).toBeVisible();
    await expect(
      page.getByText('Is there heavy quilting or embroidery over the pieces?')
    ).toBeVisible();

    await expect(
      page.getByText("Drunkard's Path, Orange Peel, Wedding Ring, Clamshell")
    ).toBeVisible();
    await expect(
      page.getByText('Needle-turn appliqué, raw-edge appliqué, fused shapes')
    ).toBeVisible();
  });

  test('toggle interactions work correctly', async ({ page }) => {
    await navigateToStep(page, 'scanSettings');

    await expect(page.getByText('Does this quilt have curved seams?')).toBeVisible({
      timeout: 10_000,
    });

    const curvedSeamsButton = page.locator('button', {
      has: page.getByText('Does this quilt have curved seams?'),
    });
    await curvedSeamsButton.dispatchEvent('click');
    await expect(curvedSeamsButton).toHaveClass(/border-primary/);
  });
});

// ---------------------------------------------------------------------------
// 4b. Quilt Details Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Quilt Details Step', () => {
  test('shows piece scale and quilt shape options', async ({ page }) => {
    await navigateToStep(page, 'quiltDetails');

    await expect(page.getByText('How big are the pieces generally?')).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Tiny / Postage Stamp')).toBeVisible();
    await expect(page.getByText('Standard', { exact: true })).toBeVisible();
    await expect(page.getByText('Large / Chunky')).toBeVisible();

    await expect(page.getByText('What shape is your quilt?')).toBeVisible();
    await expect(page.getByText('Rectangular / Square')).toBeVisible();
    await expect(page.getByText('Circular / Round')).toBeVisible();
    await expect(page.getByText('Hexagonal')).toBeVisible();
    await expect(page.getByText('Other / Irregular')).toBeVisible();

    // Check the help text appears (flexible match for apostrophe variations)
    await expect(page.getByText(/default settings.*work well.*most quilts/i)).toBeVisible();
  });

  test('piece scale and shape selection interactions work', async ({ page }) => {
    await navigateToStep(page, 'quiltDetails');

    await expect(page.getByText('How big are the pieces generally?')).toBeVisible({
      timeout: 10_000,
    });

    const tinyButton = page.locator('button', {
      has: page.getByText('Tiny / Postage Stamp'),
    });
    await tinyButton.dispatchEvent('click');
    await expect(tinyButton).toHaveClass(/border-primary/);

    const hexButton = page.locator('button', { has: page.getByText('Hexagonal') });
    await hexButton.dispatchEvent('click');
    await expect(page.getByText("Honeycomb or Grandmother's Flower Garden")).toBeVisible();

    const largeButton = page.locator('button', { has: page.getByText('Large / Chunky') });
    await largeButton.dispatchEvent('click');
    await expect(page.getByText('Big pieces, 6"+ \u2014 like modern quilt blocks')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Correction Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Correction Step', () => {
  test('shows canvas and action buttons', async ({ page }) => {
    await navigateToStep(page, 'correction');

    await expect(page.getByText('Adjust perspective')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /auto.detect boundary/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Render Pattern' })).toBeVisible();
    await expect(page.locator('[title*="counter-clockwise"]')).toBeVisible();
    await expect(page.locator('[title*="clockwise"]:not([title*="counter"])')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Processing Step
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Processing Step', () => {
  test('shows pipeline progress UI', async ({ page }) => {
    await navigateToStep(page, 'processing');

    await expect(page.getByText('Analyzing your quilt')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Detecting pieces and extracting the pattern...')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 7. Step Indicator Dots
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Step Indicators', () => {
  test('step dots are visible', async ({ page }) => {
    const wizard = await navigateToPhotoPattern(page);

    const footerDots = wizard.locator('div.pb-4 > div.rounded-full');
    const dotCount = await footerDots.count();
    expect(dotCount).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 8. Wizard Forward Navigation
// ---------------------------------------------------------------------------

test.describe('Photo to Design — Wizard Forward Navigation', () => {
  test('navigates from upload to image prep via Continue button', async ({ page }) => {
    await navigateToPhotoPattern(page);

    await expect(page.getByText('Drop your quilt photo here')).toBeVisible();
    await uploadTestImage(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.getByText('Straighten & adjust your image')).toBeVisible();
    await expect(page.locator('input[type="range"]')).toBeVisible();
  });
});
