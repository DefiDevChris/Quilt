import { test, expect } from '@playwright/test';

test.describe('Layout Switching', () => {
  test.skip('layout options are available in studio', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await expect(layoutButton).toBeVisible();
  });

  test.skip('can switch to grid layout', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const gridOption = page.getByText(/grid/i);
    await gridOption.click();
  });

  test.skip('can switch to sashing layout', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const sashingOption = page.getByText(/sashing/i);
    await sashingOption.click();
  });

  test.skip('can switch to on-point layout', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const onPointOption = page.getByText(/on-point/i);
    await onPointOption.click();
  });

  test.skip('layout settings persist', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const gridOption = page.getByText(/grid/i);
    await gridOption.click();
    
    await page.reload();
    
    // Layout should still be grid
  });

  test.skip('layout affects pattern overlay alignment', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const gridOption = page.getByText(/grid/i);
    await gridOption.click();
    
    // Pattern overlay should align to grid
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    
    const overlay = page.locator('[data-testid="overlay-item"]').first();
    await overlay.click();
  });
});

test.describe('Layout Configuration', () => {
  test.skip('grid layout has size settings', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const gridOption = page.getByText(/grid/i);
    await gridOption.click();
    
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    await expect(page.getByText(/rows/i)).toBeVisible();
    await expect(page.getByText(/columns/i)).toBeVisible();
  });

  test.skip('sashing layout has width settings', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const sashingOption = page.getByText(/sashing/i);
    await sashingOption.click();
    
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    await expect(page.getByText(/sashing width/i)).toBeVisible();
  });

  test.skip('on-point layout has rotation settings', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const onPointOption = page.getByText(/on-point/i);
    await onPointOption.click();
    
    const settingsButton = page.getByRole('button', { name: /settings/i });
    await settingsButton.click();
    
    await expect(page.getByText(/rotation/i)).toBeVisible();
  });
});

test.describe('Layout Preview', () => {
  test.skip('layout preview shows before applying', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const layoutButton = page.getByRole('button', { name: /layout/i });
    await layoutButton.click();
    
    const gridOption = page.getByText(/grid/i);
    await gridOption.hover();
    
    await expect(page.locator('[data-testid="layout-preview"]')).toBeVisible();
  });
});

