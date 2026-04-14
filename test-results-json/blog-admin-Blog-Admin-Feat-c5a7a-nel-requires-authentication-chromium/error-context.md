# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog-admin.spec.ts >> Blog Admin Features (Authenticated) >> blog admin panel requires authentication
- Location: tests/e2e/blog-admin.spec.ts:7:7

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
  1  | import { test, expect } from '@playwright/test';
  2  | import { mockAuth } from './utils';
  3  | 
  4  | // ... existing blog tests before line 274 remain unchanged ...
  5  | 
  6  | test.describe('Blog Admin Features (Authenticated)', () => {
  7  |   test('blog admin panel requires authentication', async ({ page }) => {
  8  |     await mockAuth(page, 'free');
  9  |     await page.goto('/admin/blog');
> 10 |     await page.waitForURL(/auth\/signin|unauthorized|forbidden/);
     |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
  11 |   });
  12 | 
  13 |   test('blog post creation form loads', async ({ page }) => {
  14 |     await mockAuth(page, 'admin');
  15 |     await page.goto('/admin/blog/new');
  16 |     await expect(page.getByText(/title|content|blog/i)).toBeVisible();
  17 |   });
  18 | 
  19 |   test('blog post editor has formatting tools', async ({ page }) => {
  20 |     await mockAuth(page, 'admin');
  21 |     await page.goto('/admin/blog/new');
  22 |     await expect(
  23 |       page.getByRole('button', { name: /bold|italic|heading|link|format/i }).first()
  24 |     ).toBeVisible();
  25 |   });
  26 | 
  27 |   test('blog post preview works', async ({ page }) => {
  28 |     await mockAuth(page, 'admin');
  29 |     await page.goto('/admin/blog/new');
  30 |     const titleInput = page.getByLabel(/title/i);
  31 |     if (await titleInput.isVisible()) {
  32 |       await titleInput.fill('Test Blog Post');
  33 |     }
  34 |     const previewButton = page.getByRole('button', { name: /preview/i });
  35 |     if (await previewButton.isVisible()) {
  36 |       await previewButton.click();
  37 |       await expect(page.getByText(/Test Blog Post|preview/i)).toBeVisible();
  38 |     }
  39 |   });
  40 | 
  41 |   test('blog post publishing form is available', async ({ page }) => {
  42 |     await mockAuth(page, 'admin');
  43 |     await page.goto('/admin/blog/new');
  44 |     const titleInput = page.getByLabel(/title/i);
  45 |     if (await titleInput.isVisible()) {
  46 |       await titleInput.fill('Test Published Post');
  47 |     }
  48 |     const publishButton = page.getByRole('button', { name: /publish|save/i });
  49 |     if (await publishButton.isVisible()) {
  50 |       await expect(publishButton).toBeVisible();
  51 |     }
  52 |   });
  53 | });
  54 | 
  55 | test.describe('Blog Performance and SEO', () => {
  56 |   test('blog pages load within reasonable time', async ({ page }) => {
  57 |     const startTime = Date.now();
  58 |     await page.goto('/blog');
  59 |     const loadTime = Date.now() - startTime;
  60 |     expect(loadTime).toBeLessThan(5000);
  61 |   });
  62 | 
  63 |   test('blog post pages have proper SEO meta tags', async ({ page }) => {
  64 |     await page.goto('/blog');
  65 |     const title = await page.title();
  66 |     expect(title.length).toBeGreaterThan(0);
  67 |     const metaDescription = page.locator('meta[name="description"]');
  68 |     if ((await metaDescription.count()) > 0) {
  69 |       const description = await metaDescription.getAttribute('content');
  70 |       expect(description?.length).toBeGreaterThan(0);
  71 |     }
  72 |   });
  73 | 
  74 |   test('blog index has proper structured data', async ({ page }) => {
  75 |     await page.goto('/blog');
  76 |     const structuredData = page.locator('script[type="application/ld+json"]');
  77 |     const count = await structuredData.count();
  78 |     expect(count).toBeGreaterThanOrEqual(0);
  79 |   });
  80 | });
  81 | 
```