# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout-switching.spec.ts >> Layout Switching >> layout settings persist
- Location: tests/e2e/layout-switching.spec.ts:59:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/grid|layout/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/grid|layout/i)

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
  4   | test.describe('Layout Switching', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await mockCanvas(page);
  8   |     await mockProject(page, 'test-project-1');
  9   |   });
  10  | 
  11  |   test('layout options are available in studio', async ({ page }) => {
  12  |     await page.goto('/studio/test-project-1');
  13  |     await page.waitForTimeout(2000);
  14  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  15  |     if (await layoutButton.isVisible()) {
  16  |       await expect(layoutButton).toBeVisible();
  17  |     }
  18  |   });
  19  | 
  20  |   test('can switch to grid layout', async ({ page }) => {
  21  |     await page.goto('/studio/test-project-1');
  22  |     await page.waitForTimeout(2000);
  23  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  24  |     if (await layoutButton.isVisible()) {
  25  |       await layoutButton.click();
  26  |     }
  27  |     const gridOption = page.getByText(/grid/i);
  28  |     if (await gridOption.isVisible()) {
  29  |       await gridOption.click();
  30  |     }
  31  |   });
  32  | 
  33  |   test('can switch to sashing layout', async ({ page }) => {
  34  |     await page.goto('/studio/test-project-1');
  35  |     await page.waitForTimeout(2000);
  36  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  37  |     if (await layoutButton.isVisible()) {
  38  |       await layoutButton.click();
  39  |     }
  40  |     const sashingOption = page.getByText(/sashing/i);
  41  |     if (await sashingOption.isVisible()) {
  42  |       await sashingOption.click();
  43  |     }
  44  |   });
  45  | 
  46  |   test('can switch to on-point layout', async ({ page }) => {
  47  |     await page.goto('/studio/test-project-1');
  48  |     await page.waitForTimeout(2000);
  49  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  50  |     if (await layoutButton.isVisible()) {
  51  |       await layoutButton.click();
  52  |     }
  53  |     const onPointOption = page.getByText(/on-point/i);
  54  |     if (await onPointOption.isVisible()) {
  55  |       await onPointOption.click();
  56  |     }
  57  |   });
  58  | 
  59  |   test('layout settings persist', async ({ page }) => {
  60  |     await page.goto('/studio/test-project-1');
  61  |     await page.waitForTimeout(2000);
  62  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  63  |     if (await layoutButton.isVisible()) {
  64  |       await layoutButton.click();
  65  |     }
  66  |     const gridOption = page.getByText(/grid/i);
  67  |     if (await gridOption.isVisible()) {
  68  |       await gridOption.click();
  69  |     }
  70  |     await page.reload();
  71  |     await page.waitForTimeout(2000);
> 72  |     await expect(page.getByText(/grid|layout/i)).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  73  |   });
  74  | 
  75  |   test('layout affects pattern overlay alignment', async ({ page }) => {
  76  |     await page.goto('/studio/test-project-1');
  77  |     await page.waitForTimeout(2000);
  78  |     const layoutButton = page.getByRole('button', { name: /layout/i });
  79  |     if (await layoutButton.isVisible()) {
  80  |       await layoutButton.click();
  81  |     }
  82  |     const gridOption = page.getByText(/grid/i);
  83  |     if (await gridOption.isVisible()) {
  84  |       await gridOption.click();
  85  |     }
  86  |     const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
  87  |     if (await overlayButton.isVisible()) {
  88  |       await overlayButton.click();
  89  |     }
  90  |     const overlay = page.locator('[data-testid="overlay-item"]').or(page.getByText(/nine patch/i)).first();
  91  |     if (await overlay.isVisible()) {
  92  |       await overlay.click();
  93  |     }
  94  |   });
  95  | });
  96  | 
  97  | test.describe('Layout Configuration', () => {
  98  |   test.beforeEach(async ({ page }) => {
  99  |     await mockAuth(page, 'pro');
  100 |     await mockCanvas(page);
  101 |     await mockProject(page, 'test-project-1');
  102 |   });
  103 | 
  104 |   test('grid layout has size settings', async ({ page }) => {
  105 |     await page.goto('/studio/test-project-1');
  106 |     await page.waitForTimeout(2000);
  107 |     const layoutButton = page.getByRole('button', { name: /layout/i });
  108 |     if (await layoutButton.isVisible()) {
  109 |       await layoutButton.click();
  110 |     }
  111 |     const gridOption = page.getByText(/grid/i);
  112 |     if (await gridOption.isVisible()) {
  113 |       await gridOption.click();
  114 |     }
  115 |     const settingsButton = page.getByRole('button', { name: /settings/i });
  116 |     if (await settingsButton.isVisible()) {
  117 |       await settingsButton.click();
  118 |       await expect(page.getByText(/rows|columns|size/i)).toBeVisible();
  119 |     }
  120 |   });
  121 | 
  122 |   test('sashing layout has width settings', async ({ page }) => {
  123 |     await page.goto('/studio/test-project-1');
  124 |     await page.waitForTimeout(2000);
  125 |     const layoutButton = page.getByRole('button', { name: /layout/i });
  126 |     if (await layoutButton.isVisible()) {
  127 |       await layoutButton.click();
  128 |     }
  129 |     const sashingOption = page.getByText(/sashing/i);
  130 |     if (await sashingOption.isVisible()) {
  131 |       await sashingOption.click();
  132 |     }
  133 |     const settingsButton = page.getByRole('button', { name: /settings/i });
  134 |     if (await settingsButton.isVisible()) {
  135 |       await settingsButton.click();
  136 |       await expect(page.getByText(/sashing width|width/i)).toBeVisible();
  137 |     }
  138 |   });
  139 | 
  140 |   test('on-point layout has rotation settings', async ({ page }) => {
  141 |     await page.goto('/studio/test-project-1');
  142 |     await page.waitForTimeout(2000);
  143 |     const layoutButton = page.getByRole('button', { name: /layout/i });
  144 |     if (await layoutButton.isVisible()) {
  145 |       await layoutButton.click();
  146 |     }
  147 |     const onPointOption = page.getByText(/on-point/i);
  148 |     if (await onPointOption.isVisible()) {
  149 |       await onPointOption.click();
  150 |     }
  151 |     const settingsButton = page.getByRole('button', { name: /settings/i });
  152 |     if (await settingsButton.isVisible()) {
  153 |       await settingsButton.click();
  154 |       await expect(page.getByText(/rotation|angle/i)).toBeVisible();
  155 |     }
  156 |   });
  157 | });
  158 | 
  159 | test.describe('Layout Preview', () => {
  160 |   test.beforeEach(async ({ page }) => {
  161 |     await mockAuth(page, 'pro');
  162 |     await mockCanvas(page);
  163 |     await mockProject(page, 'test-project-1');
  164 |   });
  165 | 
  166 |   test('layout preview shows before applying', async ({ page }) => {
  167 |     await page.goto('/studio/test-project-1');
  168 |     await page.waitForTimeout(2000);
  169 |     const layoutButton = page.getByRole('button', { name: /layout/i });
  170 |     if (await layoutButton.isVisible()) {
  171 |       await layoutButton.click();
  172 |     }
```