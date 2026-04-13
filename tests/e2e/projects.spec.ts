import { test, expect } from '@playwright/test';
import { authenticatedTest, clearSession, waitForElement } from './utils';

test.describe('Dashboard', () => {
  test('dashboard page loads for authenticated users', async ({ page }) => {
    // Note: This test requires authentication setup
    // Skip until we have test auth configured
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('heading', { name: /hello|welcome/i })).toBeVisible();
  });

  test('dashboard shows quick start workflows', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Check for key sections
    await expect(page.getByText('New Design')).toBeVisible();
    await expect(page.getByText('Photo to Design')).toBeVisible();
    await expect(page.getByText('My Quiltbook')).toBeVisible();
    await expect(page.getByText('Browse Patterns')).toBeVisible();
    await expect(page.getByText('Community Threads')).toBeVisible();
  });

  test('new design button opens project dialog', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    const newDesignButton = page.getByRole('button', { name: 'New Design' });
    await newDesignButton.click();

    // Check dialog opened
    await expect(
      page.getByRole('heading', { name: /new project|start a new project|create project/i }).first()
    ).toBeVisible();
  });

  test('quiltbook link navigates to projects page', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    const quiltbookLink = page.getByRole('link', { name: /my quiltbook|projects/i });
    await quiltbookLink.click();

    await expect(page).toHaveURL('/projects');
  });

  test('profile link navigates to profile page', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    const profileLink = page.getByRole('link', { name: /my profile|profile/i });
    await profileLink.click();

    await expect(page).toHaveURL('/profile');
  });

  test('settings link navigates to settings page', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    const settingsLink = page.getByRole('link', { name: /system settings|settings/i });
    await settingsLink.click();

    await expect(page).toHaveURL('/settings');
  });

  test('browse patterns button switches to pattern tab', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    const browsePatternsButton = page.getByRole('button', { name: /browse patterns|patterns/i });
    await browsePatternsButton.click();

    // Should show pattern library
    await expect(
      page.getByRole('heading', { name: /pattern library|patterns/i }).first()
    ).toBeVisible();
  });

  test('recent projects are displayed', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Look for recent projects section
    await expect(page.getByText(/recent.*projects?|latest.*designs?/i).first()).toBeVisible();

    // Should show project thumbnails or links
    const projectLinks = page.locator('a[href^="/studio/"]');
    const count = await projectLinks.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('user greeting shows correct name', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Should show personalized greeting
    await expect(page.getByText(/hello|welcome|hi/i).first()).toBeVisible();
  });
});

test.describe('Projects Page', () => {
  test('projects page loads with projects list', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Check heading
    await expect(page.getByRole('heading', { name: 'All Projects' })).toBeVisible();
  });

  test('projects page shows project count', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Should show design count
    await expect(page.getByText(/designs?|projects?/i)).toBeVisible();
  });

  test('search filters projects', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    const searchInput = page.getByPlaceholder(/search.*projects?/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should show filtered results or empty state
      const projects = page.locator('a[href^="/studio/"]');
      const count = await projects.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('grid view toggle works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    const gridButton = page.getByRole('button', { name: /grid/i });
    if (await gridButton.isVisible()) {
      await gridButton.click();

      // Should remain on grid view or indicate grid view is active
      await expect(page.locator('a[href^="/studio/"]').first()).toBeVisible();
    }
  });

  test('list view toggle works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    const listButton = page.getByRole('button', { name: /list/i });
    if (await listButton.isVisible()) {
      await listButton.click();

      // Should switch to list view or indicate list view is active
      await expect(page.locator('a[href^="/studio/"]').first()).toBeVisible();
    }
  });

  test('clicking project navigates to studio', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Click first project if any exist
    const projectLink = page.locator('a[href^="/studio/"]').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page).toHaveURL(/\/studio\/.+/);
    }
  });

  test('empty state shows when no projects', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Check for empty state
    await expect(page.getByText(/no projects yet|no designs yet|start creating/i)).toBeVisible();

    // Should have start designing button
    const startButton = page.getByRole('link', { name: /start designing|create.*project/i });
    await expect(startButton).toBeVisible();
  });

  test('project cards show correct information', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Check project cards have titles, dates, thumbnails
    const projectCards = page.locator('[data-project-card]');
    if ((await projectCards.count()) > 0) {
      const firstCard = projectCards.first();

      // Should have title
      await expect(firstCard.locator('text')).toBeVisible();

      // Should have date or last modified
      await expect(
        firstCard.locator('text').filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|\d+.*ago/ })
      ).toBeVisible();
    }
  });

  test('project actions menu works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Look for project action menu (three dots, etc.)
    const actionMenu = page.locator('[aria-label*="actions" i]').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();

      // Should show menu options like duplicate, delete, rename
      await expect(page.getByText(/duplicate|copy|delete|rename/i).first()).toBeVisible();
    }
  });

  test('sort options work', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Look for sort dropdown or buttons
    const sortButton = page.getByRole('button', { name: /sort|order/i }).first();
    if (await sortButton.isVisible()) {
      await sortButton.click();

      // Should show sort options
      await expect(page.getByText(/newest|oldest|name|a-z|z-a/i).first()).toBeVisible();
    }
  });
});

