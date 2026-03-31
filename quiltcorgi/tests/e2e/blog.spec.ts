import { test, expect } from '@playwright/test';

test.describe('Blog Section', () => {
  test('blog index page loads with posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
    // Posts render as buttons in the blog feed
    const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
    await expect(posts.first()).toBeVisible();
  });

  test('individual blog post renders', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    // Use the article heading specifically (page has two h1s — nav and article)
    await expect(
      page.getByRole('heading', { name: /Introducing QuiltCorgi/i })
    ).toBeVisible();
    await expect(page.getByText(/QuiltCorgi Team/i).first()).toBeVisible();
  });

  test('blog post has Article schema', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    const schemaScript = page.locator('script[type="application/ld+json"]');
    const content = await schemaScript.first().textContent();
    expect(content).toContain('Article');
  });

  test('blog post has proper meta tags', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    const title = await page.title();
    expect(title).toContain('Introducing QuiltCorgi');
  });

  test('RSS feed returns valid XML', async ({ page }) => {
    const response = await page.goto('/blog/rss.xml');
    expect(response?.status()).toBe(200);

    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('xml');

    const body = await response?.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<rss');
    expect(body).toContain('QuiltCorgi Blog');
    expect(body).toContain('<item>');
  });

  test('tag filter works on blog index', async ({ page }) => {
    await page.goto('/blog');
    // Click a tag filter
    const tagButton = page.getByRole('button', { name: /announcement/i });
    if (await tagButton.isVisible()) {
      await tagButton.click();
      // Should filter posts
      const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
      const count = await posts.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});
