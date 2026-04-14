# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> Error Handling >> 404 page works
- Location: tests/e2e/integration.spec.ts:154:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/404|not found/i)
Expected: visible
Error: strict mode violation: getByText(/404|not found/i) resolved to 2 elements:
    1) <h1 class="text-[40px] leading-[52px] font-normal text-primary mb-4">404</h1> aka getByRole('heading', { name: '404' })
    2) <h2 class="text-[24px] leading-[32px] font-normal text-default mb-4">Page Not Found</h2> aka getByRole('heading', { name: 'Page Not Found' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/404|not found/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e3]:
    - navigation [ref=e4]:
      - link "QuiltCorgi Logo QuiltCorgi" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "QuiltCorgi Logo" [ref=e6]
        - generic [ref=e7]: QuiltCorgi
      - generic [ref=e8]:
        - link "Features" [ref=e9] [cursor=pointer]:
          - /url: /#features
        - link "Blog" [ref=e10] [cursor=pointer]:
          - /url: /blog
        - link "Shop" [ref=e11] [cursor=pointer]:
          - /url: /shop
        - link "Go to Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /dashboard
  - main [ref=e13]:
    - generic [ref=e14]:
      - img "QuiltCorgi Mascot" [ref=e15]
      - heading "404" [level=1] [ref=e16]
      - heading "Page Not Found" [level=2] [ref=e17]
      - paragraph [ref=e18]: Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      - generic [ref=e19]:
        - link "Go to Dashboard" [ref=e20] [cursor=pointer]:
          - /url: /dashboard
        - link "Back to Home" [ref=e21] [cursor=pointer]:
          - /url: /
  - contentinfo [ref=e22]:
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - img "QuiltCorgi Logo" [ref=e27]
            - generic [ref=e28]: QuiltCorgi
          - paragraph [ref=e29]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
        - generic [ref=e30]:
          - heading "Product" [level=4] [ref=e31]
          - list [ref=e32]:
            - listitem [ref=e33]:
              - link "Design Studio" [ref=e34] [cursor=pointer]:
                - /url: "#features"
            - listitem [ref=e35]:
              - link "Yardage Calculator" [ref=e36] [cursor=pointer]:
                - /url: "#features"
        - generic [ref=e37]:
          - heading "Resources" [level=4] [ref=e38]
          - list [ref=e39]:
            - listitem [ref=e40]:
              - link "Blog" [ref=e41] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e42]:
              - link "Help Center" [ref=e43] [cursor=pointer]:
                - /url: /help
        - generic [ref=e44]:
          - heading "Company" [level=4] [ref=e45]
          - list [ref=e46]:
            - listitem [ref=e47]:
              - link "About" [ref=e48] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e49]:
              - link "Contact" [ref=e50] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e51]:
              - link "Privacy Policy" [ref=e52] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e53]:
              - link "Terms of Service" [ref=e54] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e55]:
        - paragraph [ref=e56]: © 2026 QuiltCorgi. All rights reserved.
        - generic [ref=e57]:
          - link "Privacy" [ref=e58] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e59] [cursor=pointer]:
            - /url: /terms
  - generic "Notifications"
  - generic [ref=e64] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e65]:
      - img [ref=e66]
    - generic [ref=e69]:
      - button "Open issues overlay" [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]: "0"
          - generic [ref=e73]: "1"
        - generic [ref=e74]: Issue
      - button "Collapse issues badge" [ref=e75]:
        - img [ref=e76]
  - alert [ref=e78]
```

# Test source

```ts
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
> 156 |     await expect(page.getByText(/404|not found/i)).toBeVisible({ timeout: 10000 });
      |                                                    ^ Error: expect(locator).toBeVisible() failed
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