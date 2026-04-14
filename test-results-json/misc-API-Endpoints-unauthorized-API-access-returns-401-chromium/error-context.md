# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: misc.spec.ts >> API Endpoints >> unauthorized API access returns 401
- Location: tests/e2e/misc.spec.ts:227:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 200
Received array: [401, 403, 307, 302]
```

# Test source

```ts
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
> 229 |     expect([401, 403, 307, 302]).toContain(response.status());
      |                                  ^ Error: expect(received).toContain(expected) // indexOf
  230 |   });
  231 | });
  232 | 
```