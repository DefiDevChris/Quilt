import { test, expect } from '@playwright/test';

test.describe('Sketchbook', () => {
  test('app loads without errors for sketchbook feature', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('protected studio route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/studio');
    // Should redirect to signin
    await page.waitForURL(/auth\/signin/, { timeout: 5000 }).catch(() => {
      // May also show an unauthorized page
    });
    const url = page.url();
    expect(url).toMatch(/auth|signin|unauthorized/);
  });
});
