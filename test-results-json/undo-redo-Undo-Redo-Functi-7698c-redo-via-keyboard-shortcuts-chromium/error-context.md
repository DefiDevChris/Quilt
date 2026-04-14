# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: undo-redo.spec.ts >> Undo/Redo Functionality >> can undo and redo via keyboard shortcuts
- Location: tests/e2e/undo-redo.spec.ts:74:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('canvas')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('canvas')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - paragraph [ref=e6]: Failed to load project
    - link "Return to Dashboard" [ref=e7] [cursor=pointer]:
      - /url: /dashboard
  - generic "Notifications"
  - generic [ref=e12] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e13]:
      - img [ref=e14]
    - generic [ref=e17]:
      - button "Open issues overlay" [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: "0"
          - generic [ref=e21]: "1"
        - generic [ref=e22]: Issue
      - button "Collapse issues badge" [ref=e23]:
        - img [ref=e24]
  - alert [ref=e26]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth } from './helpers/auth';
  3   | import { mockProject } from './helpers/canvas';
  4   | 
  5   | declare global {
  6   |   interface Window {
  7   |     useCanvasStore?: { getState: () => Record<string, unknown> };
  8   |   }
  9   | }
  10  | 
  11  | test.describe('Undo/Redo Functionality', () => {
  12  |   test.beforeEach(async ({ page }) => {
  13  |     // Setup authentication and project mocks
  14  |     await mockAuth(page);
  15  |     await mockProject(page, 'test-project-id');
  16  |     
  17  |     // Navigate to the studio
  18  |     await page.goto('/studio/test-project-id');
  19  |     
  20  |     // Wait for canvas to be initialized
> 21  |     await expect(page.locator('canvas')).toBeVisible();
      |                                          ^ Error: expect(locator).toBeVisible() failed
  22  |     
  23  |     // Ensure history is clean (initial state)
  24  |     // We expect 1 history state initially (the blank canvas)
  25  |   });
  26  | 
  27  |   test('can undo and redo a rectangle creation', async ({ page }) => {
  28  |     const canvas = page.locator('canvas');
  29  |     
  30  |     // 1. Select the rectangle tool
  31  |     const rectButton = page.getByRole('button', { name: /rectangle/i });
  32  |     await rectButton.click();
  33  |     
  34  |     // 2. Draw a rectangle (two clicks)
  35  |     // We'll click at (100, 100) and (200, 200) relative to the canvas
  36  |     await canvas.click({ position: { x: 100, y: 100 } });
  37  |     await canvas.click({ position: { x: 200, y: 200 } });
  38  |     
  39  |     // 3. Verify object count is 1 (excluding layout elements if any)
  40  |     // We use evaluate to check the actual fabric objects
  41  |     let objectCount = await page.evaluate(() => {
  42  |       // @ts-ignore - access from store
  43  |       const store = window.useCanvasStore?.getState();
  44  |       return store?.fabricCanvas?.getObjects().length || 0;
  45  |     });
  46  |     
  47  |     // Note: Layout objects might already be on the canvas if mockProject includes them.
  48  |     // Our mockProject has 0 objects in canvasData, so count should be 1.
  49  |     expect(objectCount).toBe(1);
  50  |     
  51  |     // 4. Trigger Undo via UI button
  52  |     const undoButton = page.getByRole('button', { name: /undo/i });
  53  |     await undoButton.click();
  54  |     
  55  |     // 5. Verify object count is 0
  56  |     objectCount = await page.evaluate(() => {
  57  |       const store = window.useCanvasStore?.getState();
  58  |       return store?.fabricCanvas?.getObjects().length || 0;
  59  |     });
  60  |     expect(objectCount).toBe(0);
  61  |     
  62  |     // 6. Trigger Redo via UI button
  63  |     const redoButton = page.getByRole('button', { name: /redo/i });
  64  |     await redoButton.click();
  65  |     
  66  |     // 7. Verify object count is back to 1
  67  |     objectCount = await page.evaluate(() => {
  68  |       const store = window.useCanvasStore?.getState();
  69  |       return store?.fabricCanvas?.getObjects().length || 0;
  70  |     });
  71  |     expect(objectCount).toBe(1);
  72  |   });
  73  | 
  74  |   test('can undo and redo via keyboard shortcuts', async ({ page }) => {
  75  |     const canvas = page.locator('canvas');
  76  |     const rectButton = page.getByRole('button', { name: /rectangle/i });
  77  |     await rectButton.click();
  78  |     
  79  |     // Draw rectangle
  80  |     await canvas.click({ position: { x: 100, y: 100 } });
  81  |     await canvas.click({ position: { x: 200, y: 200 } });
  82  |     
  83  |     // Verify 1 object
  84  |     let objectCount = await page.evaluate(() => {
  85  |       const store = window.useCanvasStore?.getState();
  86  |       return store?.fabricCanvas?.getObjects().length || 0;
  87  |     });
  88  |     expect(objectCount).toBe(1);
  89  |     
  90  |     // Undo via Ctrl+Z
  91  |     await page.keyboard.press('Control+Z');
  92  |     
  93  |     // Verify 0 objects
  94  |     objectCount = await page.evaluate(() => {
  95  |       const store = window.useCanvasStore?.getState();
  96  |       return store?.fabricCanvas?.getObjects().length || 0;
  97  |     });
  98  |     expect(objectCount).toBe(0);
  99  |     
  100 |     // Redo via Ctrl+Shift+Z or Ctrl+Y (Check what's configured in useCanvasKeyboard)
  101 |     await page.keyboard.press('Control+Y');
  102 |     
  103 |     // Verify 1 object
  104 |     objectCount = await page.evaluate(() => {
  105 |       const store = window.useCanvasStore?.getState();
  106 |       return store?.fabricCanvas?.getObjects().length || 0;
  107 |     });
  108 |     expect(objectCount).toBe(1);
  109 |   });
  110 | });
  111 | 
```