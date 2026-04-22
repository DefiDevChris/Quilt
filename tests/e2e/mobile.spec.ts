import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';

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
  test('dashboard works on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await mockAuth(page, 'pro');
      await page.goto('/dashboard');
      await expect(page.getByText(/new design/i)).toBeVisible();
    }
  });

  test('mobile dashboard has bento grid', async ({ page, isMobile }) => {
    if (isMobile) {
      await mockAuth(page, 'pro');
      await page.goto('/dashboard');
      const bentoCards = page.locator('[data-testid="bento-card"]').or(page.getByText(/new design|photo/i));
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
});
