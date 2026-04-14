# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> Shop Page >> shop has fabric listings
- Location: tests/e2e/misc.spec.ts:163:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/fabric|shop|buy/i)
Expected: visible
Error: strict mode violation: getByText(/fabric|shop|buy/i) resolved to 11 elements:
    1) <h1 class="text-[48px] sm:text-[56px] md:text-[64px] leading-[1.1] font-semibold mb-6">Fabric Shop</h1> aka getByRole('heading', { name: 'Fabric Shop' })
    2) <p class="text-xl mb-10 max-w-2xl mx-auto leading-relaxed">Discover our curated collection of premium quilti…</p> aka getByText('Discover our curated')
    3) <button class="px-8 py-3 rounded-full font-semibold transition-colors duration-150">Browse Fabrics</button> aka getByRole('button', { name: 'Browse Fabrics' })
    4) <button class="px-8 py-3 rounded-full font-semibold transition-colors duration-150 border-2">Shop by Category</button> aka getByRole('button', { name: 'Shop by Category' })
    5) <h2 class="text-[32px] leading-[40px] font-semibold mb-2">Shop by Category</h2> aka getByRole('heading', { name: 'Shop by Category' })
    6) <h3 class="text-sm font-semibold">Fabric by the Yard</h3> aka getByRole('button', { name: 'Fabric by the Yard Fabric by' })
    7) <p class="text-xs">Foundation fabrics</p> aka getByRole('button', { name: 'Batting & Backing Batting &' })
    8) <label class="sr-only" for="shop-search">Search fabrics</label> aka getByText('Search fabrics')
    9) <label for="shop-sort" class="sr-only">Sort fabrics</label> aka getByText('Sort fabrics')
    10) <p class="text-sm font-medium">0 fabrics found</p> aka getByText('fabrics found')
    ...

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/fabric|shop|buy/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Flowing fabric drapes" [ref=e6]
      - img "Fabric shop shelves" [ref=e9]
      - img "Fabric collection display" [ref=e12]
      - generic [ref=e15]:
        - heading "Fabric Shop" [level=1] [ref=e21]
        - paragraph [ref=e22]: Discover our curated collection of premium quilting fabrics, pre-cuts, and notions
        - generic [ref=e23]:
          - button "Browse Fabrics" [ref=e24]
          - button "Shop by Category" [ref=e25]
      - generic [ref=e26]:
        - button "Go to slide 1" [ref=e27]
        - button "Go to slide 2" [ref=e28]
        - button "Go to slide 3" [ref=e29]
    - generic [ref=e30]:
      - generic [ref=e31]:
        - heading "Shop by Category" [level=2] [ref=e32]
        - paragraph [ref=e33]: Find exactly what you need for your next project
      - generic [ref=e34]:
        - button "5\" Charm Packs 5\" Charm Packs Pre-cut 5\" squares" [ref=e35]:
          - img "5\" Charm Packs" [ref=e37]
          - generic [ref=e39]:
            - generic [ref=e40]:
              - img [ref=e41]
              - heading "5\" Charm Packs" [level=3] [ref=e54]
            - paragraph [ref=e55]: Pre-cut 5" squares
        - button "2.5\" Jelly Rolls 2.5\" Jelly Rolls Pre-cut strips" [ref=e56]:
          - img "2.5\" Jelly Rolls" [ref=e58]
          - generic [ref=e60]:
            - generic [ref=e61]:
              - img [ref=e62]
              - heading "2.5\" Jelly Rolls" [level=3] [ref=e70]
            - paragraph [ref=e71]: Pre-cut strips
        - button "10\" Layer Cakes 10\" Layer Cakes Pre-cut 10\" squares" [ref=e72]:
          - img "10\" Layer Cakes" [ref=e74]
          - generic [ref=e76]:
            - generic [ref=e77]:
              - img [ref=e78]
              - heading "10\" Layer Cakes" [level=3] [ref=e84]
            - paragraph [ref=e85]: Pre-cut 10" squares
        - button "Fabric by the Yard Fabric by the Yard Cut to your needs" [ref=e86]:
          - img "Fabric by the Yard" [ref=e88]
          - generic [ref=e90]:
            - generic [ref=e91]:
              - img [ref=e92]
              - heading "Fabric by the Yard" [level=3] [ref=e97]
            - paragraph [ref=e98]: Cut to your needs
        - button "Quilting Notions Quilting Notions Tools & supplies" [ref=e99]:
          - img "Quilting Notions" [ref=e101]
          - generic [ref=e103]:
            - generic [ref=e104]:
              - img [ref=e105]
              - heading "Quilting Notions" [level=3] [ref=e110]
            - paragraph [ref=e111]: Tools & supplies
        - button "Batting & Backing Batting & Backing Foundation fabrics" [ref=e112]:
          - img "Batting & Backing" [ref=e114]
          - generic [ref=e116]:
            - generic [ref=e117]:
              - img [ref=e118]
              - heading "Batting & Backing" [level=3] [ref=e124]
            - paragraph [ref=e125]: Foundation fabrics
        - button "Quilt Patterns Quilt Patterns Design inspiration" [ref=e126]:
          - img "Quilt Patterns" [ref=e128]
          - generic [ref=e130]:
            - generic [ref=e131]:
              - img [ref=e132]
              - heading "Quilt Patterns" [level=3] [ref=e138]
            - paragraph [ref=e139]: Design inspiration
        - button "Quilting Thread Quilting Thread Premium threads" [ref=e140]:
          - img "Quilting Thread" [ref=e142]
          - generic [ref=e144]:
            - generic [ref=e145]:
              - img [ref=e146]
              - heading "Quilting Thread" [level=3] [ref=e151]
            - paragraph [ref=e152]: Premium threads
    - generic [ref=e153]:
      - generic [ref=e155]:
        - generic [ref=e156]:
          - generic [ref=e157]: Search fabrics
          - img [ref=e158]
          - textbox "Search fabrics" [ref=e161]:
            - /placeholder: Search fabrics by name, manufacturer, or collection...
        - button "Filters" [ref=e162]:
          - img [ref=e163]
          - text: Filters
        - generic [ref=e164]: Sort fabrics
        - combobox "Sort fabrics" [ref=e165]:
          - option "Name A-Z" [selected]
          - 'option "Price: Low to High"'
          - 'option "Price: High to Low"'
          - option "Newest"
      - generic [ref=e167]:
        - img [ref=e168]
        - paragraph [ref=e172]: 0 fabrics found
    - generic [ref=e248]:
      - img [ref=e250]
      - heading "Join the QuiltCorgi Community" [level=2] [ref=e253]
      - paragraph [ref=e254]: Get notified about new fabrics, exclusive collections, and quilting inspiration delivered to your inbox.
      - generic [ref=e255]:
        - textbox "Email address for newsletter" [ref=e256]:
          - /placeholder: Your email address
        - button "Subscribe" [ref=e257]
  - generic "Notifications"
  - generic [ref=e262] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e263]:
      - img [ref=e264]
    - generic [ref=e267]:
      - button "Open issues overlay" [ref=e268]:
        - generic [ref=e269]:
          - generic [ref=e270]: "0"
          - generic [ref=e271]: "1"
        - generic [ref=e272]: Issue
      - button "Collapse issues badge" [ref=e273]:
        - img [ref=e274]
  - alert [ref=e276]
```

# Test source

```ts
  65  |     await expect(submitButton).toBeVisible();
  66  |   });
  67  | 
  68  |   test('focus management works', async ({ page }) => {
  69  |     await page.goto('/auth/signin');
  70  |     await page.keyboard.press('Tab');
  71  |     const activeElement = await page.evaluate(() => document.activeElement?.tagName);
  72  |     expect(['INPUT', 'BUTTON', 'A']).toContain(activeElement);
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
> 165 |     await expect(page.getByText(/fabric|shop|buy/i)).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
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