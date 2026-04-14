# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> Share Page >> share page loads
- Location: tests/e2e/misc.spec.ts:187:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/shared|design|project/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/shared|design|project/i)

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
  96  | test.describe('Billing / Pro Features', () => {
  97  |   test('pro upgrade modal can open', async ({ page }) => {
  98  |     await mockAuth(page, 'free');
  99  |     await page.goto('/dashboard');
  100 |     const upgradeButton = page.getByRole('button', { name: /upgrade to pro/i });
  101 |     if (await upgradeButton.isVisible()) {
  102 |       await upgradeButton.click();
  103 |       await expect(page.getByRole('dialog').or(page.getByText(/upgrade|pro/i))).toBeVisible();
  104 |     }
  105 |   });
  106 | 
  107 |   test('pro features are gated', async ({ page }) => {
  108 |     await mockAuth(page, 'free');
  109 |     await page.goto('/dashboard');
  110 |     await expect(page.locator('body')).toBeVisible();
  111 |   });
  112 | });
  113 | 
  114 | test.describe('Session Timeout', () => {
  115 |   test('expired session redirects to signin', async ({ page }) => {
  116 |     await page.evaluate(() => {
  117 |       document.cookie.split(';').forEach((c) => {
  118 |         document.cookie = c
  119 |           .replace(/^ +/, '')
  120 |           .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  121 |       });
  122 |       localStorage.clear();
  123 |     });
  124 | 
  125 |     await page.goto('/dashboard');
  126 |     await page.waitForURL(/auth\/signin|signin/);
  127 |   });
  128 | });
  129 | 
  130 | test.describe('Public Pages', () => {
  131 |   test('about page loads', async ({ page }) => {
  132 |     await page.goto('/about');
  133 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  134 |   });
  135 | 
  136 |   test('terms page loads', async ({ page }) => {
  137 |     await page.goto('/terms');
  138 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  139 |   });
  140 | 
  141 |   test('privacy page loads', async ({ page }) => {
  142 |     await page.goto('/privacy');
  143 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  144 |   });
  145 | 
  146 |   test('contact page loads', async ({ page }) => {
  147 |     await page.goto('/contact');
  148 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  149 |   });
  150 | 
  151 |   test('help page loads', async ({ page }) => {
  152 |     await page.goto('/help');
  153 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  154 |   });
  155 | });
  156 | 
  157 | test.describe('Shop Page', () => {
  158 |   test('shop page loads', async ({ page }) => {
  159 |     await page.goto('/shop');
  160 |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  161 |   });
  162 | 
  163 |   test('shop has fabric listings', async ({ page }) => {
  164 |     await page.goto('/shop');
  165 |     await expect(page.getByText(/fabric|shop|buy/i)).toBeVisible();
  166 |   });
  167 | });
  168 | 
  169 | test.describe('Photo-to-Design Page', () => {
  170 |   test('photo-to-design page loads', async ({ page }) => {
  171 |     await mockAuth(page, 'pro');
  172 |     await page.goto('/photo-to-design');
  173 |     await expect(page.getByText(/photo|upload|image/i)).toBeVisible();
  174 |   });
  175 | 
  176 |   test('photo upload button exists', async ({ page }) => {
  177 |     await mockAuth(page, 'pro');
  178 |     await page.goto('/photo-to-design');
  179 |     const uploadButton = page.getByRole('button', { name: /upload|select photo/i });
  180 |     if (await uploadButton.isVisible()) {
  181 |       await expect(uploadButton).toBeVisible();
  182 |     }
  183 |   });
  184 | });
  185 | 
  186 | test.describe('Share Page', () => {
  187 |   test('share page loads', async ({ page }) => {
  188 |     await page.route('**/api/projects/test-share-id/public', async (route) => {
  189 |       await route.fulfill({
  190 |         status: 200,
  191 |         contentType: 'application/json',
  192 |         body: JSON.stringify({ id: 'test-share-id', name: 'Shared Project', public: true }),
  193 |       });
  194 |     });
  195 |     await page.goto('/share/test-share-id');
> 196 |     await expect(page.getByText(/shared|design|project/i)).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  197 |   });
  198 | });
  199 | 
  200 | test.describe('Orders Page', () => {
  201 |   test('orders page redirects unauthenticated users', async ({ page }) => {
  202 |     await page.goto('/dashboard/orders');
  203 |     await page.waitForURL(/signin/);
  204 |     expect(page.url()).toContain('signin');
  205 |   });
  206 | 
  207 |   test('orders page loads for authenticated users', async ({ page }) => {
  208 |     await mockAuth(page, 'pro');
  209 |     await page.route('**/api/orders', async (route) => {
  210 |       await route.fulfill({
  211 |         status: 200,
  212 |         contentType: 'application/json',
  213 |         body: JSON.stringify([]),
  214 |       });
  215 |     });
  216 |     await page.goto('/dashboard/orders');
  217 |     await expect(page.getByText(/order/i)).toBeVisible();
  218 |   });
  219 | });
  220 | 
  221 | test.describe('API Endpoints', () => {
  222 |   test('API health check', async ({ request }) => {
  223 |     const response = await request.get('/api/health');
  224 |     expect([200, 404, 307]).toContain(response.status());
  225 |   });
  226 | 
  227 |   test('unauthorized API access returns 401', async ({ request }) => {
  228 |     const response = await request.get('/api/projects');
  229 |     expect([401, 403, 307, 302]).toContain(response.status());
  230 |   });
  231 | });
  232 | 
```