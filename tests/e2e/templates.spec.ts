import { test, expect } from '@playwright/test';

test.describe('Project Templates', () => {
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

  test.skip('can create template from project', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    await expect(page.getByPlaceholder(/template name/i)).toBeVisible();
  });

  test.skip('template creation dialog has required fields', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    
    await expect(page.getByPlaceholder(/template name/i)).toBeVisible();
    await expect(page.getByPlaceholder(/description/i)).toBeVisible();
  });

  test.skip('can save template', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    
    await page.getByPlaceholder(/template name/i).fill('Test Template');
    await page.getByPlaceholder(/description/i).fill('Test Description');
    
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();
    
    await expect(page.getByText(/template saved/i)).toBeVisible();
  });

  test.skip('templates list shows saved templates', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    const templates = page.locator('[data-testid="template-card"]');
    const count = await templates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test.skip('can create project from template', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    const template = page.locator('[data-testid="template-card"]').first();
    await template.click();
    
    const useButton = page.getByRole('button', { name: /use template/i });
    await useButton.click();
    
    await expect(page).toHaveURL(/\/studio\/.+/);
  });

  test.skip('can edit template', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    const template = page.locator('[data-testid="template-card"]').first();
    await template.hover();
    
    const editButton = page.getByRole('button', { name: /edit/i });
    await editButton.click();
    
    await expect(page.getByPlaceholder(/template name/i)).toBeVisible();
  });

  test.skip('can delete template', async ({ page }) => {
    // Requires auth setup
    await page.goto('/templates');
    const template = page.locator('[data-testid="template-card"]').first();
    await template.hover();
    
    const deleteButton = page.getByRole('button', { name: /delete/i });
    await deleteButton.click();
    
    await expect(page.getByText(/confirm/i)).toBeVisible();
  });
});

test.describe('Template Settings', () => {
  test.skip('template includes canvas dimensions', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    
    await expect(page.getByText(/dimensions/i)).toBeVisible();
  });

  test.skip('template includes grid settings', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    
    await expect(page.getByText(/grid/i)).toBeVisible();
  });

  test.skip('template includes layout type', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const saveAsTemplateButton = page.getByRole('button', { name: /save as template/i });
    await saveAsTemplateButton.click();
    
    await expect(page.getByText(/layout/i)).toBeVisible();
  });
});

test.describe('Template API', () => {
  test('template API requires authentication', async ({ request }) => {
    const response = await request.get('/api/project-templates');
    expect(response.status()).toBe(401);
  });

  test('template creation requires authentication', async ({ request }) => {
    const response = await request.post('/api/project-templates', {
      data: { name: 'Test', description: 'Test' }
    });
    expect(response.status()).toBe(401);
  });
});
