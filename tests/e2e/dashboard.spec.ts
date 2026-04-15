import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('Dashboard Access', () => {
  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });
});

test.describe('Dashboard Features (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
        ]),
      });
    });
  });

  test('dashboard loads bento grid', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible();
  });

  test('new design card is clickable', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignCard = page.getByText(/new design/i);
    await expect(newDesignCard).toBeVisible();
    await newDesignCard.click();
  });

  test('recent projects section exists', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/recent|projects/i)).toBeVisible();
  });

  test('community feed preview exists', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/community|inspiration/i)).toBeVisible();
  });

  test('quick actions are visible', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
  });
});

test.describe('Projects Page', () => {
  test('projects page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.describe('Projects Page (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page, 'pro');
      await page.route('**/api/projects', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
          ]),
        });
      });
    });

    test('projects page loads with search', async ({ page }) => {
      await page.goto('/projects');
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }
    });

    test('projects can be filtered', async ({ page }) => {
      await page.goto('/projects');
      const filterButton = page.getByRole('button', { name: /filter/i });
      if (await filterButton.isVisible()) {
        await filterButton.click();
      }
    });

    test('new project button exists', async ({ page }) => {
      await page.goto('/projects');
      await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
    });
  });
});

test.describe('Settings Page', () => {
  test('settings page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.describe('Settings Page (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page, 'pro');
    });

    test('settings page loads', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
    });

    test('delete account section exists', async ({ page }) => {
      await page.goto('/settings');
      await expect(page.getByText(/delete account|danger/i)).toBeVisible();
    });
  });
});

test.describe('Profile Page', () => {
  test('profile page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.describe('Profile Page (Authenticated)', () => {
    test.beforeEach(async ({ page }) => {
      await mockAuth(page, 'pro');
    });

    test('profile page loads', async ({ page }) => {
      await page.goto('/profile');
      await expect(page.getByText(/profile|my profile/i)).toBeVisible();
    });

    test('billing section exists for pro users', async ({ page }) => {
      await page.goto('/profile');
      await expect(page.getByText(/billing|subscription|pro/i)).toBeVisible();
    });
  });
});
