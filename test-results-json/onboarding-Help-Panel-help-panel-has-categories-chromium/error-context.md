# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding.spec.ts >> Help Panel >> help panel has categories
- Location: tests/e2e/onboarding.spec.ts:105:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText(/getting started|help|categories/i)
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/getting started|help|categories/i)
    9 × locator resolved to <a target="_blank" rel="noopener noreferrer" href="https://nextjs.org/telemetry#error-feedback">Was this helpful?</a>
      - unexpected value "hidden"

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
  12  |     });
  13  |   });
  14  | 
  15  |   test('tour overlay is visible in studio for first-time users', async ({ page }) => {
  16  |     await page.goto('/studio/test-project-1');
  17  |     await page.waitForTimeout(2000);
  18  |     const tourOverlay = page.locator('[data-testid="onboarding-tour"]').or(page.getByText(/welcome|tour|get started/i));
  19  |     if (await tourOverlay.isVisible()) {
  20  |       await expect(tourOverlay).toBeVisible();
  21  |     }
  22  |   });
  23  | 
  24  |   test('tooltip hints show on toolbar hover', async ({ page }) => {
  25  |     await page.goto('/studio/test-project-1');
  26  |     await page.waitForTimeout(2000);
  27  |     const selectTool = page.getByRole('button', { name: /select/i }).first();
  28  |     if (await selectTool.isVisible()) {
  29  |       await selectTool.hover();
  30  |       await page.waitForTimeout(500);
  31  |       const tooltip = page.locator('[data-testid="tooltip-hint"]').or(page.getByRole('tooltip'));
  32  |       if (await tooltip.isVisible()) {
  33  |         await expect(tooltip).toBeVisible();
  34  |       }
  35  |     }
  36  |   });
  37  | 
  38  |   test('tour can be dismissed', async ({ page }) => {
  39  |     await page.goto('/studio/test-project-1');
  40  |     await page.waitForTimeout(2000);
  41  |     const dismissButton = page.getByRole('button', { name: /skip|dismiss|close/i });
  42  |     if (await dismissButton.isVisible()) {
  43  |       await dismissButton.click();
  44  |     }
  45  |   });
  46  | 
  47  |   test('tour progresses through steps', async ({ page }) => {
  48  |     await page.goto('/studio/test-project-1');
  49  |     await page.waitForTimeout(2000);
  50  |     const nextButton = page.getByRole('button', { name: /next/i });
  51  |     if (await nextButton.isVisible()) {
  52  |       await nextButton.click();
  53  |       await page.waitForTimeout(500);
  54  |     }
  55  |   });
  56  | 
  57  |   test('tour completion is saved', async ({ page }) => {
  58  |     await page.goto('/studio/test-project-1');
  59  |     await page.waitForTimeout(2000);
  60  |     const finishButton = page.getByRole('button', { name: /finish|done|complete/i });
  61  |     if (await finishButton.isVisible()) {
  62  |       await finishButton.click();
  63  |       await page.waitForTimeout(500);
  64  |     }
  65  |   });
  66  | });
  67  | 
  68  | test.describe('Help Panel', () => {
  69  |   test.beforeEach(async ({ page }) => {
  70  |     await mockAuth(page, 'pro');
  71  |     await mockCanvas(page);
  72  |     await mockProject(page, 'test-project-1');
  73  |   });
  74  | 
  75  |   test('help button is visible in studio', async ({ page }) => {
  76  |     await page.goto('/studio/test-project-1');
  77  |     await page.waitForTimeout(2000);
  78  |     const helpButton = page.getByRole('button', { name: /help|\?/i });
  79  |     await expect(helpButton.first()).toBeVisible();
  80  |   });
  81  | 
  82  |   test('help panel opens', async ({ page }) => {
  83  |     await page.goto('/studio/test-project-1');
  84  |     await page.waitForTimeout(2000);
  85  |     const helpButton = page.getByRole('button', { name: /help|\?/i });
  86  |     if (await helpButton.isVisible()) {
  87  |       await helpButton.first().click();
  88  |       await expect(page.getByText(/help/i)).toBeVisible();
  89  |     }
  90  |   });
  91  | 
  92  |   test('help panel has search', async ({ page }) => {
  93  |     await page.goto('/studio/test-project-1');
  94  |     await page.waitForTimeout(2000);
  95  |     const helpButton = page.getByRole('button', { name: /help|\?/i });
  96  |     if (await helpButton.isVisible()) {
  97  |       await helpButton.first().click();
  98  |     }
  99  |     const searchInput = page.getByPlaceholder(/search/i);
  100 |     if (await searchInput.isVisible()) {
  101 |       await expect(searchInput).toBeVisible();
  102 |     }
  103 |   });
  104 | 
  105 |   test('help panel has categories', async ({ page }) => {
  106 |     await page.goto('/studio/test-project-1');
  107 |     await page.waitForTimeout(2000);
  108 |     const helpButton = page.getByRole('button', { name: /help|\?/i });
  109 |     if (await helpButton.isVisible()) {
  110 |       await helpButton.first().click();
  111 |     }
> 112 |     await expect(page.getByText(/getting started|help|categories/i)).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  113 |   });
  114 | 
  115 |   test('help articles are accessible', async ({ page }) => {
  116 |     await page.goto('/studio/test-project-1');
  117 |     await page.waitForTimeout(2000);
  118 |     const helpButton = page.getByRole('button', { name: /help|\?/i });
  119 |     if (await helpButton.isVisible()) {
  120 |       await helpButton.first().click();
  121 |     }
  122 |     const article = page.locator('[data-testid="help-article"]').or(page.getByRole('link', { name: /help|article/i })).first();
  123 |     if (await article.isVisible()) {
  124 |       await article.click();
  125 |       await expect(page.getByRole('heading')).toBeVisible();
  126 |     }
  127 |   });
  128 | });
  129 | 
  130 | test.describe('Keyboard Shortcuts Help', () => {
  131 |   test.beforeEach(async ({ page }) => {
  132 |     await mockAuth(page, 'pro');
  133 |     await mockCanvas(page);
  134 |     await mockProject(page, 'test-project-1');
  135 |   });
  136 | 
  137 |   test('keyboard shortcuts dialog opens', async ({ page }) => {
  138 |     await page.goto('/studio/test-project-1');
  139 |     await page.waitForTimeout(2000);
  140 |     await page.keyboard.press('?');
  141 |     await expect(page.getByText(/keyboard shortcuts/i)).toBeVisible();
  142 |   });
  143 | 
  144 |   test('shortcuts are categorized', async ({ page }) => {
  145 |     await page.goto('/studio/test-project-1');
  146 |     await page.waitForTimeout(2000);
  147 |     await page.keyboard.press('?');
  148 |     await expect(page.getByText(/general|editing/i)).toBeVisible();
  149 |   });
  150 | });
  151 | 
```