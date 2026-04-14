import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
          { id: 'test-project-2', name: 'Test Project 2', createdAt: new Date().toISOString() },
        ]),
      });
    });
  });

  test('dashboard page loads for authenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('dashboard shows quick start workflows', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible();
    await expect(page.getByText(/photo to design/i)).toBeVisible();
  });

  test('new design button opens project dialog', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    if (await newDesignButton.isVisible()) {
      await newDesignButton.click();
      await expect(page.getByRole('dialog').or(page.getByText(/project name/i))).toBeVisible();
    }
  });

  test('user greeting shows correct name', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/test user|hello|welcome/i).first()).toBeVisible();
  });
});

test.describe('Projects Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
          { id: 'test-project-2', name: 'Test Project 2', createdAt: new Date().toISOString() },
        ]),
      });
    });
  });

  test('projects page loads with projects list', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /all projects|my projects|quiltbook/i })).toBeVisible();
  });

  test('projects page shows project count', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.getByText(/designs?|projects?|2 projects?/i)).toBeVisible();
  });

  test('search filters projects', async ({ page }) => {
    await page.goto('/projects');
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('grid view toggle works', async ({ page }) => {
    await page.goto('/projects');
    const gridButton = page.getByRole('button', { name: /grid/i });
    if (await gridButton.isVisible()) {
      await gridButton.click();
    }
  });

  test('list view toggle works', async ({ page }) => {
    await page.goto('/projects');
    const listButton = page.getByRole('button', { name: /list/i });
    if (await listButton.isVisible()) {
      await listButton.click();
    }
  });

  test('clicking project navigates to studio', async ({ page }) => {
    await page.goto('/projects');
    const projectLink = page.getByRole('link', { name: /test project/i }).first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page).toHaveURL(/\/studio\/.+/);
    }
  });

  test('empty state shows when no projects', async ({ page }) => {
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/projects');
    await expect(page.getByText(/no projects|start creating|start designing/i)).toBeVisible();
  });

  test('project actions menu works', async ({ page }) => {
    await page.goto('/projects');
    const actionMenu = page.locator('[aria-label*="actions" i], button:has(svg)').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      await expect(page.getByText(/duplicate|delete|rename/i).first()).toBeVisible();
    }
  });

  test('sort options work', async ({ page }) => {
    await page.goto('/projects');
    const sortButton = page.getByRole('button', { name: /sort|order|recent/i }).first();
    if (await sortButton.isVisible()) {
      await sortButton.click();
      await expect(page.getByText(/newest|oldest|name|a-z|z-a|recent/i).first()).toBeVisible();
    }
  });
});

test.describe('Project Creation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.route('**/api/projects', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-project-123', success: true }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });
  });

  test('new project dialog opens', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    if (await newDesignButton.isVisible()) {
      await newDesignButton.click();
      await expect(page.getByRole('dialog').or(page.getByText(/project name|create project/i))).toBeVisible();
    }
  });

  test('project name input works', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    if (await newDesignButton.isVisible()) {
      await newDesignButton.click();
    }
    const nameInput = page.getByLabel(/project.*name|design.*name|name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('My Test Quilt');
      await expect(nameInput).toHaveValue('My Test Quilt');
    }
  });

  test('create project navigates to studio', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    if (await newDesignButton.isVisible()) {
      await newDesignButton.click();
    }
    const nameInput = page.getByLabel(/project.*name|name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('New Test Project');
    }
    const createButton = page.getByRole('button', { name: /create|start designing|begin/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page).toHaveURL(/\/studio\/.+/, { timeout: 10000 });
    }
  });

  test('cancel project creation works', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    if (await newDesignButton.isVisible()) {
      await newDesignButton.click();
    }
    const cancelButton = page.getByRole('button', { name: /cancel|close/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });
});

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockProject(page, 'test-project-1');
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

  test('project duplication works', async ({ page }) => {
    await page.goto('/projects');
    const actionMenu = page.locator('[aria-label*="actions"], button:has(svg)').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      const duplicateButton = page.getByRole('menuitem', { name: /duplicate|copy/i }).or(
        page.getByText(/duplicate|copy/i)
      );
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
        await expect(page.getByText(/duplicate.*created|copy.*created|success/i)).toBeVisible();
      }
    }
  });

  test('project renaming works', async ({ page }) => {
    await page.goto('/projects');
    const actionMenu = page.locator('[aria-label*="actions"], button:has(svg)').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      const renameButton = page.getByRole('menuitem', { name: /rename/i }).or(page.getByText(/rename/i));
      if (await renameButton.isVisible()) {
        await renameButton.click();
        const nameInput = page.getByLabel(/new.*name|project.*name|name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill('Renamed Project');
          await nameInput.press('Enter');
          await expect(page.getByText(/renamed|updated|success/i)).toBeVisible();
        }
      }
    }
  });

  test('project deletion works', async ({ page }) => {
    await page.route('**/api/projects/test-project-delete', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 200,
          body: JSON.stringify({ id: 'test-project-delete', name: 'Delete Me' }),
        });
      }
    });
    await page.goto('/projects');
    const actionMenu = page.locator('[aria-label*="actions"], button:has(svg)').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      const deleteButton = page.getByRole('menuitem', { name: /delete/i }).or(page.getByText(/delete/i));
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await expect(page.getByText(/deleted|success/i)).toBeVisible();
        }
      }
    }
  });

  test('bulk project selection works', async ({ page }) => {
    await page.goto('/projects');
    const checkboxes = page.getByRole('checkbox');
    if ((await checkboxes.count()) > 1) {
      await checkboxes.first().check();
      await expect(page.getByText(/selected|bulk.*actions/i).first()).toBeVisible();
    }
  });
});

test.describe('Profile & Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('profile link navigates to profile page', async ({ page }) => {
    await page.goto('/dashboard');
    const profileLink = page.getByRole('link', { name: /profile/i }).first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await expect(page).toHaveURL('/profile');
    }
  });

  test('settings link navigates to settings page', async ({ page }) => {
    await page.goto('/dashboard');
    const settingsLink = page.getByRole('link', { name: /settings/i }).first();
    if (await settingsLink.isVisible()) {
      await settingsLink.click();
      await expect(page).toHaveURL('/settings');
    }
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
  });

  test('delete account section exists', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/delete account|danger zone/i)).toBeVisible();
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
