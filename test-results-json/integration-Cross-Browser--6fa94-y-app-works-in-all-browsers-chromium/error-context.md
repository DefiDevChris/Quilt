# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: integration.spec.ts >> Cross-Browser Compatibility >> app works in all browsers
- Location: tests/e2e/integration.spec.ts:186:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Blog', exact: true }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Blog', exact: true }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - navigation [ref=e5]:
        - link "QuiltCorgi Logo QuiltCorgi" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "QuiltCorgi Logo" [ref=e7]
          - generic [ref=e8]: QuiltCorgi
        - generic [ref=e9]:
          - link "Features" [ref=e10] [cursor=pointer]:
            - /url: /#features
          - link "Blog" [ref=e11] [cursor=pointer]:
            - /url: /blog
          - link "Shop" [ref=e12] [cursor=pointer]:
            - /url: /shop
          - link "Go to Dashboard" [ref=e13] [cursor=pointer]:
            - /url: /dashboard
    - main [ref=e14]:
      - generic [ref=e16]:
        - img "QuiltCorgi Mascot" [ref=e17]
        - heading "No stories yet" [level=2] [ref=e18]
        - paragraph [ref=e19]: New content is being crafted. Return soon for fresh inspiration.
    - contentinfo [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]:
              - img "QuiltCorgi Logo" [ref=e25]
              - generic [ref=e26]: QuiltCorgi
            - paragraph [ref=e27]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
          - generic [ref=e28]:
            - heading "Product" [level=4] [ref=e29]
            - list [ref=e30]:
              - listitem [ref=e31]:
                - link "Design Studio" [ref=e32] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e33]:
                - link "Yardage Calculator" [ref=e34] [cursor=pointer]:
                  - /url: "#features"
          - generic [ref=e35]:
            - heading "Resources" [level=4] [ref=e36]
            - list [ref=e37]:
              - listitem [ref=e38]:
                - link "Blog" [ref=e39] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e40]:
                - link "Help Center" [ref=e41] [cursor=pointer]:
                  - /url: /help
          - generic [ref=e42]:
            - heading "Company" [level=4] [ref=e43]
            - list [ref=e44]:
              - listitem [ref=e45]:
                - link "About" [ref=e46] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e47]:
                - link "Contact" [ref=e48] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e49]:
                - link "Privacy Policy" [ref=e50] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e51]:
                - link "Terms of Service" [ref=e52] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e53]:
          - paragraph [ref=e54]: © 2026 QuiltCorgi. All rights reserved.
          - generic [ref=e55]:
            - link "Privacy" [ref=e56] [cursor=pointer]:
              - /url: /privacy
            - link "Terms" [ref=e57] [cursor=pointer]:
              - /url: /terms
  - generic "Notifications"
  - generic [ref=e62] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e63]:
      - img [ref=e64]
    - generic [ref=e67]:
      - button "Open issues overlay" [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e70]: "0"
          - generic [ref=e71]: "1"
        - generic [ref=e72]: Issue
      - button "Collapse issues badge" [ref=e73]:
        - img [ref=e74]
  - alert [ref=e76]
```

# Test source

```ts
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
> 191 |     await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
      |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  192 |   });
  193 | });
  194 | 
```