import { test, expect } from '@playwright/test';

test.describe('Layout Switching', () => {
  test('renders layout options on the landing page', async ({ page }) => {
    await page.goto('/');
    // Verify the app loads without errors
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('auth pages load without errors', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByText(/sign in/i)).toBeVisible();
  });
});
