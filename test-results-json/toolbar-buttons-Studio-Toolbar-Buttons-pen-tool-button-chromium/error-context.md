# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: toolbar-buttons.spec.ts >> Studio Toolbar Buttons >> pen tool button
- Location: tests/e2e/toolbar-buttons.spec.ts:55:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByRole('button', { name: /pen|draw/i }) resolved to 2 elements:
    1) <button id="next-logo" aria-haspopup="menu" data-next-mark="true" aria-expanded="false" aria-label="Open Next.js Dev Tools" data-nextjs-dev-tools-button="true" aria-controls="nextjs-dev-tools-menu">…</button> aka getByRole('button', { name: 'Open Next.js Dev Tools' })
    2) <button data-issues-open="true" aria-label="Open issues overlay">…</button> aka getByRole('button', { name: 'Open issues overlay' })

Call log:
    - checking visibility of getByRole('button', { name: /pen|draw/i })

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
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Studio Toolbar Buttons', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await mockCanvas(page);
  8   |     await page.goto('/studio/test-project-1');
  9   |     await page.waitForTimeout(2000);
  10  |   });
  11  | 
  12  |   test('select tool button', async ({ page }) => {
  13  |     const selectBtn = page.getByRole('button', { name: /select/i });
  14  |     if (await selectBtn.isVisible()) {
  15  |       await selectBtn.click();
  16  |       await expect(selectBtn).toHaveAttribute('aria-pressed', 'true');
  17  |     }
  18  |   });
  19  | 
  20  |   test('rectangle tool button', async ({ page }) => {
  21  |     const rectBtn = page.getByRole('button', { name: /rectangle/i });
  22  |     if (await rectBtn.isVisible()) {
  23  |       await rectBtn.click();
  24  |     }
  25  |   });
  26  | 
  27  |   test('circle tool button', async ({ page }) => {
  28  |     const circleBtn = page.getByRole('button', { name: /circle/i });
  29  |     if (await circleBtn.isVisible()) {
  30  |       await circleBtn.click();
  31  |     }
  32  |   });
  33  | 
  34  |   test('polygon tool button', async ({ page }) => {
  35  |     const polygonBtn = page.getByRole('button', { name: /polygon/i });
  36  |     if (await polygonBtn.isVisible()) {
  37  |       await polygonBtn.click();
  38  |     }
  39  |   });
  40  | 
  41  |   test('line tool button', async ({ page }) => {
  42  |     const lineBtn = page.getByRole('button', { name: /line/i });
  43  |     if (await lineBtn.isVisible()) {
  44  |       await lineBtn.click();
  45  |     }
  46  |   });
  47  | 
  48  |   test('text tool button', async ({ page }) => {
  49  |     const textBtn = page.getByRole('button', { name: /text/i });
  50  |     if (await textBtn.isVisible()) {
  51  |       await textBtn.click();
  52  |     }
  53  |   });
  54  | 
  55  |   test('pen tool button', async ({ page }) => {
  56  |     const penBtn = page.getByRole('button', { name: /pen|draw/i });
> 57  |     if (await penBtn.isVisible()) {
      |                      ^ Error: locator.isVisible: Error: strict mode violation: getByRole('button', { name: /pen|draw/i }) resolved to 2 elements:
  58  |       await penBtn.click();
  59  |     }
  60  |   });
  61  | 
  62  |   test('eraser tool button', async ({ page }) => {
  63  |     const eraserBtn = page.getByRole('button', { name: /eraser/i });
  64  |     if (await eraserBtn.isVisible()) {
  65  |       await eraserBtn.click();
  66  |     }
  67  |   });
  68  | });
  69  | 
  70  | test.describe('Studio Action Buttons', () => {
  71  |   test.beforeEach(async ({ page }) => {
  72  |     await mockAuth(page, 'pro');
  73  |     await mockCanvas(page);
  74  |     await page.goto('/studio/test-project-1');
  75  |     await page.waitForTimeout(2000);
  76  |   });
  77  | 
  78  |   test('undo button', async ({ page }) => {
  79  |     const undoBtn = page.getByRole('button', { name: /undo/i });
  80  |     if (await undoBtn.isVisible()) {
  81  |       await undoBtn.click();
  82  |     }
  83  |   });
  84  | 
  85  |   test('redo button', async ({ page }) => {
  86  |     const redoBtn = page.getByRole('button', { name: /redo/i });
  87  |     if (await redoBtn.isVisible()) {
  88  |       await redoBtn.click();
  89  |     }
  90  |   });
  91  | 
  92  |   test('save button', async ({ page }) => {
  93  |     const saveBtn = page.getByRole('button', { name: /save/i });
  94  |     if (await saveBtn.isVisible()) {
  95  |       await saveBtn.click();
  96  |     }
  97  |   });
  98  | 
  99  |   test('export button', async ({ page }) => {
  100 |     const exportBtn = page.getByRole('button', { name: /export/i });
  101 |     if (await exportBtn.isVisible()) {
  102 |       await exportBtn.click();
  103 |     }
  104 |   });
  105 | 
  106 |   test('blocks button', async ({ page }) => {
  107 |     const blocksBtn = page.getByRole('button', { name: /blocks/i });
  108 |     if (await blocksBtn.isVisible()) {
  109 |       await blocksBtn.click();
  110 |     }
  111 |   });
  112 | 
  113 |   test('fabrics button', async ({ page }) => {
  114 |     const fabricsBtn = page.getByRole('button', { name: /fabrics/i });
  115 |     if (await fabricsBtn.isVisible()) {
  116 |       await fabricsBtn.click();
  117 |     }
  118 |   });
  119 | 
  120 |   test('history button', async ({ page }) => {
  121 |     const historyBtn = page.getByRole('button', { name: /history/i });
  122 |     if (await historyBtn.isVisible()) {
  123 |       await historyBtn.click();
  124 |     }
  125 |   });
  126 | 
  127 |   test.skip('reference image button — removed from toolbar', async ({ page }) => {
  128 |     const refBtn = page.getByRole('button', { name: /reference/i });
  129 |     if (await refBtn.isVisible()) {
  130 |       await refBtn.click();
  131 |     }
  132 |   });
  133 | 
  134 |   test('yardage button', async ({ page }) => {
  135 |     const yardageBtn = page.getByRole('button', { name: /yardage/i });
  136 |     if (await yardageBtn.isVisible()) {
  137 |       await yardageBtn.click();
  138 |     }
  139 |   });
  140 | 
  141 |   test.skip('grid toggle button — removed from toolbar', async ({ page }) => {
  142 |     const gridBtn = page.getByRole('button', { name: /grid/i });
  143 |     if (await gridBtn.isVisible()) {
  144 |       await gridBtn.click();
  145 |     }
  146 |   });
  147 | 
  148 |   test.skip('snap toggle button — removed from toolbar', async ({ page }) => {
  149 |     const snapBtn = page.getByRole('button', { name: /snap/i });
  150 |     if (await snapBtn.isVisible()) {
  151 |       await snapBtn.click();
  152 |     }
  153 |   });
  154 | 
  155 |   test('guides toggle button', async ({ page }) => {
  156 |     const guidesBtn = page.getByRole('button', { name: /guides/i });
  157 |     if (await guidesBtn.isVisible()) {
```