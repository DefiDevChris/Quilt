# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Features (Admin Role) >> moderation queue loads
- Location: tests/e2e/admin.spec.ts:79:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/moderation|queue|approve/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/moderation|queue|approve/i)

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
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Admin Access', () => {
  5   |   test('admin page redirects non-admin users', async ({ page }) => {
  6   |     await mockAuth(page, 'free');
  7   |     await page.goto('/admin');
  8   |     await page.waitForURL(/signin|unauthorized|forbidden/);
  9   |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  10  |   });
  11  | 
  12  |   test('admin moderation page redirects non-admin users', async ({ page }) => {
  13  |     await mockAuth(page, 'free');
  14  |     await page.goto('/admin/moderation');
  15  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  16  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  17  |   });
  18  | 
  19  |   test('admin blog page redirects non-admin users', async ({ page }) => {
  20  |     await mockAuth(page, 'free');
  21  |     await page.goto('/admin/blog');
  22  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  23  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  24  |   });
  25  | 
  26  |   test('admin blocks page redirects non-admin users', async ({ page }) => {
  27  |     await mockAuth(page, 'free');
  28  |     await page.goto('/admin/blocks');
  29  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  30  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  31  |   });
  32  | 
  33  |   test('admin layouts page redirects non-admin users', async ({ page }) => {
  34  |     await mockAuth(page, 'free');
  35  |     await page.goto('/admin/layouts');
  36  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  37  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  38  |   });
  39  | 
  40  |   test('admin libraries page redirects non-admin users', async ({ page }) => {
  41  |     await mockAuth(page, 'free');
  42  |     await page.goto('/admin/libraries');
  43  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  44  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  45  |   });
  46  | 
  47  |   test('admin settings page redirects non-admin users', async ({ page }) => {
  48  |     await mockAuth(page, 'free');
  49  |     await page.goto('/admin/settings');
  50  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  51  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Admin Features (Admin Role)', () => {
  56  |   test.beforeEach(async ({ page }) => {
  57  |     await mockAuth(page, 'admin');
  58  |     await page.route('**/api/admin/**', async (route) => {
  59  |       await route.fulfill({
  60  |         status: 200,
  61  |         contentType: 'application/json',
  62  |         body: JSON.stringify({ success: true, data: [] }),
  63  |       });
  64  |     });
  65  |     await page.route('**/api/admin/blog/**', async (route) => {
  66  |       await route.fulfill({
  67  |         status: 200,
  68  |         contentType: 'application/json',
  69  |         body: JSON.stringify({ success: true, data: [] }),
  70  |       });
  71  |     });
  72  |   });
  73  | 
  74  |   test('admin dashboard loads', async ({ page }) => {
  75  |     await page.goto('/admin');
  76  |     await expect(page.getByText(/admin|dashboard/i)).toBeVisible();
  77  |   });
  78  | 
  79  |   test('moderation queue loads', async ({ page }) => {
  80  |     await page.goto('/admin');
> 81  |     await expect(page.getByText(/moderation|queue|approve/i)).toBeVisible();
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  82  |   });
  83  | 
  84  |   test('admin can approve posts', async ({ page }) => {
  85  |     await page.goto('/admin');
  86  |     const approveButton = page.getByRole('button', { name: /approve/i }).first();
  87  |     if (await approveButton.isVisible()) {
  88  |       await expect(approveButton).toBeVisible();
  89  |     }
  90  |   });
  91  | 
  92  |   test('admin can reject posts', async ({ page }) => {
  93  |     await page.goto('/admin');
  94  |     const rejectButton = page.getByRole('button', { name: /reject/i }).first();
  95  |     if (await rejectButton.isVisible()) {
  96  |       await expect(rejectButton).toBeVisible();
  97  |     }
  98  |   });
  99  | 
  100 |   test('admin can delete posts', async ({ page }) => {
  101 |     await page.goto('/admin');
  102 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  103 |     if (await deleteButton.isVisible()) {
  104 |       await expect(deleteButton).toBeVisible();
  105 |     }
  106 |   });
  107 | 
  108 |   test('admin can create blog posts', async ({ page }) => {
  109 |     await page.goto('/admin/blog');
  110 |     const createButton = page.getByRole('button', { name: /create post|new post|create/i });
  111 |     if (await createButton.isVisible()) {
  112 |       await expect(createButton).toBeVisible();
  113 |     }
  114 |   });
  115 | 
  116 |   test('admin can edit blog posts', async ({ page }) => {
  117 |     await page.goto('/admin/blog');
  118 |     const editButton = page.getByRole('button', { name: /edit/i }).first();
  119 |     if (await editButton.isVisible()) {
  120 |       await expect(editButton).toBeVisible();
  121 |     }
  122 |   });
  123 | 
  124 |   test('admin can delete blog posts', async ({ page }) => {
  125 |     await page.goto('/admin/blog');
  126 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  127 |     if (await deleteButton.isVisible()) {
  128 |       await expect(deleteButton).toBeVisible();
  129 |     }
  130 |   });
  131 | });
  132 | 
  133 | test.describe('Admin API Endpoints', () => {
  134 |   test('admin API requires authentication', async ({ request }) => {
  135 |     const response = await request.get('/api/admin/blocks');
  136 |     expect([401, 403]).toContain(response.status());
  137 |   });
  138 | 
  139 |   test('admin blog API requires authentication', async ({ request }) => {
  140 |     const response = await request.post('/api/admin/blog', {
  141 |       data: { title: 'Test', content: 'Test' }
  142 |     });
  143 |     expect([401, 403]).toContain(response.status());
  144 |   });
  145 | 
  146 |   test('admin orders API requires authentication', async ({ request }) => {
  147 |     const response = await request.get('/api/admin/orders');
  148 |     expect([401, 403]).toContain(response.status());
  149 |   });
  150 | 
  151 |   test('admin fabrics API requires authentication', async ({ request }) => {
  152 |     const response = await request.get('/api/admin/fabrics');
  153 |     expect([401, 403]).toContain(response.status());
  154 |   });
  155 | 
  156 |   test('admin layouts API requires authentication', async ({ request }) => {
  157 |     const response = await request.get('/api/admin/layouts');
  158 |     expect([401, 403]).toContain(response.status());
  159 |   });
  160 | 
  161 |   test('admin settings API requires authentication', async ({ request }) => {
  162 |     const response = await request.get('/api/admin/settings');
  163 |     expect([401, 403]).toContain(response.status());
  164 |   });
  165 | });
  166 | 
```