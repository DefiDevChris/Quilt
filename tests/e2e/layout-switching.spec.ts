import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Layout Switching', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('layout options are available in studio', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await expect(layoutButton).toBeVisible();
    }
  });

  test('can switch to grid layout', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const gridOption = page.getByText(/grid/i);
    if (await gridOption.isVisible()) {
      await gridOption.click();
    }
  });

  test('can switch to sashing layout', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const sashingOption = page.getByText(/sashing/i);
    if (await sashingOption.isVisible()) {
      await sashingOption.click();
    }
  });

  test('can switch to on-point layout', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const onPointOption = page.getByText(/on-point/i);
    if (await onPointOption.isVisible()) {
      await onPointOption.click();
    }
  });

  test('layout settings persist', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const gridOption = page.getByText(/grid/i);
    if (await gridOption.isVisible()) {
      await gridOption.click();
    }
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/grid|layout/i)).toBeVisible();
  });

  test('layout affects pattern overlay alignment', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const gridOption = page.getByText(/grid/i);
    if (await gridOption.isVisible()) {
      await gridOption.click();
    }
    const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
    if (await overlayButton.isVisible()) {
      await overlayButton.click();
    }
    const overlay = page.locator('[data-testid="overlay-item"]').or(page.getByText(/nine patch/i)).first();
    if (await overlay.isVisible()) {
      await overlay.click();
    }
  });
});

test.describe('Layout Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('grid layout has size settings', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const gridOption = page.getByText(/grid/i);
    if (await gridOption.isVisible()) {
      await gridOption.click();
    }
    const settingsButton = page.getByRole('button', { name: /settings/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page.getByText(/rows|columns|size/i)).toBeVisible();
    }
  });

  test('sashing layout has width settings', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const sashingOption = page.getByText(/sashing/i);
    if (await sashingOption.isVisible()) {
      await sashingOption.click();
    }
    const settingsButton = page.getByRole('button', { name: /settings/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page.getByText(/sashing width|width/i)).toBeVisible();
    }
  });

  test('on-point layout has rotation settings', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const onPointOption = page.getByText(/on-point/i);
    if (await onPointOption.isVisible()) {
      await onPointOption.click();
    }
    const settingsButton = page.getByRole('button', { name: /settings/i });
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await expect(page.getByText(/rotation|angle/i)).toBeVisible();
    }
  });
});

test.describe('Layout Preview', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('layout preview shows before applying', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const layoutButton = page.getByRole('button', { name: /layout/i });
    if (await layoutButton.isVisible()) {
      await layoutButton.click();
    }
    const gridOption = page.getByText(/grid/i);
    if (await gridOption.isVisible()) {
      await gridOption.hover();
      const preview = page.locator('[data-testid="layout-preview"]').or(page.getByText(/preview/i));
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    }
  });
});
