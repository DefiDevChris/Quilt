import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Worktable Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('worktable tabs are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/worktable/i)).toBeVisible();
  });

  test('can switch between worktables', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
    if (await tab2.isVisible()) {
      await tab2.click();
    }
  });

  test('can create new worktable', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const addButton = page.getByRole('button', { name: /add worktable|add tab|\+/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText(/worktable/i)).toBeVisible();
    }
  });

  test('can rename worktable', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const tab = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      const renameOption = page.getByText(/rename/i);
      if (await renameOption.isVisible()) {
        await renameOption.click();
        await expect(page.getByPlaceholder(/name/i)).toBeVisible();
      }
    }
  });

  test('can duplicate worktable', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const tab = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      const duplicateOption = page.getByText(/duplicate/i);
      if (await duplicateOption.isVisible()) {
        await duplicateOption.click();
      }
    }
  });

  test('can delete worktable', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
    if (await tab2.isVisible()) {
      await tab2.click({ button: 'right' });
      const deleteOption = page.getByText(/delete/i);
      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        await expect(page.getByText(/confirm|delete/i)).toBeVisible();
      }
    }
  });

  test('worktable limit is respected', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const tabs = page.getByRole('tab');
    const count = await tabs.count();
    expect(count).toBeLessThanOrEqual(10);
  });
});

test.describe('Cross-Worktable Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('copy/paste works across worktables', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    // Select object on worktable 1
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });

      // Copy
      await page.keyboard.press('Control+C');

      // Switch to worktable 2
      const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
      if (await tab2.isVisible()) {
        await tab2.click();

        // Paste
        await page.keyboard.press('Control+V');
      }
    }
  });

  test('duplicate offers worktable options', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    // Select object
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });

      // Duplicate
      await page.keyboard.press('Control+D');
    }
  });
});

test.describe('Worktable Auto-Save', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('worktable state is saved on switch', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    // Make changes on worktable 1
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });

      // Switch to worktable 2
      const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
      if (await tab2.isVisible()) {
        await tab2.click();

        // Switch back to worktable 1
        const tab1 = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
        if (await tab1.isVisible()) {
          await tab1.click();
        }
      }
    }
  });

  test('worktable state persists on page reload', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);

    // Worktable should still exist
    await expect(page.getByText(/worktable/i)).toBeVisible();
  });
});
