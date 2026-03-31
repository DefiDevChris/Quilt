import { test, expect } from '@playwright/test';

test.describe('Export Flows', () => {
  test('app renders without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Verify no error overlay is shown
    const errorOverlay = page.locator('#__next-build-error');
    await expect(errorOverlay).toHaveCount(0);
  });

  test('signup page accessible for export features', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');
  });
});
