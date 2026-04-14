# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> Export Workflow >> export options are available
- Location: tests/e2e/integration.spec.ts:101:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('canvas')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
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
> 103 |     await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
      |                                          ^ Error: expect(locator).toBeVisible() failed
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
  131 |       const desktopMessage = page.getByText(/desktop/i);
  132 |       if (await desktopMessage.isVisible()) {
  133 |         await expect(desktopMessage).toBeVisible();
  134 |       }
  135 |     }
  136 |   });
  137 | });
  138 | 
  139 | test.describe('Admin Workflow', () => {
  140 |   test.beforeEach(async ({ page }) => {
  141 |     await mockAuth(page, 'admin');
  142 |   });
  143 | 
  144 |   test('admin can access all admin features', async ({ page }) => {
  145 |     await page.goto('/admin');
  146 |     await expect(page.getByText(/admin|moderation/i)).toBeVisible({ timeout: 10000 });
  147 | 
  148 |     await page.goto('/admin/moderation');
  149 |     await expect(page.getByText(/moderation|posts/i)).toBeVisible({ timeout: 10000 });
  150 |   });
  151 | });
  152 | 
  153 | test.describe('Error Handling', () => {
  154 |   test('404 page works', async ({ page }) => {
  155 |     await page.goto('/nonexistent-page');
  156 |     await expect(page.getByText(/404|not found/i)).toBeVisible({ timeout: 10000 });
  157 |   });
  158 | 
  159 |   test('handles invalid project ID', async ({ page }) => {
  160 |     await mockAuth(page);
  161 |     await page.goto('/studio/invalid-project-id');
  162 |     await page.waitForTimeout(2000);
  163 |   });
  164 | });
  165 | 
  166 | test.describe('Performance', () => {
  167 |   test('landing page loads quickly', async ({ page }) => {
  168 |     const startTime = Date.now();
  169 |     await page.goto('/');
  170 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  171 |     const loadTime = Date.now() - startTime;
  172 |     expect(loadTime).toBeLessThan(5000);
  173 |   });
  174 | 
  175 |   test('dashboard loads quickly for authenticated users', async ({ page }) => {
  176 |     await mockAuth(page, 'pro');
  177 |     const startTime = Date.now();
  178 |     await page.goto('/dashboard');
  179 |     await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
  180 |     const loadTime = Date.now() - startTime;
  181 |     expect(loadTime).toBeLessThan(10000);
  182 |   });
  183 | });
  184 | 
  185 | test.describe('Cross-Browser Compatibility', () => {
  186 |   test('app works in all browsers', async ({ page, browserName }) => {
  187 |     await page.goto('/');
  188 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  189 | 
  190 |     await page.goto('/blog');
  191 |     await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
  192 |   });
  193 | });
  194 | 
```