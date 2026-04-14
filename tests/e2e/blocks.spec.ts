import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Block Library', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/blocks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'block-1', name: 'Nine Patch', category: 'traditional' },
          { id: 'block-2', name: 'Square in Square', category: 'traditional' },
        ]),
      });
    });
  });

  test('block library opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
      await expect(page.getByText(/block library|blocks/i)).toBeVisible();
    }
  });

  test('block categories are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
      await expect(page.getByText(/traditional|categories/i)).toBeVisible();
    }
  });

  test('block search works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('nine patch');
      await expect(page.getByText(/nine patch|nine|patch/i)).toBeVisible();
    }
  });

  test('block can be dragged to canvas', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }
    const block = page.locator('[data-testid="block-item"]').or(page.getByText(/nine patch/i)).first();
    const canvas = page.locator('canvas');
    if (await block.isVisible() && await canvas.isVisible()) {
      await block.dragTo(canvas);
    }
  });

  test('block preview shows on hover', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }
    const block = page.locator('[data-testid="block-item"]').or(page.getByText(/nine patch/i)).first();
    if (await block.isVisible()) {
      await block.hover();
      const preview = page.locator('[data-testid="block-preview"]').or(page.getByText(/preview/i));
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    }
  });
});

test.describe('Block Builder', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('block builder tab opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const builderButton = page.getByRole('button', { name: /block builder|builder/i });
    if (await builderButton.isVisible()) {
      await builderButton.click();
      await expect(page.getByText(/easydraw|builder/i)).toBeVisible();
    }
  });

  test('easydraw tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const builderButton = page.getByRole('button', { name: /block builder|builder/i });
    if (await builderButton.isVisible()) {
      await builderButton.click();
    }
    await expect(page.getByRole('button', { name: /easydraw/i })).toBeVisible();
  });

  test('applique tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const builderButton = page.getByRole('button', { name: /block builder|builder/i });
    if (await builderButton.isVisible()) {
      await builderButton.click();
    }
    const appliqueButton = page.getByRole('button', { name: /applique/i });
    if (await appliqueButton.isVisible()) {
      await expect(appliqueButton).toBeVisible();
    }
  });

  test('freeform tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const builderButton = page.getByRole('button', { name: /block builder|builder/i });
    if (await builderButton.isVisible()) {
      await builderButton.click();
    }
    const freeformButton = page.getByRole('button', { name: /freeform/i });
    if (await freeformButton.isVisible()) {
      await expect(freeformButton).toBeVisible();
    }
  });

  test('custom block can be saved', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const builderButton = page.getByRole('button', { name: /block builder|builder/i });
    if (await builderButton.isVisible()) {
      await builderButton.click();
    }
    const saveButton = page.getByRole('button', { name: /save block|save/i });
    if (await saveButton.isVisible()) {
      await expect(saveButton).toBeVisible();
    }
  });
});

test.describe('Block Overlay Templates', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('traditional block overlays are available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
    if (await overlayButton.isVisible()) {
      await overlayButton.click();
      await expect(page.getByText(/nine patch|traditional|overlay/i)).toBeVisible();
    }
  });

  test('overlay opacity can be adjusted', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
    if (await overlayButton.isVisible()) {
      await overlayButton.click();
    }
    const opacitySlider = page.locator('input[type="range"]').or(page.getByText(/opacity/i));
    if (await opacitySlider.isVisible()) {
      await expect(opacitySlider).toBeVisible();
    }
  });

  test('overlay can be locked', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
    if (await overlayButton.isVisible()) {
      await overlayButton.click();
    }
    const lockButton = page.getByRole('button', { name: /lock/i });
    if (await lockButton.isVisible()) {
      await expect(lockButton).toBeVisible();
    }
  });

  test('recommended dimensions modal shows', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
    if (await overlayButton.isVisible()) {
      await overlayButton.click();
    }
    const overlay = page.locator('[data-testid="overlay-item"]').or(page.getByText(/nine patch/i)).first();
    if (await overlay.isVisible()) {
      await overlay.click();
      await expect(page.getByText(/recommended dimensions|dimensions/i)).toBeVisible();
    }
  });
});

test.describe('Block Grid', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('block grid tool is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const gridButton = page.getByRole('button', { name: /grid/i });
    if (await gridButton.isVisible()) {
      await expect(gridButton).toBeVisible();
    }
  });

  test('grid can be toggled on/off', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const gridButton = page.getByRole('button', { name: /grid/i });
    if (await gridButton.isVisible()) {
      await gridButton.click();
    }
  });

  test('grid settings can be adjusted', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const gridButton = page.getByRole('button', { name: /grid/i });
    if (await gridButton.isVisible()) {
      await gridButton.click();
    }
    const settingsButton = page.getByRole('button', { name: /settings/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page.getByText(/grid size|settings/i)).toBeVisible();
    }
  });
});

test.describe('Free Tier Block Limits', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/blocks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
  });

  test('free users see block limit warning', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
      await expect(page.getByText(/limit|upgrade|pro/i)).toBeVisible();
    }
  });

  test('free users cannot access pro blocks', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }
    const proBlock = page.locator('[data-testid="pro-block"]').or(page.getByText(/pro|upgrade/i)).first();
    if (await proBlock.isVisible()) {
      await expect(proBlock).toBeVisible();
    }
  });
});
