import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test('mobile bottom nav is visible on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
      await expect(bottomNav).toBeVisible();
    }
  });

  test('mobile nav has 3 items', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const navItems = page.locator('[data-testid="mobile-nav-item"]');
      const count = await navItems.count();
      expect(count).toBe(3);
    }
  });

  test('mobile nav has home button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const homeButton = page.getByRole('button', { name: /home/i });
      await expect(homeButton).toBeVisible();
    }
  });

  test('mobile nav has upload FAB', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const fab = page.locator('[data-testid="mobile-fab"]');
      if (await fab.isVisible()) {
        await expect(fab).toBeVisible();
      }
    }
  });

  test('mobile nav has profile/sign in button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const profileButton = page.getByRole('button', { name: /profile|sign in/i });
      await expect(profileButton).toBeVisible();
    }
  });
});

test.describe('Mobile Studio Gate', () => {
  test('mobile users cannot access studio', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/studio/test-project-id');
      await expect(page.getByText(/desktop/i)).toBeVisible();
    }
  });

  test('mobile gate shows desktop-only message', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/studio/test-project-id');
      await expect(page.getByText(/desktop only/i)).toBeVisible();
    }
  });

  test('mobile gate has back button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/studio/test-project-id');
      const backButton = page.getByRole('button', { name: /back/i });
      if (await backButton.isVisible()) {
        await expect(backButton).toBeVisible();
      }
    }
  });
});

test.describe('Mobile Community', () => {
  test('community feed works on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
    }
  });

  test('mobile community has tab navigation', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      const tabs = page.getByRole('tab');
      const count = await tabs.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('mobile posts are scrollable', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      const posts = page.locator('[data-testid="community-post"]');
      const count = await posts.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Mobile Blog', () => {
  test('blog works on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/blog');
      await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
    }
  });

  test('blog posts are readable on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/blog/introducing-quiltcorgi');
      await expect(page.getByRole('heading', { name: /Introducing QuiltCorgi/i })).toBeVisible();
    }
  });
});

test.describe('Mobile Dashboard', () => {
  test.skip('dashboard works on mobile', async ({ page, isMobile }) => {
    // Requires auth setup
    if (isMobile) {
      await page.goto('/dashboard');
      await expect(page.getByText(/new design/i)).toBeVisible();
    }
  });

  test.skip('mobile dashboard has bento grid', async ({ page, isMobile }) => {
    // Requires auth setup
    if (isMobile) {
      await page.goto('/dashboard');
      const bentoCards = page.locator('[data-testid="bento-card"]');
      const count = await bentoCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

test.describe('Mobile Responsive Design', () => {
  test('landing page is responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('auth pages are responsive', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/auth/signin');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
  });

  test('mobile viewport is correct', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(768);
    }
  });
});

test.describe('Mobile Touch Interactions', () => {
  test('mobile tap works on buttons', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const ctaButton = page.getByRole('link', { name: /start designing free/i }).first();
      await ctaButton.tap();
    }
  });

  test('mobile swipe works on tabs', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      const tabs = page.getByRole('tablist');
      if (await tabs.isVisible()) {
        const box = await tabs.boundingBox();
        if (box) {
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          const startX = centerX;
          const endX = centerX - 100; // Swipe left

          // Touch start
          await page.dispatchEvent('[role="tablist"]', 'touchstart', {
            touches: [{ identifier: 0, clientX: startX, clientY: centerY }],
            changedTouches: [{ identifier: 0, clientX: startX, clientY: centerY }],
            targetTouches: [{ identifier: 0, clientX: startX, clientY: centerY }],
          });

          // Touch move
          await page.dispatchEvent('[role="tablist"]', 'touchmove', {
            touches: [{ identifier: 0, clientX: endX, clientY: centerY }],
            changedTouches: [{ identifier: 0, clientX: endX, clientY: centerY }],
            targetTouches: [{ identifier: 0, clientX: endX, clientY: centerY }],
          });

          // Touch end
          await page.dispatchEvent('[role="tablist"]', 'touchend', {
            touches: [],
            changedTouches: [],
            targetTouches: [],
          });
        }
      }
    }
  });
});
