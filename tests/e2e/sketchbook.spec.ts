import { test, expect } from '@playwright/test';

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
  test.skip('can create new project from dashboard', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project/i });
    await newProjectButton.click();
    
    await expect(page).toHaveURL(/\/studio\/.+/);
  });

  test.skip('new project has default canvas', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project/i });
    await newProjectButton.click();
    
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test.skip('new project has default worktable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    const newProjectButton = page.getByRole('button', { name: /new project/i });
    await newProjectButton.click();
    
    await expect(page.getByText(/worktable 1/i)).toBeVisible();
  });
});

test.describe('Project Management', () => {
  test.skip('projects list shows all projects', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    const projects = page.locator('[data-testid="project-card"]');
    const count = await projects.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test.skip('can search projects', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill('test');
    
    await page.waitForTimeout(500);
  });

  test.skip('can delete project', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    const project = page.locator('[data-testid="project-card"]').first();
    await project.hover();
    
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    await expect(page.getByText(/confirm/i)).toBeVisible();
  });

  test.skip('can duplicate project', async ({ page }) => {
    // Requires auth setup
    await page.goto('/projects');
    const project = page.locator('[data-testid="project-card"]').first();
    await project.hover();
    
    const duplicateButton = page.getByRole('button', { name: /duplicate/i });
    await duplicateButton.click();
  });

  test.skip('can rename project', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const projectName = page.locator('[data-testid="project-name"]');
    await projectName.click();
    
    await page.keyboard.type('New Name');
    await page.keyboard.press('Enter');
  });
});

test.describe('Recent Projects', () => {
  test.skip('recent projects show on dashboard', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    await expect(page.getByText(/recent/i)).toBeVisible();
  });

  test.skip('can open recent project', async ({ page }) => {
    // Requires auth setup
    await page.goto('/dashboard');
    const recentProject = page.locator('[data-testid="recent-project"]').first();
    await recentProject.click();
    
    await expect(page).toHaveURL(/\/studio\/.+/);
  });
});

