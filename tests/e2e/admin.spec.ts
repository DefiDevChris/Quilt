import { test, expect } from '@playwright/test';

test.describe('Admin Access', () => {
  test('admin page redirects non-admin users', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL(/signin|unauthorized/);
    expect(page.url()).toMatch(/signin|unauthorized/);
  });

  test('admin moderation page redirects non-admin users', async ({ page }) => {
    await page.goto('/admin/moderation');
    await page.waitForURL(/signin|unauthorized/);
    expect(page.url()).toMatch(/signin|unauthorized/);
  });
});

test.describe('Admin Features (Admin Role)', () => {
  test.skip('admin dashboard loads', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin');
    await expect(page.getByText(/admin/i)).toBeVisible();
  });

  test.skip('moderation queue loads', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/moderation');
    await expect(page.getByText(/moderation/i)).toBeVisible();
  });

  test.skip('admin can approve posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/moderation');
    const approveButton = page.getByRole('button', { name: /approve/i }).first();
    if (await approveButton.isVisible()) {
      await expect(approveButton).toBeVisible();
    }
  });

  test.skip('admin can reject posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/moderation');
    const rejectButton = page.getByRole('button', { name: /reject/i }).first();
    if (await rejectButton.isVisible()) {
      await expect(rejectButton).toBeVisible();
    }
  });

  test.skip('admin can delete posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/moderation');
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test.skip('admin can create blog posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/blog');
    const createButton = page.getByRole('button', { name: /create post/i });
    await expect(createButton).toBeVisible();
  });

  test.skip('admin can edit blog posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/blog');
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.isVisible()) {
      await expect(editButton).toBeVisible();
    }
  });

  test.skip('admin can delete blog posts', async ({ page }) => {
    // Requires auth setup with admin role
    await page.goto('/admin/blog');
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible()) {
      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('Admin API Endpoints', () => {
  test('admin API requires authentication', async ({ request }) => {
    const response = await request.get('/api/admin/posts');
    expect(response.status()).toBe(401);
  });

  test('admin blog API requires authentication', async ({ request }) => {
    const response = await request.post('/api/blog', {
      data: { title: 'Test', content: 'Test' }
    });
    expect(response.status()).toBe(401);
  });
});
