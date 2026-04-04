import { test, expect } from '@playwright/test';

test.describe('Block Library', () => {
  test.skip('block library opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    await expect(page.getByText(/651/i)).toBeVisible();
  });

  test.skip('block categories are visible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    await expect(page.getByText(/traditional/i)).toBeVisible();
  });

  test.skip('block search works', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('nine patch');
    await expect(page.getByText(/nine patch/i)).toBeVisible();
  });

  test.skip('block can be dragged to canvas', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    const block = page.locator('[data-testid="block-item"]').first();
    await block.dragTo(page.locator('canvas'));
  });

  test.skip('block preview shows on hover', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    const block = page.locator('[data-testid="block-item"]').first();
    await block.hover();
    await expect(page.locator('[data-testid="block-preview"]')).toBeVisible();
  });
});

test.describe('Block Builder', () => {
  test.skip('block builder tab opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const builderButton = page.getByRole('button', { name: /block builder/i });
    await builderButton.click();
    await expect(page.getByText(/easydraw/i)).toBeVisible();
  });

  test.skip('easydraw tool is available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const builderButton = page.getByRole('button', { name: /block builder/i });
    await builderButton.click();
    await expect(page.getByRole('button', { name: /easydraw/i })).toBeVisible();
  });

  test.skip('applique tool is available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const builderButton = page.getByRole('button', { name: /block builder/i });
    await builderButton.click();
    await expect(page.getByRole('button', { name: /applique/i })).toBeVisible();
  });

  test.skip('freeform tool is available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const builderButton = page.getByRole('button', { name: /block builder/i });
    await builderButton.click();
    await expect(page.getByRole('button', { name: /freeform/i })).toBeVisible();
  });

  test.skip('custom block can be saved', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const builderButton = page.getByRole('button', { name: /block builder/i });
    await builderButton.click();
    const saveButton = page.getByRole('button', { name: /save block/i });
    await expect(saveButton).toBeVisible();
  });
});

test.describe('Block Overlay Templates', () => {
  test.skip('traditional block overlays are available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    await expect(page.getByText(/nine patch/i)).toBeVisible();
  });

  test.skip('overlay opacity can be adjusted', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    const opacitySlider = page.locator('input[type="range"]');
    await expect(opacitySlider).toBeVisible();
  });

  test.skip('overlay can be locked', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    const lockButton = page.getByRole('button', { name: /lock/i });
    await expect(lockButton).toBeVisible();
  });

  test.skip('recommended dimensions modal shows', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    const overlay = page.locator('[data-testid="overlay-item"]').first();
    await overlay.click();
    await expect(page.getByText(/recommended dimensions/i)).toBeVisible();
  });
});

test.describe('Block Grid', () => {
  test.skip('block grid tool is available', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const gridButton = page.getByRole('button', { name: /grid/i });
    await expect(gridButton).toBeVisible();
  });

  test.skip('grid can be toggled on/off', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const gridButton = page.getByRole('button', { name: /grid/i });
    await gridButton.click();
    await expect(gridButton).toHaveAttribute('aria-pressed', 'true');
  });

  test.skip('grid settings can be adjusted', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const gridButton = page.getByRole('button', { name: /grid/i });
    await gridButton.click();
    const settingsButton = page.getByRole('button', { name: /settings/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page.getByText(/grid size/i)).toBeVisible();
    }
  });
});

test.describe('Free Tier Block Limits', () => {
  test.skip('free users see block limit warning', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    await expect(page.getByText(/20 blocks/i)).toBeVisible();
  });

  test.skip('free users cannot access all blocks', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    const proBlock = page.locator('[data-testid="pro-block"]').first();
    if (await proBlock.isVisible()) {
      await expect(proBlock).toHaveAttribute('aria-disabled', 'true');
    }
  });
});