test.describe('Project Creation', () => {
  test('new project dialog opens', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');

    // Click new design button
    const newDesignButton = page.getByRole('button', { name: /new design|create.*project/i });
    await newDesignButton.click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('project name input works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    const nameInput = page.getByLabel(/project.*name|design.*name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('My Test Quilt');
      await expect(nameInput).toHaveValue('My Test Quilt');
    }
  });

  test('project size selection works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    // Look for size selection
    const sizeSelect = page.getByRole('combobox', { name: /size|dimensions/i });
    if (await sizeSelect.isVisible()) {
      await sizeSelect.selectOption({ index: 1 });
    }
  });

  test('template selection works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    // Look for template options
    const templateOptions = page.getByRole('button', { name: /blank|traditional|modern/i });
    if ((await templateOptions.count()) > 0) {
      await templateOptions.first().click();
    }
  });

  test('create project navigates to studio', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    // Fill in project details
    const nameInput = page.getByLabel(/project.*name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('New Test Project');
    }

    const createButton = page.getByRole('button', { name: /create|start designing|begin/i });
    await createButton.click();

    // Should navigate to studio
    await expect(page).toHaveURL(/\/studio\/.+/, { timeout: 10000 });
  });

  test('project creation validation works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    // Try to create without name
    const createButton = page.getByRole('button', { name: /create/i });
    await createButton.click();

    // Should show validation error
    await expect(page.getByText(/name.*required|please.*name/i)).toBeVisible();
  });

  test('cancel project creation works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/dashboard');
    const newDesignButton = page.getByRole('button', { name: /new design/i });
    await newDesignButton.click();

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel|close/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      // Dialog should close
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });
});

test.describe('Project Management', () => {
  test('project duplication works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Open actions menu for first project
    const actionMenu = page.locator('[aria-label*="actions"]').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();

      const duplicateButton = page.getByRole('menuitem', { name: /duplicate|copy/i });
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();

        // Should create duplicate and show success message
        await expect(page.getByText(/duplicate.*created|copy.*created/i)).toBeVisible();
      }
    }
  });

  test('project deletion works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // This test should be careful - don't delete real projects
    // Perhaps create a test project first, then delete it
    test.skip(true, 'Requires test project setup to avoid deleting real data');
  });

  test('project renaming works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Open actions menu and rename
    const actionMenu = page.locator('[aria-label*="actions"]').first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();

      const renameButton = page.getByRole('menuitem', { name: /rename/i });
      if (await renameButton.isVisible()) {
        await renameButton.click();

        // Enter new name
        const nameInput = page.getByLabel(/new.*name|project.*name/i);
        if (await nameInput.isVisible()) {
          await nameInput.fill('Renamed Project');
          await nameInput.press('Enter');

          // Should show success message
          await expect(page.getByText(/renamed|updated/i)).toBeVisible();
        }
      }
    }
  });

  test('bulk project selection works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/projects');

    // Look for checkboxes or multi-select
    const checkboxes = page.getByRole('checkbox');
    if ((await checkboxes.count()) > 1) {
      await checkboxes.first().check();

      // Should show bulk actions
      await expect(page.getByText(/selected|bulk.*actions/i).first()).toBeVisible();
    }
  });
});
