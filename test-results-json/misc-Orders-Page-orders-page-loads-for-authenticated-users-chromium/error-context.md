# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> Orders Page >> orders page loads for authenticated users
- Location: tests/e2e/misc.spec.ts:207:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/order/i)
Expected: visible
Error: strict mode violation: getByText(/order/i) resolved to 3 elements:
    1) <h1 class="text-default text-[40px] leading-[52px] font-normal">Order History</h1> aka getByRole('heading', { name: 'Order History' })
    2) <button class="px-4 py-2 rounded-full font-['Inter'] text-sm whitespace-nowrap transition-colors duration-150 ease-out bg-[#ff8d49] text-[#1a1a1a]">All Orders</button> aka getByRole('button', { name: 'All Orders' })
    3) <p class="text-lg font-['Spline_Sans'] font-semibold text-[#1a1a1a] mt-1">Order #st_001</p> aka getByText('Order #st_001')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/order/i)

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
      - generic [ref=e18]:
        - generic [ref=e20]:
          - generic [ref=e21]:
            - paragraph [ref=e24]: Dashboard
            - heading "Order History" [level=1] [ref=e25]
            - paragraph [ref=e26]: View and manage your fabric purchases
          - link "Back to Dashboard" [ref=e28] [cursor=pointer]:
            - /url: /dashboard
        - generic [ref=e30]:
          - button "All Orders" [ref=e31]
          - button "Pending" [ref=e32]
          - button "Confirmed" [ref=e33]
          - button "Fulfilled" [ref=e34]
          - button "Cancelled" [ref=e35]
          - button "Refunded" [ref=e36]
        - generic [ref=e39]:
          - generic [ref=e40]:
            - generic [ref=e41]:
              - paragraph [ref=e42]: April 12, 2026
              - paragraph [ref=e43]: "Order #st_001"
            - generic [ref=e44]: Fulfilled
          - generic [ref=e50]:
            - generic [ref=e51]:
              - paragraph [ref=e52]: 2 fabrics
              - paragraph [ref=e53]: Kona Cotton White +1 more
            - generic [ref=e54]:
              - paragraph [ref=e55]: $42.50
              - link "View Details" [ref=e56] [cursor=pointer]:
                - /url: /dashboard/orders/461ca6f4-c7ec-4048-a75a-103319516fdb
  - generic "Notifications"
  - generic [ref=e61] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e62]:
      - img [ref=e63]
    - generic [ref=e66]:
      - button "Open issues overlay" [ref=e67]:
        - generic [ref=e68]:
          - generic [ref=e69]: "0"
          - generic [ref=e70]: "1"
        - generic [ref=e71]: Issue
      - button "Collapse issues badge" [ref=e72]:
        - img [ref=e73]
  - alert [ref=e75]
```

# Test source

```ts
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
  196 |     await expect(page.getByText(/shared|design|project/i)).toBeVisible();
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
> 217 |     await expect(page.getByText(/order/i)).toBeVisible();
      |                                            ^ Error: expect(locator).toBeVisible() failed
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