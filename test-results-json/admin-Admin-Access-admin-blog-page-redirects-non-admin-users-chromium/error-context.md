# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin Access >> admin blog page redirects non-admin users
- Location: tests/e2e/admin.spec.ts:19:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/admin/blog"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - link "Admin" [ref=e6] [cursor=pointer]:
        - /url: /admin
        - img [ref=e8]
        - generic [ref=e10]: Admin
      - navigation [ref=e11]:
        - link "Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /admin
          - img [ref=e13]
          - text: Dashboard
        - link "Blocks" [ref=e15] [cursor=pointer]:
          - /url: /admin/blocks
          - img [ref=e16]
          - text: Blocks
        - link "Layouts" [ref=e18] [cursor=pointer]:
          - /url: /admin/layouts
          - img [ref=e19]
          - text: Layouts
        - link "Blog" [ref=e21] [cursor=pointer]:
          - /url: /admin/blog
          - img [ref=e22]
          - text: Blog
        - link "Libraries" [ref=e24] [cursor=pointer]:
          - /url: /admin/libraries
          - img [ref=e25]
          - text: Libraries
        - link "Settings" [ref=e27] [cursor=pointer]:
          - /url: /admin/settings
          - img [ref=e28]
          - text: Settings
      - link "Back to Dashboard" [ref=e32] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e33]
        - text: Back to Dashboard
    - generic [ref=e35]:
      - banner [ref=e36]:
        - heading "Blog" [level=3] [ref=e38]
        - link "Exit Admin" [ref=e39] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e40]
          - text: Exit Admin
      - main [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - paragraph [ref=e45]: Manage your blog content
            - link "New Post" [ref=e46] [cursor=pointer]:
              - /url: /admin/blog/new
              - img [ref=e47]
              - text: New Post
          - table [ref=e50]:
            - rowgroup [ref=e51]:
              - row "Title Category Status Published Actions" [ref=e52]:
                - columnheader "Title" [ref=e53]
                - columnheader "Category" [ref=e54]
                - columnheader "Status" [ref=e55]
                - columnheader "Published" [ref=e56]
                - columnheader "Actions" [ref=e57]
            - rowgroup [ref=e58]:
              - row "No blog posts yet. Create your first post!" [ref=e59]:
                - cell "No blog posts yet. Create your first post!" [ref=e60]
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
  15  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  16  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  17  |   });
  18  | 
  19  |   test('admin blog page redirects non-admin users', async ({ page }) => {
  20  |     await mockAuth(page, 'free');
  21  |     await page.goto('/admin/blog');
> 22  |     await page.waitForURL(/signin|unauthorized|forbidden/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
  116 |   test('admin can edit blog posts', async ({ page }) => {
  117 |     await page.goto('/admin/blog');
  118 |     const editButton = page.getByRole('button', { name: /edit/i }).first();
  119 |     if (await editButton.isVisible()) {
  120 |       await expect(editButton).toBeVisible();
  121 |     }
  122 |   });
```