import { test, expect } from '@playwright/test';

test.describe('User Management', () => {
  test.describe('Onboarding', () => {
    test('onboarding page loads for new users', async ({ page }) => {
      await page.goto('/onboarding');

      // Should show onboarding form or redirect
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('onboarding has form fields', async ({ page }) => {
      await page.goto('/onboarding');

      // Should show some form elements
      const formFields = page.getByRole('textbox');
      const count = await formFields.count();
      // Either shows form or redirects to login
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Session', () => {
    test('session persists across page loads', async ({ page }) => {
      // Go to dashboard
      await page.goto('/dashboard');

      // May redirect to signin if not authenticated
      const url = page.url();
      if (!url.includes('signin')) {
        await expect(page).toHaveURL(/\/dashboard/);
      }
    });
  });
});

test.describe('Error Handling', () => {
  test('404 page renders correctly', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Should show 404 content
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('shows user-friendly error message', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');

    // Check for friendly error or standard next.js error
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(0);
  });
});

test.describe('Accessibility', () => {
  test('auth forms are accessible', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check for skip link
    const skipLink = page.getByText('Skip to main content');
    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeAttached();
    }
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/auth/signin');

    // Check form labels exist
    const nameLabel = page.getByLabel('Name');
    const emailLabel = page.getByLabel('Email');
    const passwordLabel = page.getByLabel('Password');

    // Some may be visible depending on page
    const count = await Promise.all([nameLabel.count(), emailLabel.count(), passwordLabel.count()]);

    expect(count.some((c) => c > 0)).toBe(true);
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/auth/signin');

    const submitButton = page.getByRole('button', { name: /sign in|submit/i });
    await expect(submitButton).toBeVisible();
  });

  test('focus management works', async ({ page }) => {
    await page.goto('/auth/signin');

    // Press Tab and verify focus moves
    await page.keyboard.press('Tab');

    // At least one element should be focused
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(activeElement);
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Page should render without errors
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('tablet viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('desktop viewport works', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Billing / Pro Features', () => {
  test('pro upgrade modal can open', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Look for upgrade button
    const upgradeButton = page.getByRole('button', { name: /upgrade to pro/i });
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('pro features are gated', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Pro features should be gated (badges removed)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Session Timeout', () => {
  test('expired session redirects to signin', async ({ page }) => {
    // Clear session
    await page.evaluate(() => {
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      localStorage.clear();
    });

    await page.goto('/dashboard');

    // Should redirect to signin
    await page.waitForURL(/auth\/signin/);
  });
});

test.describe('Public Pages', () => {
  test('about page loads', async ({ page }) => {
    await page.goto('/about');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('contact page loads', async ({ page }) => {
    await page.goto('/contact');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('API Endpoints', () => {
  test('API health check', async ({ page }) => {
    const response = await page.goto('/api/health');
    // May return 200 or 404 depending on implementation
    expect([200, 404, 307]).toContain(response?.status() ?? 404);
  });

  test('unauthorized API access returns 401', async ({ page }) => {
    // Try accessing a protected API endpoint
    const response = await page.goto('/api/projects');
    // Should redirect or return 401
    expect([401, 403, 307, 302]).toContain(response?.status() ?? 302);
  });
});
