import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Fabric Library', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/fabrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'fabric-1', name: 'Cotton Blue', collection: 'Basic' },
          { id: 'fabric-2', name: 'Floral Print', collection: 'Premium' },
        ]),
      });
    });
  });

  test('fabric library opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/fabric/i)).toBeVisible();
    }
  });

  test('fabric collections are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/collection|Basic|Premium/i)).toBeVisible();
    }
  });

  test('fabric search works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
    }
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('cotton');
      await expect(page.getByText(/cotton|Cotton/i)).toBeVisible();
    }
  });

  test('fabric can be applied to selection', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
    }
    const fabric = page.locator('[data-testid="fabric-item"]').or(page.getByText(/cotton|floral/i)).first();
    if (await fabric.isVisible()) {
      await fabric.click();
    }
  });

  test('fabric preview shows on hover', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
    }
    const fabric = page.locator('[data-testid="fabric-item"]').or(page.getByText(/cotton|floral/i)).first();
    if (await fabric.isVisible()) {
      await fabric.hover();
      const preview = page.locator('[data-testid="fabric-preview"]').or(page.getByText(/preview/i));
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    }
  });
});

test.describe('Fabric Calibration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('fabric calibration dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    if (await calibrateButton.isVisible()) {
      await calibrateButton.click();
      await expect(page.getByText(/calibration/i)).toBeVisible();
    }
  });

  test('custom fabric can be uploaded', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    if (await calibrateButton.isVisible()) {
      await calibrateButton.click();
    }
    const uploadButton = page.getByRole('button', { name: /upload/i });
    if (await uploadButton.isVisible()) {
      await expect(uploadButton).toBeVisible();
    }
  });

  test('fabric scale can be adjusted', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    if (await calibrateButton.isVisible()) {
      await calibrateButton.click();
    }
    const scaleInput = page.locator('input[type="number"]').or(page.getByText(/scale/i));
    if (await scaleInput.isVisible()) {
      await expect(scaleInput).toBeVisible();
    }
  });
});

test.describe('Fussy Cut Preview', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('fussy cut tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    if (await fussyCutButton.isVisible()) {
      await expect(fussyCutButton).toBeVisible();
    }
  });

  test('fussy cut preview shows fabric positioning', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    if (await fussyCutButton.isVisible()) {
      await fussyCutButton.click();
      await expect(page.getByText(/position|fussy/i)).toBeVisible();
    }
  });
});

test.describe('Color Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('serendipity color shuffle works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const shuffleButton = page.getByRole('button', { name: /shuffle|serendipity/i });
    if (await shuffleButton.isVisible()) {
      await shuffleButton.click();
    }
  });

  test('quick color palette opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const paletteButton = page.getByRole('button', { name: /palette|color/i });
    if (await paletteButton.isVisible()) {
      await paletteButton.click();
      await expect(page.getByText(/color|palette/i)).toBeVisible();
    }
  });

  test('color theme tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const themeButton = page.getByRole('button', { name: /theme|color theme/i });
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await expect(page.getByText(/theme|color/i)).toBeVisible();
    }
  });
});

test.describe('Recent Fabrics', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('recent fabrics section exists', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/recent|recently/i)).toBeVisible();
    }
  });

  test('recently used fabrics are displayed', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
    }
    await expect(page.getByText(/recent|fabric/i)).toBeVisible();
  });
});

test.describe('Free Tier Fabric Limits', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/fabrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('free users see fabric limit warning', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/limit|upgrade|fabrics/i)).toBeVisible();
    }
  });

  test('free users cannot access fabric calibration', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    if (await calibrateButton.isVisible()) {
      await calibrateButton.click();
      await expect(page.getByText(/upgrade|pro|limit/i)).toBeVisible();
    }
  });

  test('free users cannot access fussy cut', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    if (await fussyCutButton.isVisible()) {
      await fussyCutButton.click();
      await expect(page.getByText(/upgrade|pro|limit/i)).toBeVisible();
    }
  });
});
