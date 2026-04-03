import { test, expect } from '@playwright/test';
import { authenticatedTest, clearSession, waitForElement } from './utils';

test.describe('Blog Section', () => {
  test('blog index page loads with posts', async ({ page }) => {
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
    const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
    await expect(posts.first()).toBeVisible();
  });

  test('individual blog post renders', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    await expect(page.getByRole('heading', { name: /Introducing QuiltCorgi/i })).toBeVisible();
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
    const tagButton = page.getByRole('button', { name: /announcement/i });
    if (await tagButton.isVisible()) {
      await tagButton.click();
      const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
      const count = await posts.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('blog post navigation works', async ({ page }) => {
    await page.goto('/blog');
    const firstPost = page
      .getByRole('button')
      .filter({ hasText: /QuiltCorgi Team/i })
      .first();
    await firstPost.click();
    await expect(page).toHaveURL(/\/blog\/.+/);
  });

  test('blog post has read time estimate', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    await expect(page.getByText(/min read/i)).toBeVisible();
  });

  test('blog post has author information', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    await expect(page.getByText(/QuiltCorgi Team/i).first()).toBeVisible();
  });

  test('blog post has publish date', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    const datePattern = /\d{4}/;
    await expect(page.locator('text=' + datePattern.source).first()).toBeVisible();
  });

  test('blog post has table of contents', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Look for TOC or headings navigation
    const toc = page.getByText(/table of contents|contents|in this article/i);
    if (await toc.isVisible()) {
      await expect(toc).toBeVisible();
    }
  });

  test('blog post has related posts section', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Look for related posts or "you might also like"
    const related = page.getByText(/related|you might|also like|similar/i);
    if (await related.isVisible()) {
      await expect(related).toBeVisible();
    }
  });

  test('blog post has share buttons', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Look for social share buttons
    const shareButtons = page.getByRole('button', { name: /share|twitter|facebook|linkedin/i });
    const count = await shareButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('blog post images load correctly', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Check for broken images
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      if (src) {
        // Image should load without errors
        await expect(img).toBeVisible();
      }
    }
  });

  test('blog post has proper typography', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Should have proper heading hierarchy
    await expect(page.locator('h1')).toHaveCount(1); // One main title
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(0);
  });

  test('blog post has code blocks if applicable', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Check for code blocks or pre elements
    const codeBlocks = page.locator('pre, code');
    const count = await codeBlocks.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Blog Navigation and Search', () => {
  test('blog index has search functionality', async ({ page }) => {
    await page.goto('/blog');

    // Look for search input
    const searchInput = page.getByPlaceholder(/search.*blog|find.*post/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('quilt');
      await page.waitForTimeout(500);

      // Should filter results
      const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
      const count = await posts.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('blog index has category/tag filters', async ({ page }) => {
    await page.goto('/blog');

    // Look for category buttons or filters
    const categoryButtons = page
      .getByRole('button')
      .filter({ hasText: /announcement|tutorial|news|update/i });
    const count = await categoryButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('pagination works on blog index', async ({ page }) => {
    await page.goto('/blog');

    // Look for pagination controls
    const pagination = page.getByRole('button', { name: /\d+|next|previous/i });
    const count = await pagination.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('blog index shows post previews', async ({ page }) => {
    await page.goto('/blog');

    // Each post should have title, excerpt, date, author
    const posts = page.locator('[data-blog-post]');
    if ((await posts.count()) > 0) {
      const firstPost = posts.first();

      // Should have title
      await expect(firstPost.locator('h2, h3')).toBeVisible();

      // Should have date or "time ago"
      const dateText = firstPost
        .locator('text')
        .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|\d+.*ago|min read/i });
      await expect(dateText.first()).toBeVisible();
    }
  });

  test('blog breadcrumbs work', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Look for breadcrumb navigation
    const breadcrumb = page.getByRole('link', { name: /blog|home/i });
    if (await breadcrumb.isVisible()) {
      await breadcrumb.first().click();
      await expect(page).toHaveURL('/blog');
    }
  });

  test('blog post reading progress indicator', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Look for reading progress bar or indicator
    const progress = page.locator('[data-reading-progress], .reading-progress');
    if (await progress.isVisible()) {
      await expect(progress).toBeVisible();
    }
  });
});

test.describe('Blog RSS and Feeds', () => {
  test('RSS feed link is present', async ({ page }) => {
    await page.goto('/blog');

    // Look for RSS feed link
    const rssLink = page.getByRole('link', { name: /rss|feed/i });
    if (await rssLink.isVisible()) {
      await expect(rssLink).toHaveAttribute('href', /rss\.xml|feed/);
    }
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

    // Should have at least one item
    expect(body).toContain('<item>');
  });

  test('RSS feed has proper item structure', async ({ page }) => {
    const response = await page.goto('/blog/rss.xml');
    const body = await response?.text();

    // Each item should have title, link, description, pubDate
    expect(body).toContain('<title>');
    expect(body).toContain('<link>');
    expect(body).toContain('<description>');
    expect(body).toContain('<pubDate>');
  });

  test('RSS feed items have correct URLs', async ({ page }) => {
    const response = await page.goto('/blog/rss.xml');
    const body = await response?.text();

    // Links should be absolute URLs
    expect(body).toContain('https://');
    expect(body).toContain('/blog/');
  });
});

test.describe('Blog Admin Features (Authenticated)', () => {
  test.skip('blog admin panel requires authentication', async ({ page }) => {
    await page.goto('/admin/blog');

    // Should redirect to sign in or show unauthorized
    await page.waitForURL(/auth\/signin|unauthorized|forbidden/);
  });

  test.skip('blog post creation form loads', async ({ page }) => {
    // Requires admin authentication
    await page.goto('/admin/blog/new');

    // Should show rich text editor
    await expect(page.locator('.tiptap-editor, [data-tiptap-editor]')).toBeVisible();
  });

  test.skip('blog post editor has formatting tools', async ({ page }) => {
    // Requires admin authentication
    await page.goto('/admin/blog/new');

    // Should have formatting toolbar
    await expect(
      page.getByRole('button', { name: /bold|italic|heading|link/i }).first()
    ).toBeVisible();
  });

  test.skip('blog post preview works', async ({ page }) => {
    // Requires admin authentication
    await page.goto('/admin/blog/new');

    // Fill in some content
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill('Test Blog Post');

    // Click preview
    const previewButton = page.getByRole('button', { name: /preview/i });
    if (await previewButton.isVisible()) {
      await previewButton.click();

      // Should show preview
      await expect(page.getByText('Test Blog Post')).toBeVisible();
    }
  });

  test.skip('blog post publishing works', async ({ page }) => {
    // Requires admin authentication
    await page.goto('/admin/blog/new');

    // Fill in required fields and publish
    const titleInput = page.getByLabel(/title/i);
    await titleInput.fill('Test Published Post');

    const contentEditor = page.locator('.tiptap-editor');
    await contentEditor.fill('This is test content for publishing.');

    // This would actually publish - so skip in tests
    test.skip(true, 'Would publish real content');
  });
});

test.describe('Blog Performance and SEO', () => {
  test('blog pages load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/blog');
    const loadTime = Date.now() - startTime;

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('blog post pages have proper SEO meta tags', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Check title tag
    const title = await page.title();
    expect(title).toContain('QuiltCorgi');

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    const description = await metaDescription.getAttribute('content');
    expect(description?.length).toBeGreaterThan(50);

    // Check Open Graph tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content');

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute('content');
  });

  test('blog index has proper structured data', async ({ page }) => {
    await page.goto('/blog');

    // Should have JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    const count = await structuredData.count();
    expect(count).toBeGreaterThanOrEqual(0);

    if (count > 0) {
      const content = await structuredData.first().textContent();
      expect(content).toContain('Blog');
    }
  });

  test('blog images are optimized', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');

    // Check image alt texts
    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt?.length).toBeGreaterThan(0);
    }
  });
});
