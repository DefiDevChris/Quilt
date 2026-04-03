import { test, expect } from '@playwright/test';

test.describe('Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('quiltcorgi-onboarding-completed');
    });
  });

  test.skip('tour overlay is visible in studio for first-time users', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);
    
    const tourOverlay = page.locator('[data-testid="onboarding-tour"]');
    await expect(tourOverlay).toBeVisible({ timeout: 3000 });
  });

  test.skip('tooltip hints show on toolbar hover', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const selectTool = page.getByRole('button', { name: /select/i }).first();
    await selectTool.hover();
    
    await page.waitForTimeout(500);
    
    const tooltip = page.locator('[data-testid="tooltip-hint"]');
    await expect(tooltip).toBeVisible();
  });

  test.skip('tour can be dismissed', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);
    
    const dismissButton = page.getByRole('button', { name: /skip|dismiss/i });
    await dismissButton.click();
    
    const tourOverlay = page.locator('[data-testid="onboarding-tour"]');
    await expect(tourOverlay).not.toBeVisible();
  });

  test.skip('tour progresses through steps', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);
    
    const nextButton = page.getByRole('button', { name: /next/i });
    await nextButton.click();
    
    await expect(page.getByText(/step 2/i)).toBeVisible();
  });

  test.skip('tour completion is saved', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);
    
    const finishButton = page.getByRole('button', { name: /finish|done/i });
    await finishButton.click();
    
    await page.reload();
    
    const tourOverlay = page.locator('[data-testid="onboarding-tour"]');
    await expect(tourOverlay).not.toBeVisible();
  });
});

test.describe('Help Panel', () => {
  test.skip('help button is visible in studio', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await expect(helpButton.first()).toBeVisible();
  });

  test.skip('help panel opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await helpButton.click();
    
    await expect(page.getByText(/help/i)).toBeVisible();
  });

  test.skip('help panel has search', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await helpButton.click();
    
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();
  });

  test.skip('help panel has categories', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await helpButton.click();
    
    await expect(page.getByText(/getting started/i)).toBeVisible();
  });

  test.skip('help articles are accessible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await helpButton.click();
    
    const article = page.locator('[data-testid="help-article"]').first();
    await article.click();
    
    await expect(page.getByRole('heading')).toBeVisible();
  });
});

test.describe('Keyboard Shortcuts Help', () => {
  test.skip('keyboard shortcuts dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    await page.keyboard.press('?');
    
    await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();
  });

  test.skip('shortcuts are categorized', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    await page.keyboard.press('?');
    
    await expect(page.getByText(/general/i)).toBeVisible();
    await expect(page.getByText(/editing/i)).toBeVisible();
  });
});

