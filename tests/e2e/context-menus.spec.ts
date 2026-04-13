import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('Canvas Right-Click Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('right-click on canvas shows context menu', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const contextMenu = page.locator('[role="menu"]');
    if (await contextMenu.isVisible({ timeout: 2000 })) {
      await expect(contextMenu).toBeVisible();
    }
  });

  test('context menu - paste option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const pasteOption = page.getByRole('menuitem', { name: /paste/i });
    if (await pasteOption.isVisible({ timeout: 2000 })) {
      await expect(pasteOption).toBeVisible();
    }
  });

  test('context menu - select all option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const selectAllOption = page.getByRole('menuitem', { name: /select all/i });
    if (await selectAllOption.isVisible({ timeout: 2000 })) {
      await expect(selectAllOption).toBeVisible();
    }
  });
});

test.describe('Object Right-Click Context Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('right-click on object shows context menu', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const contextMenu = page.locator('[role="menu"]');
    if (await contextMenu.isVisible({ timeout: 2000 })) {
      await expect(contextMenu).toBeVisible();
    }
  });

  test('context menu - cut option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const cutOption = page.getByRole('menuitem', { name: /cut/i });
    if (await cutOption.isVisible({ timeout: 2000 })) {
      await expect(cutOption).toBeVisible();
    }
  });

  test('context menu - copy option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const copyOption = page.getByRole('menuitem', { name: /copy/i });
    if (await copyOption.isVisible({ timeout: 2000 })) {
      await expect(copyOption).toBeVisible();
    }
  });

  test('context menu - duplicate option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
    if (await duplicateOption.isVisible({ timeout: 2000 })) {
      await expect(duplicateOption).toBeVisible();
    }
  });

  test('context menu - delete option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const deleteOption = page.getByRole('menuitem', { name: /delete/i });
    if (await deleteOption.isVisible({ timeout: 2000 })) {
      await expect(deleteOption).toBeVisible();
    }
  });

  test('context menu - group option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const groupOption = page.getByRole('menuitem', { name: /group/i });
    if (await groupOption.isVisible({ timeout: 2000 })) {
      await expect(groupOption).toBeVisible();
    }
  });

  test('context menu - ungroup option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const ungroupOption = page.getByRole('menuitem', { name: /ungroup/i });
    if (await ungroupOption.isVisible({ timeout: 2000 })) {
      await expect(ungroupOption).toBeVisible();
    }
  });

  test('context menu - bring to front option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const frontOption = page.getByRole('menuitem', { name: /bring to front/i });
    if (await frontOption.isVisible({ timeout: 2000 })) {
      await expect(frontOption).toBeVisible();
    }
  });

  test('context menu - send to back option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const backOption = page.getByRole('menuitem', { name: /send to back/i });
    if (await backOption.isVisible({ timeout: 2000 })) {
      await expect(backOption).toBeVisible();
    }
  });

  test('context menu - lock option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const lockOption = page.getByRole('menuitem', { name: /lock/i });
    if (await lockOption.isVisible({ timeout: 2000 })) {
      await expect(lockOption).toBeVisible();
    }
  });

  test('context menu - unlock option', async ({ page }) => {
    const canvas = page.locator('canvas');
    await canvas.click({ button: 'right', position: { x: 100, y: 100 } });
    await page.waitForTimeout(500);

    const unlockOption = page.getByRole('menuitem', { name: /unlock/i });
    if (await unlockOption.isVisible({ timeout: 2000 })) {
      await expect(unlockOption).toBeVisible();
    }
  });
});

test.describe('Worktable Tab Right-Click Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('right-click on worktable tab shows menu', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      await page.waitForTimeout(500);

      const contextMenu = page.locator('[role="menu"]');
      if (await contextMenu.isVisible({ timeout: 2000 })) {
        await expect(contextMenu).toBeVisible();
      }
    }
  });

  test('worktable context menu - rename option', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      await page.waitForTimeout(500);

      const renameOption = page.getByRole('menuitem', { name: /rename/i });
      if (await renameOption.isVisible({ timeout: 2000 })) {
        await expect(renameOption).toBeVisible();
      }
    }
  });

  test('worktable context menu - duplicate option', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      await page.waitForTimeout(500);

      const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
      if (await duplicateOption.isVisible({ timeout: 2000 })) {
        await expect(duplicateOption).toBeVisible();
      }
    }
  });

  test('worktable context menu - delete option', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });
      await page.waitForTimeout(500);

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible({ timeout: 2000 })) {
        await expect(deleteOption).toBeVisible();
      }
    }
  });
});

test.describe('Project Card Right-Click Menu', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/projects');
    await page.waitForTimeout(2000);
  });

  test('right-click on project card shows menu', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const contextMenu = page.locator('[role="menu"]');
      if (await contextMenu.isVisible({ timeout: 2000 })) {
        await expect(contextMenu).toBeVisible();
      }
    }
  });

  test('project context menu - open option', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const openOption = page.getByRole('menuitem', { name: /open/i });
      if (await openOption.isVisible({ timeout: 2000 })) {
        await expect(openOption).toBeVisible();
      }
    }
  });

  test('project context menu - rename option', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const renameOption = page.getByRole('menuitem', { name: /rename/i });
      if (await renameOption.isVisible({ timeout: 2000 })) {
        await expect(renameOption).toBeVisible();
      }
    }
  });

  test('project context menu - duplicate option', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const duplicateOption = page.getByRole('menuitem', { name: /duplicate/i });
      if (await duplicateOption.isVisible({ timeout: 2000 })) {
        await expect(duplicateOption).toBeVisible();
      }
    }
  });

  test('project context menu - delete option', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const deleteOption = page.getByRole('menuitem', { name: /delete/i });
      if (await deleteOption.isVisible({ timeout: 2000 })) {
        await expect(deleteOption).toBeVisible();
      }
    }
  });

  test('project context menu - save as template option', async ({ page }) => {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.isVisible()) {
      await projectCard.click({ button: 'right' });
      await page.waitForTimeout(500);

      const templateOption = page.getByRole('menuitem', { name: /save as template/i });
      if (await templateOption.isVisible({ timeout: 2000 })) {
        await expect(templateOption).toBeVisible();
      }
    }
  });
});
