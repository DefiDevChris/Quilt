# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Access >> admin moderation page redirects non-admin users
- Location: tests/e2e/admin.spec.ts:12:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/admin/moderation"
============================================================
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
        - link "Sign In" [ref=e12] [cursor=pointer]:
          - /url: /auth/signin
        - link "Start Designing" [ref=e13] [cursor=pointer]:
          - /url: /auth/signup
  - main [ref=e14]:
    - generic [ref=e15]:
      - img "QuiltCorgi Mascot" [ref=e16]
      - heading "404" [level=1] [ref=e17]
      - heading "Page Not Found" [level=2] [ref=e18]
      - paragraph [ref=e19]: Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      - generic [ref=e20]:
        - link "Go to Dashboard" [ref=e21] [cursor=pointer]:
          - /url: /dashboard
        - link "Back to Home" [ref=e22] [cursor=pointer]:
          - /url: /
  - contentinfo [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - img "QuiltCorgi Logo" [ref=e28]
            - generic [ref=e29]: QuiltCorgi
          - paragraph [ref=e30]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
        - generic [ref=e31]:
          - heading "Product" [level=4] [ref=e32]
          - list [ref=e33]:
            - listitem [ref=e34]:
              - link "Design Studio" [ref=e35] [cursor=pointer]:
                - /url: "#features"
            - listitem [ref=e36]:
              - link "Yardage Calculator" [ref=e37] [cursor=pointer]:
                - /url: "#features"
        - generic [ref=e38]:
          - heading "Resources" [level=4] [ref=e39]
          - list [ref=e40]:
            - listitem [ref=e41]:
              - link "Blog" [ref=e42] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e43]:
              - link "Help Center" [ref=e44] [cursor=pointer]:
                - /url: /help
        - generic [ref=e45]:
          - heading "Company" [level=4] [ref=e46]
          - list [ref=e47]:
            - listitem [ref=e48]:
              - link "About" [ref=e49] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e50]:
              - link "Contact" [ref=e51] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e52]:
              - link "Privacy Policy" [ref=e53] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e54]:
              - link "Terms of Service" [ref=e55] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e56]:
        - paragraph [ref=e57]: © 2026 QuiltCorgi. All rights reserved.
        - generic [ref=e58]:
          - link "Privacy" [ref=e59] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e60] [cursor=pointer]:
            - /url: /terms
  - generic "Notifications"
  - generic [ref=e65] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e66]:
      - img [ref=e67]
    - generic [ref=e70]:
      - button "Open issues overlay" [ref=e71]:
        - generic [ref=e72]:
          - generic [ref=e73]: "0"
          - generic [ref=e74]: "1"
        - generic [ref=e75]: Issue
      - button "Collapse issues badge" [ref=e76]:
        - img [ref=e77]
  - alert [ref=e79]
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
> 15  |     await page.waitForURL(/signin|unauthorized|forbidden/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
  81  |     await expect(page.getByText(/moderation|queue|approve/i)).toBeVisible();
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
```