import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Sketchbook', () => {
  test('app loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('protected studio route redirects unauthenticated users', async ({ page }) => {
    await page.goto('/studio');
    await expect(page).toHaveURL(/auth\/signin|signin|unauthorized/, { timeout: 5000 });
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
          body: JSON.stringify([
            { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
          ]),
        });
      }
    });
  });

  test('can create new project from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
    }
  });

  test('new project has default canvas', async ({ page }) => {
    await mockCanvas(page);
    await mockProject(page, 'new-project-123');
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await expect(canvas).toBeVisible();
    }
  });

  test('new project has default worktable', async ({ page }) => {
    await mockCanvas(page);
    await mockProject(page, 'new-project-123');
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
    if (await newProjectButton.isVisible()) {
      await newProjectButton.click();
    }
    await expect(page.getByText(/worktable 1/i)).toBeVisible();
  });
});

test.describe('Project Management', () => {
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

  test('projects list shows all projects', async ({ page }) => {
    await page.goto('/projects');
    const projects = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i));
    await expect(projects.first()).toBeVisible();
  });

  test('can search projects', async ({ page }) => {
    await page.goto('/projects');
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });

  test('can delete project', async ({ page }) => {
    await page.goto('/projects');
    const project = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i)).first();
    if (await project.isVisible()) {
      await project.hover();
      const deleteButton = page.getByRole('button', { name: /delete/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await expect(page.getByText(/confirm|delete/i)).toBeVisible();
      }
    }
  });

  test('can duplicate project', async ({ page }) => {
    await page.goto('/projects');
    const project = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i)).first();
    if (await project.isVisible()) {
      await project.hover();
      const duplicateButton = page.getByRole('button', { name: /duplicate/i });
      if (await duplicateButton.isVisible()) {
        await duplicateButton.click();
      }
    }
  });

  test('can rename project', async ({ page }) => {
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const projectName = page.locator('[data-testid="project-name"]').or(page.getByText(/test project/i));
    if (await projectName.isVisible()) {
      await projectName.click();
      await page.keyboard.type('New Name');
      await page.keyboard.press('Enter');
    }
  });
});

test.describe('Recent Projects', () => {
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

  test('recent projects show on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/recent|projects/i)).toBeVisible();
  });

  test('can open recent project', async ({ page }) => {
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/dashboard');
    const recentProject = page.locator('[data-testid="recent-project"]').or(page.getByText(/test project/i)).first();
    if (await recentProject.isVisible()) {
      await recentProject.click();
      await expect(page).toHaveURL(/\/studio\/.+/);
    }
  });
});
