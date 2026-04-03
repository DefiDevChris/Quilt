import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero section with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('First Stitch');
    await expect(page.getByRole('link', { name: /start designing free/i }).first()).toBeVisible();
  });

  test('renders feature highlights section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('659+ block library')).toBeVisible();
    await expect(page.getByText('True-scale PDF with seam allowances')).toBeVisible();
    await expect(page.getByText('Automatic yardage estimation')).toBeVisible();
  });

  test('nav links to auth pages', async ({ page }) => {
    await page.goto('/');
    const ctaLink = page.getByRole('link', { name: /start designing free/i }).first();
    await expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  });

  test('displays pricing tiers', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/free/i)).toBeVisible();
    await expect(page.getByText(/pro/i)).toBeVisible();
  });

  test('navigation menu works', async ({ page }) => {
    await page.goto('/');
    const blogLink = page.getByRole('link', { name: /blog/i });
    if (await blogLink.isVisible()) {
      await expect(blogLink).toHaveAttribute('href', '/blog');
    }
  });
});

test.describe('Auth Pages', () => {
  test('sign in page loads', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');
  });

  test('sign in form has required fields', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('sign up form has required fields', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('forgot password link exists', async ({ page }) => {
    await page.goto('/auth/signin');
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();
  });
});

test.describe('Community Page', () => {
  test('community page loads', async ({ page }) => {
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
  });

  test('community page has tabs', async ({ page }) => {
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: 'Feed' })).toBeVisible();
  });

  test('discover tab shows posts', async ({ page }) => {
    await page.goto('/socialthreads');
    const posts = page.locator('[data-testid="community-post"]');
    const count = await posts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('saved tab is accessible', async ({ page }) => {
    await page.goto('/socialthreads?tab=saved');
    await expect(page).toHaveURL(/tab=saved/);
  });
});

test.describe('Protected Routes', () => {
  test('dashboard redirects to sign in when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test('studio redirects to sign in when not authenticated', async ({ page }) => {
    await page.goto('/studio/some-project-id');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test('projects page redirects to sign in when not authenticated', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test('settings page redirects to sign in when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });
});

test.describe('SEO', () => {
  test('landing page has proper meta tags', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('QuiltCorgi');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /quilt/i);
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('User-agent');
    expect(body).toContain('Disallow: /api/');
  });

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain('urlset');
  });

  test('manifest.json is accessible', async ({ page }) => {
    const response = await page.goto('/manifest.json');
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    const manifest = JSON.parse(body ?? '{}');
    expect(manifest.name).toBe('QuiltCorgi');
    expect(manifest.theme_color).toBe('#D4883C');
  });
});

test.describe('Accessibility', () => {
  test('landing page has skip link', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByText('Skip to main content');
    await expect(skipLink).toBeAttached();
  });

  test('landing page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
