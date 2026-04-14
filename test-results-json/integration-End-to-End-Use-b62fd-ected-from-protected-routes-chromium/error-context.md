# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> End-to-End User Flows >> unauthenticated user redirected from protected routes
- Location: tests/e2e/integration.spec.ts:13:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
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
      - generic [ref=e13]:
        - link "Sign In" [ref=e14] [cursor=pointer]:
          - /url: /auth/signin
        - link "Start Designing" [ref=e15] [cursor=pointer]:
          - /url: /auth/signup
    - main [ref=e16]:
      - generic [ref=e19]:
        - generic [ref=e21]:
          - heading "Dashboard" [level=1] [ref=e22]
          - paragraph [ref=e23]: Good evening, there
        - generic [ref=e24]:
          - heading "Quick Actions" [level=2] [ref=e25]
          - generic [ref=e26]:
            - button "New Design Start a fresh project from scratch or a template" [ref=e27]:
              - generic [ref=e29]:
                - paragraph [ref=e30]: New Design
                - paragraph [ref=e31]: Start a fresh project from scratch or a template
            - link "Photo to Design Extract a pattern from a photo of a quilt" [ref=e32] [cursor=pointer]:
              - /url: /photo-to-design
              - generic [ref=e34]:
                - paragraph [ref=e35]: Photo to Design
                - paragraph [ref=e36]: Extract a pattern from a photo of a quilt
            - button "Continue Latest No projects yet" [disabled] [ref=e37]:
              - generic [ref=e39]:
                - paragraph [ref=e40]: Continue Latest
                - paragraph [ref=e41]: No projects yet
        - generic [ref=e42]:
          - heading "Navigate" [level=2] [ref=e43]
          - generic [ref=e44]:
            - link "Projects Manage your designs" [ref=e45] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e48]:
                - paragraph [ref=e49]: Projects
                - paragraph [ref=e50]: Manage your designs
            - link "Fabric Library Browse fabrics" [ref=e51] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e54]:
                - paragraph [ref=e55]: Fabric Library
                - paragraph [ref=e56]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e57]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - paragraph [ref=e61]: Mobile Uploads
                  - paragraph [ref=e62]: Process uploads
                - generic [ref=e63]: "0"
            - link "Settings Account preferences" [ref=e64] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e67]:
                - paragraph [ref=e68]: Settings
                - paragraph [ref=e69]: Account preferences
  - generic "Notifications"
  - generic [ref=e74] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e75]:
      - img [ref=e76]
    - generic [ref=e79]:
      - button "Open issues overlay" [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: "0"
          - generic [ref=e83]: "1"
        - generic [ref=e84]: Issue
      - button "Collapse issues badge" [ref=e85]:
        - img [ref=e86]
  - alert [ref=e88]
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
> 18  |       await page.waitForURL(/signin/, { timeout: 10000 });
      |                  ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
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
  30  |     await expect(page.getByPlaceholder(/search/i)).toBeVisible({ timeout: 10000 });
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
```