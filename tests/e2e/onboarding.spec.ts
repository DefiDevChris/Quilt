import { test, expect } from '@playwright/test';

test.describe('Onboarding Tour', () => {
  test.beforeEach(async ({ page }) => {
    // Clear onboarding flag before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('quiltcorgi-onboarding-completed');
    });
  });

  test.skip('tour overlay is visible in studio for first-time users', async ({
    page,
  }) => {
    // NOTE: This test requires authentication to access the studio.
    // Enable after setting up test authentication.
    
    // Navigate to studio (requires auth)
    await page.goto('/studio/test-project');
    
    // Verify we're on the studio page (not redirected)
    await expect(page).toHaveURL(/\/studio/);
    
    // Tour overlay should be visible
    const tourOverlay = page.locator('[data-testid="onboarding-tour"]');
    await expect(tourOverlay).toBeVisible({ timeout: 3000 });
  });

  test.skip('tooltip hints show on toolbar hover', async ({ page }) => {
    // NOTE: This test requires authentication to access the studio.
    // Enable after setting up test authentication.
    
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    // Hover over a toolbar button
    const selectTool = page.getByRole('button', { name: /select/i }).first();
    await selectTool.hover();
    
    // Wait for tooltip delay (400ms)
    await page.waitForTimeout(500);
    
    // Rich tooltip should appear
    const tooltip = page.locator('[data-testid="tooltip-hint"]');
    await expect(tooltip).toBeVisible();
  });
});

test.describe('Help Panel', () => {
  test.skip('help button is visible in studio', async ({ page }) => {
    // NOTE: This test requires authentication to access the studio.
    // Enable after setting up test authentication.
    
    await page.goto('/studio/test-project');
    await expect(page).toHaveURL(/\/studio/);

    const helpButton = page.getByRole('button', { name: /help/i });
    await expect(helpButton.first()).toBeVisible();
  });
});
