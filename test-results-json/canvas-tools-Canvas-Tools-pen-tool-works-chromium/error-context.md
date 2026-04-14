# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: canvas-tools.spec.ts >> Canvas Tools >> pen tool works
- Location: tests/e2e/canvas-tools.spec.ts:77:7

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
  2   | import { mockAuth, mockCanvas, mockProject } from './utils';
  3   | 
  4   | test.describe('Canvas Tools', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await mockCanvas(page);
  8   |     await mockProject(page, 'test-project-1');
  9   |   });
  10  | 
  11  |   test('select tool is active by default', async ({ page }) => {
  12  |     await page.goto('/studio/test-project-1');
  13  |     await page.waitForTimeout(2000);
  14  |     const selectButton = page.getByRole('button', { name: /select/i });
  15  |     if (await selectButton.isVisible()) {
  16  |       await expect(selectButton).toHaveAttribute('aria-pressed', 'true');
  17  |     }
  18  |   });
  19  | 
  20  |   test('rectangle tool works', async ({ page }) => {
  21  |     await page.goto('/studio/test-project-1');
  22  |     await page.waitForTimeout(2000);
  23  |     const rectButton = page.getByRole('button', { name: /rectangle/i });
  24  |     if (await rectButton.isVisible()) {
  25  |       await rectButton.click();
  26  |     }
  27  |     const canvas = page.locator('canvas');
  28  |     if (await canvas.isVisible()) {
  29  |       await canvas.click({ position: { x: 100, y: 100 } });
  30  |       await canvas.click({ position: { x: 200, y: 200 } });
  31  |     }
  32  |   });
  33  | 
  34  |   test('circle tool works', async ({ page }) => {
  35  |     await page.goto('/studio/test-project-1');
  36  |     await page.waitForTimeout(2000);
  37  |     const circleButton = page.getByRole('button', { name: /circle/i });
  38  |     if (await circleButton.isVisible()) {
  39  |       await circleButton.click();
  40  |     }
  41  |     const canvas = page.locator('canvas');
  42  |     if (await canvas.isVisible()) {
  43  |       await canvas.click({ position: { x: 100, y: 100 } });
  44  |       await canvas.click({ position: { x: 200, y: 200 } });
  45  |     }
  46  |   });
  47  | 
  48  |   test('polygon tool works', async ({ page }) => {
  49  |     await page.goto('/studio/test-project-1');
  50  |     await page.waitForTimeout(2000);
  51  |     const polygonButton = page.getByRole('button', { name: /polygon/i });
  52  |     if (await polygonButton.isVisible()) {
  53  |       await polygonButton.click();
  54  |     }
  55  |     const canvas = page.locator('canvas');
  56  |     if (await canvas.isVisible()) {
  57  |       await canvas.click({ position: { x: 100, y: 100 } });
  58  |       await canvas.click({ position: { x: 200, y: 100 } });
  59  |       await canvas.click({ position: { x: 150, y: 200 } });
  60  |     }
  61  |   });
  62  | 
  63  |   test('line tool works', async ({ page }) => {
  64  |     await page.goto('/studio/test-project-1');
  65  |     await page.waitForTimeout(2000);
  66  |     const lineButton = page.getByRole('button', { name: /line/i });
  67  |     if (await lineButton.isVisible()) {
  68  |       await lineButton.click();
  69  |     }
  70  |     const canvas = page.locator('canvas');
  71  |     if (await canvas.isVisible()) {
  72  |       await canvas.click({ position: { x: 100, y: 100 } });
  73  |       await canvas.click({ position: { x: 200, y: 200 } });
  74  |     }
  75  |   });
  76  | 
  77  |   test('pen tool works', async ({ page }) => {
  78  |     await page.goto('/studio/test-project-1');
  79  |     await page.waitForTimeout(2000);
  80  |     const penButton = page.getByRole('button', { name: /pen|draw/i });
> 81  |     if (await penButton.isVisible()) {
      |                         ^ Error: locator.isVisible: Error: strict mode violation: getByRole('button', { name: /pen|draw/i }) resolved to 2 elements:
  82  |       await penButton.click();
  83  |     }
  84  |     const canvas = page.locator('canvas');
  85  |     if (await canvas.isVisible()) {
  86  |       await canvas.click({ position: { x: 100, y: 100 } });
  87  |       await canvas.click({ position: { x: 150, y: 150 } });
  88  |     }
  89  |   });
  90  | 
  91  |   test('eraser tool works', async ({ page }) => {
  92  |     await page.goto('/studio/test-project-1');
  93  |     await page.waitForTimeout(2000);
  94  |     const eraserButton = page.getByRole('button', { name: /eraser/i });
  95  |     if (await eraserButton.isVisible()) {
  96  |       await eraserButton.click();
  97  |     }
  98  |     const canvas = page.locator('canvas');
  99  |     if (await canvas.isVisible()) {
  100 |       await canvas.click({ position: { x: 100, y: 100 } });
  101 |     }
  102 |   });
  103 | });
  104 | 
  105 | test.describe('Canvas Operations', () => {
  106 |   test.beforeEach(async ({ page }) => {
  107 |     await mockAuth(page, 'pro');
  108 |     await mockCanvas(page);
  109 |     await mockProject(page, 'test-project-1');
  110 |   });
  111 | 
  112 |   test('can select objects', async ({ page }) => {
  113 |     await page.goto('/studio/test-project-1');
  114 |     await page.waitForTimeout(2000);
  115 |     const canvas = page.locator('canvas');
  116 |     if (await canvas.isVisible()) {
  117 |       await canvas.click({ position: { x: 100, y: 100 } });
  118 |     }
  119 |   });
  120 | 
  121 |   test('can move objects', async ({ page }) => {
  122 |     await page.goto('/studio/test-project-1');
  123 |     await page.waitForTimeout(2000);
  124 |     const canvas = page.locator('canvas');
  125 |     if (await canvas.isVisible()) {
  126 |       await canvas.click({ position: { x: 100, y: 100 } });
  127 |     }
  128 |   });
  129 | 
  130 |   test('can resize objects', async ({ page }) => {
  131 |     await page.goto('/studio/test-project-1');
  132 |     await page.waitForTimeout(2000);
  133 |     const canvas = page.locator('canvas');
  134 |     if (await canvas.isVisible()) {
  135 |       await canvas.click({ position: { x: 100, y: 100 } });
  136 |     }
  137 |   });
  138 | 
  139 |   test('can rotate objects', async ({ page }) => {
  140 |     await page.goto('/studio/test-project-1');
  141 |     await page.waitForTimeout(2000);
  142 |     const canvas = page.locator('canvas');
  143 |     if (await canvas.isVisible()) {
  144 |       await canvas.click({ position: { x: 100, y: 100 } });
  145 |     }
  146 |   });
  147 | 
  148 |   test('can delete objects', async ({ page }) => {
  149 |     await page.goto('/studio/test-project-1');
  150 |     await page.waitForTimeout(2000);
  151 |     const canvas = page.locator('canvas');
  152 |     if (await canvas.isVisible()) {
  153 |       await canvas.click({ position: { x: 100, y: 100 } });
  154 |       await page.keyboard.press('Delete');
  155 |     }
  156 |   });
  157 | 
  158 |   test('can group objects', async ({ page }) => {
  159 |     await page.goto('/studio/test-project-1');
  160 |     await page.waitForTimeout(2000);
  161 |     const canvas = page.locator('canvas');
  162 |     if (await canvas.isVisible()) {
  163 |       await canvas.click({ position: { x: 100, y: 100 } });
  164 |       await page.keyboard.down('Shift');
  165 |       await canvas.click({ position: { x: 200, y: 200 } });
  166 |       await page.keyboard.up('Shift');
  167 |       await page.keyboard.press('Control+G');
  168 |     }
  169 |   });
  170 | 
  171 |   test('can ungroup objects', async ({ page }) => {
  172 |     await page.goto('/studio/test-project-1');
  173 |     await page.waitForTimeout(2000);
  174 |     const canvas = page.locator('canvas');
  175 |     if (await canvas.isVisible()) {
  176 |       await canvas.click({ position: { x: 100, y: 100 } });
  177 |       await page.keyboard.press('Control+Shift+G');
  178 |     }
  179 |   });
  180 | });
  181 | 
```