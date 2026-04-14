# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: worktables.spec.ts >> Worktable Auto-Save >> worktable state persists on page reload
- Location: tests/e2e/worktables.spec.ts:161:7

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
  115 | 
  116 |   test('duplicate offers worktable options', async ({ page }) => {
  117 |     await page.goto('/studio/test-project-1');
  118 |     await page.waitForTimeout(2000);
  119 | 
  120 |     // Select object
  121 |     const canvas = page.locator('canvas');
  122 |     if (await canvas.isVisible()) {
  123 |       await canvas.click({ position: { x: 100, y: 100 } });
  124 | 
  125 |       // Duplicate
  126 |       await page.keyboard.press('Control+D');
  127 |     }
  128 |   });
  129 | });
  130 | 
  131 | test.describe('Worktable Auto-Save', () => {
  132 |   test.beforeEach(async ({ page }) => {
  133 |     await mockAuth(page, 'pro');
  134 |     await mockCanvas(page);
  135 |     await mockProject(page, 'test-project-1');
  136 |   });
  137 | 
  138 |   test('worktable state is saved on switch', async ({ page }) => {
  139 |     await page.goto('/studio/test-project-1');
  140 |     await page.waitForTimeout(2000);
  141 | 
  142 |     // Make changes on worktable 1
  143 |     const canvas = page.locator('canvas');
  144 |     if (await canvas.isVisible()) {
  145 |       await canvas.click({ position: { x: 100, y: 100 } });
  146 | 
  147 |       // Switch to worktable 2
  148 |       const tab2 = page.getByRole('tab', { name: /worktable 2/i }).or(page.getByText(/worktable 2/i));
  149 |       if (await tab2.isVisible()) {
  150 |         await tab2.click();
  151 | 
  152 |         // Switch back to worktable 1
  153 |         const tab1 = page.getByRole('tab', { name: /worktable 1/i }).or(page.getByText(/worktable 1/i));
  154 |         if (await tab1.isVisible()) {
  155 |           await tab1.click();
  156 |         }
  157 |       }
  158 |     }
  159 |   });
  160 | 
  161 |   test('worktable state persists on page reload', async ({ page }) => {
  162 |     await page.goto('/studio/test-project-1');
  163 |     await page.waitForTimeout(2000);
  164 | 
  165 |     // Reload page
  166 |     await page.reload();
  167 |     await page.waitForTimeout(2000);
  168 | 
  169 |     // Worktable should still exist
> 170 |     await expect(page.getByText(/worktable/i)).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  171 |   });
  172 | });
  173 | 
```