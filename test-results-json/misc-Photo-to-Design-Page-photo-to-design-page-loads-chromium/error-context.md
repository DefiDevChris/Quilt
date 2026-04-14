# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> Photo-to-Design Page >> photo-to-design page loads
- Location: tests/e2e/misc.spec.ts:170:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/photo|upload|image/i)
Expected: visible
Error: strict mode violation: getByText(/photo|upload|image/i) resolved to 5 elements:
    1) <h1 class="text-[16px] leading-[24px] font-semibold text-[var(--color-text)]">Photo to Design</h1> aka getByRole('heading', { name: 'Photo to Design' })
    2) <span class="text-[13px] text-[var(--color-text-dim)]">…</span> aka getByText('— Upload')
    3) <h2 class="text-[24px] leading-[32px] font-semibold text-[var(--color-text)]">Upload a quilt photo</h2> aka getByRole('heading', { name: 'Upload a quilt photo' })
    4) <p class="text-[14px] leading-[20px] text-[var(--color-text-dim)] max-w-md text-center">Take a straight-on photo of your quilt. The engin…</p> aka getByText('Take a straight-on photo of')
    5) <span class="text-[14px] leading-[20px] text-[var(--color-text-dim)]">Drop a photo here or click to browse</span> aka getByText('Drop a photo here or click to')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/photo|upload|image/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - heading "Photo to Design" [level=1] [ref=e7]
          - generic [ref=e8]: — Upload
        - generic [ref=e9]:
          - generic "Upload" [ref=e11]
          - generic "Crop" [ref=e14]
          - generic "Calibrate" [ref=e17]
          - generic "Review" [ref=e20]
        - button "Start Over" [ref=e21]
      - generic [ref=e23]:
        - heading "Upload a quilt photo" [level=2] [ref=e24]
        - paragraph [ref=e25]: Take a straight-on photo of your quilt. The engine will trace every seam and turn each fabric patch into a scalable shape.
        - generic [ref=e26] [cursor=pointer]:
          - img [ref=e27]
          - generic [ref=e29]: Drop a photo here or click to browse
          - generic [ref=e30]: JPEG, PNG, WebP, or HEIC
  - generic "Notifications"
  - generic [ref=e35] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e36]:
      - img [ref=e37]
    - generic [ref=e40]:
      - button "Open issues overlay" [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]: "0"
          - generic [ref=e44]: "1"
        - generic [ref=e45]: Issue
      - button "Collapse issues badge" [ref=e46]:
        - img [ref=e47]
  - alert [ref=e49]
```

# Test source

```ts
  73  |   });
  74  | });
  75  | 
  76  | test.describe('Responsive Design', () => {
  77  |   test('mobile viewport works', async ({ page }) => {
  78  |     await page.setViewportSize({ width: 375, height: 667 });
  79  |     await page.goto('/');
  80  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  81  |   });
  82  | 
  83  |   test('tablet viewport works', async ({ page }) => {
  84  |     await page.setViewportSize({ width: 768, height: 1024 });
  85  |     await page.goto('/');
  86  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  87  |   });
  88  | 
  89  |   test('desktop viewport works', async ({ page }) => {
  90  |     await page.setViewportSize({ width: 1920, height: 1080 });
  91  |     await page.goto('/');
  92  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  93  |   });
  94  | });
  95  | 
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
> 173 |     await expect(page.getByText(/photo|upload|image/i)).toBeVisible();
      |                                                         ^ Error: expect(locator).toBeVisible() failed
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