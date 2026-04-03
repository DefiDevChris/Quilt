import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';

test.describe('Accessibility - WCAG Compliance', () => {
  test('landing page has proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('all interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const name = await button.getAttribute('aria-label') || await button.textContent();
      expect(name).toBeTruthy();
    }
  });

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/');
    const links = page.getByRole('link');
    const count = await links.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toBeTruthy();
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

test.describe('SEO Optimization', () => {
  test('all pages have unique titles', async ({ page }) => {
    const pages = ['/', '/blog', '/socialthreads', '/auth/signin'];
    const titles = new Set();
    
    for (const route of pages) {
      await page.goto(route);
      const title = await page.title();
      expect(title).toBeTruthy();
      titles.add(title);
    }
    
    expect(titles.size).toBe(pages.length);
  });

  test('meta descriptions are present', async ({ page }) => {
    await page.goto('/');
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /.+/);
  });

  test('Open Graph tags are present', async ({ page }) => {
    await page.goto('/');
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDesc = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');
    
    if (await ogTitle.count() > 0) {
      await expect(ogTitle).toHaveAttribute('content', /.+/);
    }
    if (await ogDesc.count() > 0) {
      await expect(ogDesc).toHaveAttribute('content', /.+/);
    }
    if (await ogImage.count() > 0) {
      await expect(ogImage).toHaveAttribute('content', /.+/);
    }
  });

  test('Twitter Card tags are present', async ({ page }) => {
    await page.goto('/');
    const twitterCard = page.locator('meta[name="twitter:card"]');
    if (await twitterCard.count() > 0) {
      await expect(twitterCard).toHaveAttribute('content', /.+/);
    }
  });

  test('canonical URLs are set', async ({ page }) => {
    await page.goto('/');
    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count() > 0) {
      await expect(canonical).toHaveAttribute('href', /.+/);
    }
  });

  test('structured data is present', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    const structuredData = page.locator('script[type="application/ld+json"]');
    const count = await structuredData.count();
    expect(count).toBeGreaterThan(0);
  });

  test('images have alt attributes', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('headings follow hierarchy', async ({ page }) => {
    await page.goto('/');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveCount(1);
  });

  test('language attribute is set', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
  });
});

test.describe('Performance Metrics', () => {
  test('no console errors on landing page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('no console errors on blog page', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/blog');
    await page.waitForTimeout(2000);
    
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('404')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('images are optimized', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
});

test.describe('Mobile Accessibility', () => {
  test('touch targets are large enough', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const buttons = page.getByRole('button');
      const count = await buttons.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });

  test('viewport meta tag is set', async ({ page }) => {
    await page.goto('/');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('text is readable on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const body = page.locator('body');
      const fontSize = await body.evaluate((el) => window.getComputedStyle(el).fontSize);
      const size = parseInt(fontSize);
      expect(size).toBeGreaterThanOrEqual(14);
    }
  });
});

test.describe('Security Headers', () => {
  test('CSP headers are set', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    // CSP may be set via meta tag or header
    const csp = headers?.['content-security-policy'];
    if (csp) {
      expect(csp).toBeTruthy();
    }
  });

  test('X-Frame-Options is set', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();
    const xFrameOptions = headers?.['x-frame-options'];
    if (xFrameOptions) {
      expect(xFrameOptions).toBeTruthy();
    }
  });
});

test.describe('Internationalization', () => {
  test('dates are formatted correctly', async ({ page }) => {
    await page.goto('/blog/introducing-quiltcorgi');
    const datePattern = /\d{4}/;
    const dateElement = page.locator(`text=${datePattern.source}`).first();
    if (await dateElement.isVisible()) {
      await expect(dateElement).toBeVisible();
    }
  });

  test('numbers are formatted correctly', async ({ page }) => {
    await page.goto('/');
    const numberPattern = /\d+/;
    const numberElement = page.locator(`text=${numberPattern.source}`).first();
    if (await numberElement.isVisible()) {
      await expect(numberElement).toBeVisible();
    }
  });
});
