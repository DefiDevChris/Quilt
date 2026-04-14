# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> End-to-End User Flows >> authenticated user can navigate app
- Location: tests/e2e/integration.spec.ts:23:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByPlaceholder(/search/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByPlaceholder(/search/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - navigation "Main navigation" [ref=e5]:
      - link "QuiltCorgi Logo QuiltCorgi" [ref=e6] [cursor=pointer]:
        - /url: /dashboard
        - img "QuiltCorgi Logo" [ref=e7]
        - generic [ref=e8]: QuiltCorgi
      - generic [ref=e9]:
        - link "Dashboard" [ref=e10] [cursor=pointer]:
          - /url: /dashboard
        - link "Shop" [ref=e11] [cursor=pointer]:
          - /url: /shop
        - link "Profile" [ref=e12] [cursor=pointer]:
          - /url: /profile
      - button "User menu" [ref=e14]:
        - img "Default Avatar" [ref=e16]
    - main [ref=e17]:
      - generic [ref=e19]:
        - generic:
          - img "QuiltCorgi Mascot"
        - generic [ref=e20]:
          - generic [ref=e22]:
            - generic [ref=e23]:
              - paragraph [ref=e26]: Archive
              - heading "Project Library" [level=1] [ref=e27]
              - paragraph [ref=e28]: 0 curated designs
            - generic [ref=e30]:
              - generic [ref=e31]:
                - button "Grid View" [ref=e32]:
                  - img [ref=e33]
                - button "List View" [ref=e35]:
                  - img [ref=e36]
              - link "Create New" [ref=e37] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e38]
                - text: Create New
          - generic [ref=e40]:
            - img "QuiltCorgi Mascot" [ref=e41]
            - heading "No projects yet" [level=3] [ref=e42]
            - paragraph [ref=e43]: Start your first quilt design and build your collection of curated patterns.
            - link "Start Your First Quilt" [ref=e44] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e45]
              - text: Start Your First Quilt
  - generic "Notifications"
  - generic [ref=e50] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e51]:
      - img [ref=e52]
    - generic [ref=e55]:
      - button "Open issues overlay" [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]: "1"
          - generic [ref=e59]: "2"
        - generic [ref=e60]:
          - text: Issue
          - generic [ref=e61]: s
      - button "Collapse issues badge" [ref=e62]:
        - img [ref=e63]
  - alert [ref=e65]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('End-to-End User Flows', () => {
  5   |   test('complete signup to project creation flow', async ({ page }) => {
  6   |     await page.goto('/');
  7   |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  8   | 
  9   |     const signupLink = page.getByRole('link', { name: /start designing free/i }).first();
  10  |     await expect(signupLink).toHaveAttribute('href', '/auth/signup');
  11  |   });
  12  | 
  13  |   test('unauthenticated user redirected from protected routes', async ({ page }) => {
  14  |     const protectedRoutes = ['/dashboard', '/studio/test', '/projects', '/settings'];
  15  | 
  16  |     for (const route of protectedRoutes) {
  17  |       await page.goto(route);
  18  |       await page.waitForURL(/signin/, { timeout: 10000 });
  19  |       expect(page.url()).toContain('signin');
  20  |     }
  21  |   });
  22  | 
  23  |   test('authenticated user can navigate app', async ({ page }) => {
  24  |     await mockAuth(page, 'pro');
  25  | 
  26  |     await page.goto('/dashboard');
  27  |     await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
  28  | 
  29  |     await page.goto('/projects');
> 30  |     await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10000 });
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  31  |   });
  32  | });
  33  | 
  34  | test.describe('Project Lifecycle', () => {
  35  |   test.beforeEach(async ({ page }) => {
  36  |     await mockAuth(page, 'pro');
  37  |     await mockCanvas(page);
  38  |   });
  39  | 
  40  |   test('create, edit, and save project', async ({ page }) => {
  41  |     await page.goto('/dashboard');
  42  |     await page.waitForTimeout(2000);
  43  | 
  44  |     await page.goto('/studio/test-project-1');
  45  |     await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  46  | 
  47  |     await page.keyboard.press('Control+S');
  48  |     await page.waitForTimeout(1000);
  49  |   });
  50  | 
  51  |   test('project auto-saves changes', async ({ page }) => {
  52  |     await page.goto('/studio/test-project-1');
  53  |     await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  54  | 
  55  |     await page.waitForTimeout(3000);
  56  |     const saved = page.getByText(/saved/i);
  57  |     if (await saved.isVisible({ timeout: 15000 })) {
  58  |       await expect(saved).toBeVisible();
  59  |     }
  60  |   });
  61  | });
  62  | 
  63  | test.describe('Design Workflow', () => {
  64  |   test.beforeEach(async ({ page }) => {
  65  |     await mockAuth(page, 'pro');
  66  |     await mockCanvas(page);
  67  |   });
  68  | 
  69  |   test('complete design workflow', async ({ page }) => {
  70  |     await page.goto('/studio/test-project-1');
  71  |     await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  72  | 
  73  |     await page.keyboard.press('Control+A');
  74  |     await page.keyboard.press('Control+C');
  75  |     await page.keyboard.press('Control+V');
  76  |     await page.keyboard.press('Control+Z');
  77  |     await page.keyboard.press('Control+Y');
  78  |   });
  79  | 
  80  |   test('worktable switching preserves state', async ({ page }) => {
  81  |     await page.goto('/studio/test-project-1');
  82  |     await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
  83  | 
  84  |     const tab2 = page.getByRole('tab', { name: /worktable 2/i });
  85  |     if (await tab2.isVisible()) {
  86  |       await tab2.click();
  87  |       await page.waitForTimeout(1000);
  88  | 
  89  |       const tab1 = page.getByRole('tab', { name: /worktable 1/i });
  90  |       await tab1.click();
  91  |     }
  92  |   });
  93  | });
  94  | 
  95  | test.describe('Export Workflow', () => {
  96  |   test.beforeEach(async ({ page }) => {
  97  |     await mockAuth(page, 'pro');
  98  |     await mockCanvas(page);
  99  |   });
  100 | 
  101 |   test('export options are available', async ({ page }) => {
  102 |     await page.goto('/studio/test-project-1');
  103 |     await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  104 | 
  105 |     const exportButton = page.getByRole('button', { name: /export/i });
  106 |     if (await exportButton.isVisible()) {
  107 |       await exportButton.click();
  108 |       const pdf = page.getByText(/pdf/i);
  109 |       if (await pdf.isVisible({ timeout: 5000 })) {
  110 |         await expect(pdf).toBeVisible();
  111 |       }
  112 |     }
  113 |   });
  114 | });
  115 | 
  116 | test.describe('Mobile Responsive Flow', () => {
  117 |   test('mobile navigation works', async ({ page, isMobile }) => {
  118 |     if (isMobile) {
  119 |       await page.goto('/');
  120 |       await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  121 | 
  122 |       await page.goto('/blog');
  123 |       await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
  124 |     }
  125 |   });
  126 | 
  127 |   test('mobile studio gate works', async ({ page, isMobile }) => {
  128 |     if (isMobile) {
  129 |       await mockAuth(page);
  130 |       await page.goto('/studio/test-project-1');
```