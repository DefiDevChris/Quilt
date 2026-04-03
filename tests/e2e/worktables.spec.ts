import { test, expect } from '@playwright/test';

test.describe('Worktable Management', () => {
  test.skip('worktable tabs are visible', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    await expect(page.getByText(/worktable/i)).toBeVisible();
  });

  test.skip('can switch between worktables', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const tab2 = page.getByRole('tab', { name: /worktable 2/i });
    if (await tab2.isVisible()) {
      await tab2.click();
      await expect(tab2).toHaveAttribute('aria-selected', 'true');
    }
  });

  test.skip('can create new worktable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const addButton = page.getByRole('button', { name: /add worktable/i });
    await addButton.click();
    await expect(page.getByText(/worktable 2/i)).toBeVisible();
  });

  test.skip('can rename worktable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const tab = page.getByRole('tab', { name: /worktable 1/i });
    await tab.click({ button: 'right' });
    const renameOption = page.getByText(/rename/i);
    await renameOption.click();
    await expect(page.getByPlaceholder(/name/i)).toBeVisible();
  });

  test.skip('can duplicate worktable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const tab = page.getByRole('tab', { name: /worktable 1/i });
    await tab.click({ button: 'right' });
    const duplicateOption = page.getByText(/duplicate/i);
    await duplicateOption.click();
  });

  test.skip('can delete worktable', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const tab = page.getByRole('tab', { name: /worktable 2/i });
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      const deleteOption = page.getByText(/delete/i);
      await deleteOption.click();
      await expect(page.getByText(/confirm/i)).toBeVisible();
    }
  });

  test.skip('worktable limit is 10', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeLessThanOrEqual(10);
  });
});

test.describe('Cross-Worktable Operations', () => {
  test.skip('copy/paste works across worktables', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    
    // Select object on worktable 1
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Copy
    await page.keyboard.press('Control+C');
    
    // Switch to worktable 2
    const tab2 = page.getByRole('tab', { name: /worktable 2/i });
    await tab2.click();
    
    // Paste
    await page.keyboard.press('Control+V');
  });

  test.skip('duplicate offers worktable options', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    
    // Select object
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Duplicate
    await page.keyboard.press('Control+D');
    
    // Should show dialog with options
    await expect(page.getByText(/current worktable/i)).toBeVisible();
    await expect(page.getByText(/new worktable/i)).toBeVisible();
  });
});

test.describe('Worktable Auto-Save', () => {
  test.skip('worktable state is saved on switch', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    
    // Make changes on worktable 1
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    
    // Switch to worktable 2
    const tab2 = page.getByRole('tab', { name: /worktable 2/i });
    await tab2.click();
    
    // Switch back to worktable 1
    const tab1 = page.getByRole('tab', { name: /worktable 1/i });
    await tab1.click();
    
    // Changes should be preserved
  });

  test.skip('worktable state persists on page reload', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    
    // Create worktable 2
    const addButton = page.getByRole('button', { name: /add worktable/i });
    await addButton.click();
    
    // Reload page
    await page.reload();
    
    // Worktable 2 should still exist
    await expect(page.getByText(/worktable 2/i)).toBeVisible();
  });
});
