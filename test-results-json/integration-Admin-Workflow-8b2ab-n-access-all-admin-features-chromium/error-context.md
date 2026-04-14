# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> Admin Workflow >> admin can access all admin features
- Location: tests/e2e/integration.spec.ts:144:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/admin|moderation/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/admin|moderation/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [active]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - navigation [ref=e7]:
            - button "previous" [disabled] [ref=e8]:
              - img "previous" [ref=e9]
            - generic [ref=e11]:
              - generic [ref=e12]: 1/
              - text: "2"
            - button "next" [ref=e13] [cursor=pointer]:
              - img "next" [ref=e14]
          - img
        - generic [ref=e16]:
          - generic [ref=e17]:
            - img [ref=e18]
            - generic "Latest available version is detected (16.2.3)." [ref=e20]: Next.js 16.2.3
            - generic [ref=e21]: Turbopack
          - img
      - generic [ref=e22]:
        - dialog "Console Error" [ref=e23]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]:
                - generic [ref=e30]: Console Error
                - generic [ref=e31]:
                  - button "Copy Error Info" [ref=e32] [cursor=pointer]:
                    - img [ref=e33]
                  - button "No related documentation found" [disabled] [ref=e35]:
                    - img [ref=e36]
                  - button "Attach Node.js inspector" [ref=e38] [cursor=pointer]:
                    - img [ref=e39]
              - generic [ref=e48]: "eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment. React will never use eval() in production mode"
            - generic [ref=e51]:
              - paragraph [ref=e52]:
                - text: Call Stack
                - generic [ref=e53]: "24"
              - button "Show 24 ignore-listed frame(s)" [ref=e54] [cursor=pointer]:
                - text: Show 24 ignore-listed frame(s)
                - img [ref=e55]
          - generic [ref=e57]: "1"
          - generic [ref=e58]: "2"
        - contentinfo [ref=e59]:
          - region "Error feedback" [ref=e60]:
            - paragraph [ref=e61]:
              - link "Was this helpful?" [ref=e62] [cursor=pointer]:
                - /url: https://nextjs.org/telemetry#error-feedback
            - button "Mark as helpful" [ref=e63] [cursor=pointer]:
              - img [ref=e64]
            - button "Mark as not helpful" [ref=e67] [cursor=pointer]:
              - img [ref=e68]
    - generic [ref=e74] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e75]:
        - img [ref=e76]
      - generic [ref=e79]:
        - button "Open issues overlay" [ref=e80]:
          - generic [ref=e81]:
            - generic [ref=e82]: "1"
            - generic [ref=e83]: "2"
          - generic [ref=e84]:
            - text: Issue
            - generic [ref=e85]: s
        - button "Collapse issues badge" [ref=e86]:
          - img [ref=e87]
  - generic [ref=e89]:
    - heading "Something went wrong" [level=1] [ref=e90]
    - paragraph [ref=e91]: We're sorry, but something unexpected happened. Please try refreshing the page.
    - button "Try again" [ref=e92] [cursor=pointer]
```

# Test source

```ts
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
> 146 |     await expect(page.getByText(/admin|moderation/i)).toBeVisible({ timeout: 10000 });
      |                                                       ^ Error: expect(locator).toBeVisible() failed
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