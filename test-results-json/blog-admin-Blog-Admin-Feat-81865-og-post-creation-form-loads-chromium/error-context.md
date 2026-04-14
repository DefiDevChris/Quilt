# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog-admin.spec.ts >> Blog Admin Features (Authenticated) >> blog post creation form loads
- Location: tests/e2e/blog-admin.spec.ts:13:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/title|content|blog/i)
Expected: visible
Error: strict mode violation: getByText(/title|content|blog/i) resolved to 3 elements:
    1) <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-default focus:text-primary focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-[0_1px_2px_rgba(26,26,26,0.08)] focus:border focus:border-primary">Skip to main content</a> aka getByRole('link', { name: 'Skip to main content' })
    2) <a href="/admin/blog" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 text-primary">…</a> aka getByRole('link', { name: 'Blog' })
    3) <h3 class="text-[var(--color-text-dim)] text-[14px] leading-[20px] font-semibold mb-3">Blog</h3> aka getByRole('heading', { name: 'Blog' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/title|content|blog/i)

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
            - generic [ref=e45]:
              - heading "Create New Post" [level=1] [ref=e46]
              - paragraph [ref=e47]: Create a new blog post
            - button "Cancel" [ref=e48]
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]: Title *
              - textbox "Title *" [ref=e52]:
                - /placeholder: Enter post title
            - generic [ref=e53]:
              - generic [ref=e54]: Excerpt
              - textbox "Excerpt" [ref=e55]:
                - /placeholder: Brief summary of the post
            - generic [ref=e56]:
              - generic [ref=e57]: Cover Image
              - generic [ref=e58]:
                - generic [ref=e60] [cursor=pointer]:
                  - img [ref=e61]
                  - paragraph [ref=e63]: Click to upload or enter URL
                - generic [ref=e64]: Cover Image URL
                - textbox "Cover Image URL" [ref=e65]:
                  - /placeholder: Or paste image URL...
            - generic [ref=e66]:
              - generic [ref=e67]:
                - generic [ref=e68]: Category
                - combobox "Category" [ref=e69]:
                  - option "Product Updates"
                  - option "Behind the Scenes"
                  - option "Tutorials" [selected]
                  - option "Community"
                  - option "Tips"
                  - option "Inspiration"
                  - option "History"
                  - option "Organization"
              - generic [ref=e70]:
                - generic [ref=e71]: Layout
                - combobox "Layout" [ref=e72]:
                  - option "Standard" [selected]
                  - option "Hero Cover"
                  - option "Staggered Media"
              - generic [ref=e73]:
                - generic [ref=e74]: Status
                - combobox "Status" [ref=e75]:
                  - option "Draft" [selected]
                  - option "Published"
                  - option "Archived"
            - generic [ref=e76]:
              - generic [ref=e77]: Tags (max 5)
              - generic [ref=e78]:
                - textbox "Tags (max 5)" [ref=e79]:
                  - /placeholder: Add a tag
                - button "Add" [disabled] [ref=e80]
            - generic [ref=e81]:
              - generic [ref=e82]: Content
              - generic [ref=e83]:
                - generic [ref=e84]:
                  - combobox [ref=e85]:
                    - option "Paragraph" [selected]
                    - option "Heading 1"
                    - option "Heading 2"
                    - option "Heading 3"
                    - option "Heading 4"
                    - option "Quote"
                    - option "Code"
                  - button "B" [ref=e87]
                  - button "I" [ref=e88]
                  - button "U" [ref=e89]
                  - button "S" [ref=e90]
                  - button "• List" [ref=e92]
                  - button "1. List" [ref=e93]
                  - button "🔗 Link" [ref=e95]
                  - button "🖼️ Image" [ref=e96]
                  - button "⬅️ Left" [ref=e98]
                  - button "↔️ Center" [ref=e99]
                  - button "➡️ Right" [ref=e100]
                  - button "⤡ Full" [ref=e101]
                  - button "↩️" [ref=e103]
                  - button "↪️" [ref=e104]
                - generic [ref=e105]:
                  - paragraph
            - generic [ref=e106]:
              - button "Save as Draft" [ref=e107]
              - button "Create Post" [ref=e108]
  - generic "Notifications"
  - generic [ref=e113] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e114]:
      - img [ref=e115]
    - generic [ref=e118]:
      - button "Open issues overlay" [ref=e119]:
        - generic [ref=e120]:
          - generic [ref=e121]: "0"
          - generic [ref=e122]: "1"
        - generic [ref=e123]: Issue
      - button "Collapse issues badge" [ref=e124]:
        - img [ref=e125]
  - alert [ref=e127]
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
  10 |     await page.waitForURL(/auth\/signin|unauthorized|forbidden/);
  11 |   });
  12 | 
  13 |   test('blog post creation form loads', async ({ page }) => {
  14 |     await mockAuth(page, 'admin');
  15 |     await page.goto('/admin/blog/new');
> 16 |     await expect(page.getByText(/title|content|blog/i)).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
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