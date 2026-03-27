import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('renders hero section with CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Design quilts');
    await expect(page.getByRole('link', { name: /get started free/i })).toBeVisible();
  });

  test('renders feature highlights section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Block Library')).toBeVisible();
    await expect(page.getByText('Fabric Preview')).toBeVisible();
    await expect(page.getByText('1:1 PDF Patterns')).toBeVisible();
    await expect(page.getByText('Community Board')).toBeVisible();
  });

  test('renders pricing cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('$9.99/month')).toBeVisible();
    await expect(page.getByText('Free forever')).toBeVisible();
  });

  test('nav links to auth pages', async ({ page }) => {
    await page.goto('/');
    const ctaLink = page.getByRole('link', { name: /get started free/i }).first();
    await expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  });
});

test.describe('Auth Pages', () => {
  test('sign in page loads', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('sign up page loads', async ({ page }) => {
    await page.goto('/auth/signup');
    await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
  });
});

test.describe('Community Page', () => {
  test('community page loads', async ({ page }) => {
    await page.goto('/community');
    await expect(page.getByText(/community/i).first()).toBeVisible();
  });

  test('community page has search and sort controls', async ({ page }) => {
    await page.goto('/community');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /newest/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /most liked/i })).toBeVisible();
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
});

test.describe('SEO', () => {
  test('landing page has proper meta tags', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('QuiltCorgi');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /quilt design studio/i);
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
});
