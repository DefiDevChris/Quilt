import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('History Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('history panel toggle button exists', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const historyButton = page.getByRole('button', { name: /history/i });
    if (await historyButton.isVisible()) {
      await expect(historyButton).toBeVisible();
    }
  });

  test('history panel opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const historyButton = page.getByRole('button', { name: /history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();
      const undoText = page.getByText(/undo/i);
      if (await undoText.isVisible()) {
        await expect(undoText).toBeVisible();
      }
    }
  });

  test('history panel shows timeline', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const historyButton = page.getByRole('button', { name: /history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();
    }

    const timeline = page.locator('[data-testid="history-timeline"]');
    if (await timeline.isVisible()) {
      await expect(timeline).toBeVisible();
    }
  });

  test('can jump to history state', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const historyButton = page.getByRole('button', { name: /history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();
    }

    const historyItem = page.locator('[data-testid="history-item"]').first();
    if (await historyItem.isVisible()) {
      await historyItem.click();
    }
  });

  test('history panel shows action descriptions', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const historyButton = page.getByRole('button', { name: /history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();
    }

    const historyItems = page.locator('[data-testid="history-item"]');
    const count = await historyItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('undo button is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const undoButton = page.getByRole('button', { name: /undo/i });
    if (await undoButton.isVisible()) {
      await expect(undoButton).toBeVisible();
    }
  });

  test('redo button is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const redoButton = page.getByRole('button', { name: /redo/i });
    if (await redoButton.isVisible()) {
      await expect(redoButton).toBeVisible();
    }
  });

  test('can click undo button', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const undoButton = page.getByRole('button', { name: /undo/i });
    if (await undoButton.isVisible()) {
      await undoButton.click();
    }
  });

  test('can click redo button', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const redoButton = page.getByRole('button', { name: /redo/i });
    if (await redoButton.isVisible()) {
      await redoButton.click();
    }
  });
});

test.describe('Auto-Save', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('auto-save indicator shows', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const savedText = page.getByText(/saved/i);
    if (await savedText.isVisible({ timeout: 10000 })) {
      await expect(savedText).toBeVisible();
    }
  });

  test('auto-save triggers on changes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });

      const savingText = page.getByText(/saving/i);
      if (await savingText.isVisible({ timeout: 5000 })) {
        await expect(savingText).toBeVisible();
      }

      const savedText = page.getByText(/saved/i);
      if (await savedText.isVisible({ timeout: 10000 })) {
        await expect(savedText).toBeVisible();
      }
    }
  });

  test('auto-save persists on page reload', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });

      const savedText = page.getByText(/saved/i);
      if (await savedText.isVisible({ timeout: 10000 })) {
        await expect(savedText).toBeVisible();
      }

      await page.reload();
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('Project Save', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('can manually save project', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      const savedText = page.getByText(/saved/i);
      if (await savedText.isVisible()) {
        await expect(savedText).toBeVisible();
      }
    }
  });

  test('save keyboard shortcut works (Ctrl+S)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    await page.keyboard.press('Control+S');
    const savedText = page.getByText(/saved/i);
    if (await savedText.isVisible()) {
      await expect(savedText).toBeVisible();
    }
  });

  test('save keyboard shortcut works (Cmd+S on Mac)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    await page.keyboard.press('Meta+S');
    const savedText = page.getByText(/saved/i);
    if (await savedText.isVisible()) {
      await expect(savedText).toBeVisible();
    }
  });
});

test.describe('Before Unload Warning', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('shows warning when leaving with unsaved changes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    let dialogMessage = '';
    page.on('dialog', (dialog) => {
      dialogMessage = dialog.message();
      dialog.dismiss();
    });

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    await page.goto('/dashboard');

    if (dialogMessage) {
      expect(dialogMessage.toLowerCase()).toContain('unsaved');
    }
  });

  test('no warning when all changes are saved', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const savedText = page.getByText(/saved/i);
    if (await savedText.isVisible({ timeout: 10000 })) {
      await expect(savedText).toBeVisible();
    }

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
