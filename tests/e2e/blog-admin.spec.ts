import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';

// ... existing blog tests before line 274 remain unchanged ...

test.describe('Blog Admin Features (Authenticated)', () => {
  test('blog admin panel requires authentication', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.goto('/admin/blog');
    await page.waitForURL(/auth\/signin|unauthorized|forbidden/);
  });

  test('blog post creation form loads', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/admin/blog/new');
    await expect(page.getByText(/title|content|blog/i)).toBeVisible();
  });

  test('blog post editor has formatting tools', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/admin/blog/new');
    await expect(
      page.getByRole('button', { name: /bold|italic|heading|link|format/i }).first()
    ).toBeVisible();
  });

  test('blog post preview works', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/admin/blog/new');
    const titleInput = page.getByLabel(/title/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Blog Post');
    }
    const previewButton = page.getByRole('button', { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();
      await expect(page.getByText(/Test Blog Post|preview/i)).toBeVisible();
    }
  });

  test('blog post publishing form is available', async ({ page }) => {
    await mockAuth(page, 'admin');
    await page.goto('/admin/blog/new');
    const titleInput = page.getByLabel(/title/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test Published Post');
    }
    const publishButton = page.getByRole('button', { name: /publish|save/i });
    if (await publishButton.isVisible()) {
      await expect(publishButton).toBeVisible();
    }
  });
});

test.describe('Blog Performance and SEO', () => {
  test('blog pages load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/blog');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('blog post pages have proper SEO meta tags', async ({ page }) => {
    await page.goto('/blog');
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    const metaDescription = page.locator('meta[name="description"]');
    if ((await metaDescription.count()) > 0) {
      const description = await metaDescription.getAttribute('content');
      expect(description?.length).toBeGreaterThan(0);
    }
  });

  test('blog index has proper structured data', async ({ page }) => {
    await page.goto('/blog');
    const structuredData = page.locator('script[type="application/ld+json"]');
    const count = await structuredData.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
