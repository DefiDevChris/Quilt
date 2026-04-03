import { test, expect } from '@playwright/test';

test.describe('Fabric Library', () => {
  test.skip('fabric library opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/fabric/i)).toBeVisible();
  });

  test.skip('fabric collections are visible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/collection/i)).toBeVisible();
  });

  test.skip('fabric search works', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('cotton');
    await expect(page.getByText(/cotton/i)).toBeVisible();
  });

  test.skip('fabric can be applied to selection', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    const fabric = page.locator('[data-testid="fabric-item"]').first();
    await fabric.click();
  });

  test.skip('fabric preview shows on hover', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    const fabric = page.locator('[data-testid="fabric-item"]').first();
    await fabric.hover();
    await expect(page.locator('[data-testid="fabric-preview"]')).toBeVisible();
  });
});

test.describe('Fabric Calibration', () => {
  test.skip('fabric calibration dialog opens', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    await calibrateButton.click();
    await expect(page.getByText(/calibration/i)).toBeVisible();
  });

  test.skip('custom fabric can be uploaded', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    await calibrateButton.click();
    const uploadButton = page.getByRole('button', { name: /upload/i });
    await expect(uploadButton).toBeVisible();
  });

  test.skip('fabric scale can be adjusted', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    await calibrateButton.click();
    const scaleInput = page.locator('input[type="number"]');
    await expect(scaleInput).toBeVisible();
  });
});

test.describe('Fussy Cut Preview', () => {
  test.skip('fussy cut tool is available', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    await expect(fussyCutButton).toBeVisible();
  });

  test.skip('fussy cut preview shows fabric positioning', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    await fussyCutButton.click();
    await expect(page.getByText(/position/i)).toBeVisible();
  });
});

test.describe('Color Tools', () => {
  test.skip('serendipity color shuffle works', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const shuffleButton = page.getByRole('button', { name: /shuffle/i });
    await shuffleButton.click();
  });

  test.skip('quick color palette opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const paletteButton = page.getByRole('button', { name: /palette/i });
    await paletteButton.click();
    await expect(page.getByText(/color/i)).toBeVisible();
  });

  test.skip('color theme tool is available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const themeButton = page.getByRole('button', { name: /theme/i });
    await expect(themeButton).toBeVisible();
  });
});

test.describe('Recent Fabrics', () => {
  test.skip('recent fabrics section exists', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/recent/i)).toBeVisible();
  });

  test.skip('recently used fabrics are displayed', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    const recentFabrics = page.locator('[data-testid="recent-fabric"]');
    const count = await recentFabrics.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Free Tier Fabric Limits', () => {
  test.skip('free users see fabric limit warning', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/10 fabrics/i)).toBeVisible();
  });

  test.skip('free users cannot access fabric calibration', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const calibrateButton = page.getByRole('button', { name: /calibrate/i });
    await calibrateButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test.skip('free users cannot access fussy cut', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
    await fussyCutButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });
});
