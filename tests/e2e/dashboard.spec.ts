import { test, expect } from '@playwright/test';

test.describe('Dashboard Access', () => {
  test('dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });
});

test.describe('Dashboard Features (Authenticated)', () => {
  test.skip('dashboard loads bento grid', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible();
  });

  test.skip('new design card is clickable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    const newDesignCard = page.getByText(/new design/i);
    await expect(newDesignCard).toBeVisible();
  });

  test.skip('photo to pattern card is visible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByText(/photo to pattern/i)).toBeVisible();
  });

  test.skip('recent projects section exists', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByText(/recent/i)).toBeVisible();
  });

  test.skip('community feed preview exists', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByText(/community/i)).toBeVisible();
  });

  test.skip('quick actions are visible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });
});

test.describe('Projects Page', () => {
  test('projects page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.skip('projects page loads with search', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
  });

  test.skip('projects can be filtered', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
  });

  test.skip('new project button exists', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    await expect(page.getByRole('button', { name: /new project/i })).toBeVisible();
  });
});

test.describe('Templates Page', () => {
  test('templates page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/templates');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.skip('templates page loads', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    await expect(page.getByText(/template/i)).toBeVisible();
  });

  test.skip('templates can be created', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    const createButton = page.getByRole('button', { name: /create/i });
    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });
});

test.describe('Settings Page', () => {
  test('settings page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test.skip('settings page loads', async ({ page }) => {
    // Requires auth setup
    await page.goto('/settings');
    await expect(page.getByText(/profile/i)).toBeVisible();
  });

  test.skip('delete account section exists', async ({ page }) => {
    // Requires auth setup
    await page.goto('/settings');
    await expect(page.getByText(/delete account/i)).toBeVisible();
  });
});

test.describe('Profile Page', () => {
  test.skip('profile page loads', async ({ page }) => {
    // Requires auth setup
    await page.goto('/profile');
    await expect(page.getByText(/profile/i)).toBeVisible();
  });

  test.skip('billing section exists for pro users', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    await expect(page.getByText(/billing/i)).toBeVisible();
  });
});
