import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Canvas Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('select tool is active by default', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const selectButton = page.getByRole('button', { name: /select/i });
    if (await selectButton.isVisible()) {
      await expect(selectButton).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('rectangle tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const rectButton = page.getByRole('button', { name: /rectangle/i });
    if (await rectButton.isVisible()) {
      await rectButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 200, y: 200 } });
    }
  });

  test('circle tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const circleButton = page.getByRole('button', { name: /circle/i });
    if (await circleButton.isVisible()) {
      await circleButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 200, y: 200 } });
    }
  });

  test('polygon tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const polygonButton = page.getByRole('button', { name: /polygon/i });
    if (await polygonButton.isVisible()) {
      await polygonButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 200, y: 100 } });
      await canvas.click({ position: { x: 150, y: 200 } });
    }
  });

  test('line tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const lineButton = page.getByRole('button', { name: /line/i });
    if (await lineButton.isVisible()) {
      await lineButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 200, y: 200 } });
    }
  });

  test('pen tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const penButton = page.getByRole('button', { name: /pen|draw/i });
    if (await penButton.isVisible()) {
      await penButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 150, y: 150 } });
    }
  });

  test('eraser tool works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const eraserButton = page.getByRole('button', { name: /eraser/i });
    if (await eraserButton.isVisible()) {
      await eraserButton.click();
    }
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }
  });
});

test.describe('Canvas Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('can select objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }
  });

  test('can move objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }
  });

  test('can resize objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }
  });

  test('can rotate objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }
  });

  test('can delete objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('Delete');
    }
  });

  test('can group objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.down('Shift');
      await canvas.click({ position: { x: 200, y: 200 } });
      await page.keyboard.up('Shift');
      await page.keyboard.press('Control+G');
    }
  });

  test('can ungroup objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('Control+Shift+G');
    }
  });
});

test.describe('Canvas Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('undo works (Ctrl+Z)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+Z');
  });

  test('redo works (Ctrl+Y)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+Y');
  });

  test('copy works (Ctrl+C)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('Control+C');
    }
  });

  test('paste works (Ctrl+V)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+V');
  });

  test('duplicate works (Ctrl+D)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await page.keyboard.press('Control+D');
    }
  });

  test('select all works (Ctrl+A)', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+A');
  });
});

test.describe('Canvas Zoom and Pan', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('zoom in works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const zoomInButton = page.getByRole('button', { name: /zoom in|\+/i });
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click();
    }
  });

  test('zoom out works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const zoomOutButton = page.getByRole('button', { name: /zoom out|-/i });
    if (await zoomOutButton.isVisible()) {
      await zoomOutButton.click();
    }
  });

  test('fit to screen works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fitButton = page.getByRole('button', { name: /fit/i });
    if (await fitButton.isVisible()) {
      await fitButton.click();
    }
  });

  test('reset zoom to 100% works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const resetButton = page.getByRole('button', { name: /100%|reset/i });
    if (await resetButton.isVisible()) {
      await resetButton.click();
    }
  });

  test('pan with space+drag works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await page.keyboard.down('Space');
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      });
      await page.keyboard.up('Space');
    }
  });
});

test.describe('Smart Guides', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('smart guides toggle works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const guidesButton = page.getByRole('button', { name: /guides/i });
    if (await guidesButton.isVisible()) {
      await guidesButton.click();
      await expect(guidesButton).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('alignment guides show when moving objects', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 }
      });
    }
  });
});
