import { test, expect } from '@playwright/test';

test.describe('Photo to Pattern', () => {
  test.skip('photo to pattern dialog opens', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    await expect(page.getByText(/upload/i)).toBeVisible();
  });

  test.skip('can upload photo', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    await expect(page.getByText(/processing/i)).toBeVisible();
  });

  test.skip('piece detection runs on upload', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    await expect(page.getByText(/detecting pieces/i)).toBeVisible({ timeout: 10000 });
  });

  test.skip('detected pieces are shown', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    await expect(page.getByText(/pieces detected/i)).toBeVisible({ timeout: 15000 });
  });

  test.skip('can adjust detection sensitivity', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    const sensitivitySlider = page.locator('input[type="range"]');
    await expect(sensitivitySlider).toBeVisible({ timeout: 15000 });
  });

  test.skip('can recreate pattern in studio', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    const createButton = page.getByRole('button', { name: /create pattern/i });
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();
    
    await expect(page).toHaveURL(/\/studio\/.+/);
  });
});

test.describe('Photo to Pattern - Free Tier', () => {
  test.skip('free users see upgrade prompt', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to pattern/i);
    await photoButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });
});

test.describe('Pattern Import', () => {
  test.skip('pattern import dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const importButton = page.getByRole('button', { name: /import/i });
    await importButton.click();
    await expect(page.getByText(/import pattern/i)).toBeVisible();
  });

  test.skip('can import JSON pattern', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const importButton = page.getByRole('button', { name: /import/i });
    await importButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-pattern.json');
    
    await expect(page.getByText(/imported/i)).toBeVisible();
  });
});

test.describe('Reference Image', () => {
  test.skip('reference image dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    await expect(page.getByText(/upload/i)).toBeVisible();
  });

  test.skip('can upload reference image', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    await expect(page.locator('canvas')).toBeVisible();
  });

  test.skip('can adjust reference image opacity', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    const opacitySlider = page.locator('input[type="range"]');
    await expect(opacitySlider).toBeVisible();
  });

  test.skip('can lock/unlock reference image', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    const lockButton = page.getByRole('button', { name: /lock/i });
    await expect(lockButton).toBeVisible();
  });

  test.skip('can remove reference image', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./tests/fixtures/test-quilt-grid.png');
    
    const removeButton = page.getByRole('button', { name: /remove/i });
    await removeButton.click();
  });
});
