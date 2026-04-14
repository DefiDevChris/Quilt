# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: worktables.spec.ts >> Worktable Management >> worktable tabs are visible
- Location: tests/e2e/worktables.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/worktable/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/worktable/i)

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
  4   | test.describe('Worktable Management', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await mockCanvas(page);
  8   |     await mockProject(page, 'test-project-1');
  9   |   });
  10  | 
  11  |   test('worktable tabs are visible', async ({ page }) => {
  12  |     await page.goto('/studio/test-project-1');
  13  |     await page.waitForTimeout(2000);
> 14  |     await expect(page.getByText(/worktable/i)).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  15  |   });
  16  | 
  17  |   test('can switch between worktables', async ({ page }) => {
  18  |     await page.goto('/studio/test-project-1');
  19  |     await page.waitForTimeout(2000);
  20  |     const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
  21  |     if (await tab2.isVisible()) {
  22  |       await tab2.click();
  23  |     }
  24  |   });
  25  | 
  26  |   test('can create new worktable', async ({ page }) => {
  27  |     await page.goto('/studio/test-project-1');
  28  |     await page.waitForTimeout(2000);
  29  |     const addButton = page.getByRole('button', { name: /add worktable|add tab|\+/i });
  30  |     if (await addButton.isVisible()) {
  31  |       await addButton.click();
  32  |       await expect(page.getByText(/worktable/i)).toBeVisible();
  33  |     }
  34  |   });
  35  | 
  36  |   test('can rename worktable', async ({ page }) => {
  37  |     await page.goto('/studio/test-project-1');
  38  |     await page.waitForTimeout(2000);
  39  |     const tab = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
  40  |     if (await tab.isVisible()) {
  41  |       await tab.click({ button: 'right' });
  42  |       const renameOption = page.getByText(/rename/i);
  43  |       if (await renameOption.isVisible()) {
  44  |         await renameOption.click();
  45  |         await expect(page.getByPlaceholder(/name/i)).toBeVisible();
  46  |       }
  47  |     }
  48  |   });
  49  | 
  50  |   test('can duplicate worktable', async ({ page }) => {
  51  |     await page.goto('/studio/test-project-1');
  52  |     await page.waitForTimeout(2000);
  53  |     const tab = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
  54  |     if (await tab.isVisible()) {
  55  |       await tab.click({ button: 'right' });
  56  |       const duplicateOption = page.getByText(/duplicate/i);
  57  |       if (await duplicateOption.isVisible()) {
  58  |         await duplicateOption.click();
  59  |       }
  60  |     }
  61  |   });
  62  | 
  63  |   test('can delete worktable', async ({ page }) => {
  64  |     await page.goto('/studio/test-project-1');
  65  |     await page.waitForTimeout(2000);
  66  |     const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
  67  |     if (await tab2.isVisible()) {
  68  |       await tab2.click({ button: 'right' });
  69  |       const deleteOption = page.getByText(/delete/i);
  70  |       if (await deleteOption.isVisible()) {
  71  |         await deleteOption.click();
  72  |         await expect(page.getByText(/confirm|delete/i)).toBeVisible();
  73  |       }
  74  |     }
  75  |   });
  76  | 
  77  |   test('worktable limit is respected', async ({ page }) => {
  78  |     await page.goto('/studio/test-project-1');
  79  |     await page.waitForTimeout(2000);
  80  |     const tabs = page.getByRole('tab');
  81  |     const count = await tabs.count();
  82  |     expect(count).toBeLessThanOrEqual(10);
  83  |   });
  84  | });
  85  | 
  86  | test.describe('Cross-Worktable Operations', () => {
  87  |   test.beforeEach(async ({ page }) => {
  88  |     await mockAuth(page, 'pro');
  89  |     await mockCanvas(page);
  90  |     await mockProject(page, 'test-project-1');
  91  |   });
  92  | 
  93  |   test('copy/paste works across worktables', async ({ page }) => {
  94  |     await page.goto('/studio/test-project-1');
  95  |     await page.waitForTimeout(2000);
  96  | 
  97  |     // Select object on worktable 1
  98  |     const canvas = page.locator('canvas');
  99  |     if (await canvas.isVisible()) {
  100 |       await canvas.click({ position: { x: 100, y: 100 } });
  101 | 
  102 |       // Copy
  103 |       await page.keyboard.press('Control+C');
  104 | 
  105 |       // Switch to worktable 2
  106 |       const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
  107 |       if (await tab2.isVisible()) {
  108 |         await tab2.click();
  109 | 
  110 |         // Paste
  111 |         await page.keyboard.press('Control+V');
  112 |       }
  113 |     }
  114 |   });
```