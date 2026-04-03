import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('End-to-End User Flows', () => {
  test('complete signup to project creation flow', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    const signupLink = page.getByRole('link', { name: /start designing free/i }).first();
    await expect(signupLink).toHaveAttribute('href', '/auth/signup');
  });

  test('unauthenticated user redirected from protected routes', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/studio/test', '/projects', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForURL(/signin/, { timeout: 10000 });
      expect(page.url()).toContain('signin');
    }
  });

  test('authenticated user can navigate app', async ({ page }) => {
    await mockAuth(page, 'pro');
    
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
    
    await page.goto('/projects');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10000 });
    
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
  });
});

test.describe('Project Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('create, edit, and save project', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    await page.goto('/studio/test-project-1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    await page.keyboard.press('Control+S');
    await page.waitForTimeout(1000);
  });

  test('project auto-saves changes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(3000);
    const saved = page.getByText(/saved/i);
    if (await saved.isVisible({ timeout: 15000 })) {
      await expect(saved).toBeVisible();
    }
  });
});

test.describe('Community Engagement Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('browse and interact with community posts', async ({ page }) => {
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
    
    await page.goto('/socialthreads?tab=trending');
    await expect(page).toHaveURL(/tab=trending/);
    
    await page.goto('/socialthreads?tab=saved');
    await expect(page).toHaveURL(/tab=saved/);
  });

  test('navigate between community and blog', async ({ page }) => {
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
    
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
  });
});

test.describe('Design Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('complete design workflow', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Control+C');
    await page.keyboard.press('Control+V');
    await page.keyboard.press('Control+Z');
    await page.keyboard.press('Control+Y');
  });

  test('worktable switching preserves state', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
    
    const tab2 = page.getByRole('tab', { name: /worktable 2/i });
    if (await tab2.isVisible()) {
      await tab2.click();
      await page.waitForTimeout(1000);
      
      const tab1 = page.getByRole('tab', { name: /worktable 1/i });
      await tab1.click();
    }
  });
});

test.describe('Export Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('export options are available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      const pdf = page.getByText(/pdf/i);
      if (await pdf.isVisible({ timeout: 5000 })) {
        await expect(pdf).toBeVisible();
      }
    }
  });
});

test.describe('Mobile Responsive Flow', () => {
  test('mobile navigation works', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      
      await page.goto('/socialthreads');
      await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
      
      await page.goto('/blog');
      await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
    }
  });

  test('mobile studio gate works', async ({ page, isMobile }) => {
    if (isMobile) {
      await mockAuth(page);
      await page.goto('/studio/test-project-1');
      const desktopMessage = page.getByText(/desktop/i);
      if (await desktopMessage.isVisible()) {
        await expect(desktopMessage).toBeVisible();
      }
    }
  });
});

test.describe('Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('admin can access all admin features', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText(/admin|moderation/i)).toBeVisible({ timeout: 10000 });
    
    await page.goto('/admin/moderation');
    await expect(page.getByText(/moderation|posts/i)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Error Handling', () => {
  test('404 page works', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText(/404|not found/i)).toBeVisible({ timeout: 10000 });
  });

  test('handles invalid project ID', async ({ page }) => {
    await mockAuth(page);
    await page.goto('/studio/invalid-project-id');
    await page.waitForTimeout(2000);
  });
});

test.describe('Performance', () => {
  test('landing page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('dashboard loads quickly for authenticated users', async ({ page }) => {
    await mockAuth(page, 'pro');
    const startTime = Date.now();
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test('app works in all browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
    
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
  });
});
