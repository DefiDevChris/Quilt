import { test, expect } from '@playwright/test';
import { mockAuth } from './helpers/auth';
import { mockProject } from './helpers/canvas';

declare global {
  interface Window {
    useCanvasStore?: { getState: () => Record<string, unknown> };
  }
}

test.describe('Undo/Redo Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication and project mocks
    await mockAuth(page);
    await mockProject(page, 'test-project-id');
    
    // Navigate to the studio
    await page.goto('/studio/test-project-id');
    
    // Wait for canvas to be initialized
    await expect(page.locator('canvas')).toBeVisible();
    
    // Ensure history is clean (initial state)
    // We expect 1 history state initially (the blank canvas)
  });

  test('can undo and redo a rectangle creation', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // 1. Select the rectangle tool
    const rectButton = page.getByRole('button', { name: /rectangle/i });
    await rectButton.click();
    
    // 2. Draw a rectangle (two clicks)
    // We'll click at (100, 100) and (200, 200) relative to the canvas
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // 3. Verify object count is 1 (excluding layout elements if any)
    // We use evaluate to check the actual fabric objects
    let objectCount = await page.evaluate(() => {
      // @ts-ignore - access from store
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    
    // Note: Layout objects might already be on the canvas if mockProject includes them.
    // Our mockProject has 0 objects in canvasData, so count should be 1.
    expect(objectCount).toBe(1);
    
    // 4. Trigger Undo via UI button
    const undoButton = page.getByRole('button', { name: /undo/i });
    await undoButton.click();
    
    // 5. Verify object count is 0
    objectCount = await page.evaluate(() => {
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    expect(objectCount).toBe(0);
    
    // 6. Trigger Redo via UI button
    const redoButton = page.getByRole('button', { name: /redo/i });
    await redoButton.click();
    
    // 7. Verify object count is back to 1
    objectCount = await page.evaluate(() => {
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    expect(objectCount).toBe(1);
  });

  test('can undo and redo via keyboard shortcuts', async ({ page }) => {
    const canvas = page.locator('canvas');
    const rectButton = page.getByRole('button', { name: /rectangle/i });
    await rectButton.click();
    
    // Draw rectangle
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 200, y: 200 } });
    
    // Verify 1 object
    let objectCount = await page.evaluate(() => {
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    expect(objectCount).toBe(1);
    
    // Undo via Ctrl+Z
    await page.keyboard.press('Control+Z');
    
    // Verify 0 objects
    objectCount = await page.evaluate(() => {
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    expect(objectCount).toBe(0);
    
    // Redo via Ctrl+Shift+Z or Ctrl+Y (Check what's configured in useCanvasKeyboard)
    await page.keyboard.press('Control+Y');
    
    // Verify 1 object
    objectCount = await page.evaluate(() => {
      const store = window.useCanvasStore?.getState();
      return store?.fabricCanvas?.getObjects().length || 0;
    });
    expect(objectCount).toBe(1);
  });
});
