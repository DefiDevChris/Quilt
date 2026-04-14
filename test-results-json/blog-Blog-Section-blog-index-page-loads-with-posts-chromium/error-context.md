# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> Blog Section >> blog index page loads with posts
- Location: tests/e2e/blog.spec.ts:5:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Blog', exact: true }).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Blog', exact: true }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - banner [ref=e4]:
      - navigation [ref=e5]:
        - link "QuiltCorgi Logo QuiltCorgi" [ref=e6] [cursor=pointer]:
          - /url: /
          - img "QuiltCorgi Logo" [ref=e7]
          - generic [ref=e8]: QuiltCorgi
        - generic [ref=e9]:
          - link "Features" [ref=e10] [cursor=pointer]:
            - /url: /#features
          - link "Blog" [ref=e11] [cursor=pointer]:
            - /url: /blog
          - link "Shop" [ref=e12] [cursor=pointer]:
            - /url: /shop
          - link "Go to Dashboard" [ref=e13] [cursor=pointer]:
            - /url: /dashboard
    - main [ref=e14]:
      - generic [ref=e16]:
        - img "QuiltCorgi Mascot" [ref=e17]
        - heading "No stories yet" [level=2] [ref=e18]
        - paragraph [ref=e19]: New content is being crafted. Return soon for fresh inspiration.
    - contentinfo [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]:
              - img "QuiltCorgi Logo" [ref=e25]
              - generic [ref=e26]: QuiltCorgi
            - paragraph [ref=e27]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
          - generic [ref=e28]:
            - heading "Product" [level=4] [ref=e29]
            - list [ref=e30]:
              - listitem [ref=e31]:
                - link "Design Studio" [ref=e32] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e33]:
                - link "Yardage Calculator" [ref=e34] [cursor=pointer]:
                  - /url: "#features"
          - generic [ref=e35]:
            - heading "Resources" [level=4] [ref=e36]
            - list [ref=e37]:
              - listitem [ref=e38]:
                - link "Blog" [ref=e39] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e40]:
                - link "Help Center" [ref=e41] [cursor=pointer]:
                  - /url: /help
          - generic [ref=e42]:
            - heading "Company" [level=4] [ref=e43]
            - list [ref=e44]:
              - listitem [ref=e45]:
                - link "About" [ref=e46] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e47]:
                - link "Contact" [ref=e48] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e49]:
                - link "Privacy Policy" [ref=e50] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e51]:
                - link "Terms of Service" [ref=e52] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e53]:
          - paragraph [ref=e54]: © 2026 QuiltCorgi. All rights reserved.
          - generic [ref=e55]:
            - link "Privacy" [ref=e56] [cursor=pointer]:
              - /url: /privacy
            - link "Terms" [ref=e57] [cursor=pointer]:
              - /url: /terms
  - generic "Notifications"
  - generic [ref=e62] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e63]:
      - img [ref=e64]
    - generic [ref=e67]:
      - button "Open issues overlay" [ref=e68]:
        - generic [ref=e69]:
          - generic [ref=e70]: "0"
          - generic [ref=e71]: "1"
        - generic [ref=e72]: Issue
      - button "Collapse issues badge" [ref=e73]:
        - img [ref=e74]
  - alert [ref=e76]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { authenticatedTest, clearSession, waitForElement } from './utils';
  3   | 
  4   | test.describe('Blog Section', () => {
  5   |   test('blog index page loads with posts', async ({ page }) => {
  6   |     await page.goto('/blog');
> 7   |     await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
      |                                                                                    ^ Error: expect(locator).toBeVisible() failed
  8   |     const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
  9   |     await expect(posts.first()).toBeVisible();
  10  |   });
  11  | 
  12  |   test('individual blog post renders', async ({ page }) => {
  13  |     await page.goto('/blog/introducing-quiltcorgi');
  14  |     await expect(page.getByRole('heading', { name: /Introducing QuiltCorgi/i })).toBeVisible();
  15  |     await expect(page.getByText(/QuiltCorgi Team/i).first()).toBeVisible();
  16  |   });
  17  | 
  18  |   test('blog post has Article schema', async ({ page }) => {
  19  |     await page.goto('/blog/introducing-quiltcorgi');
  20  |     const schemaScript = page.locator('script[type="application/ld+json"]');
  21  |     const content = await schemaScript.first().textContent();
  22  |     expect(content).toContain('Article');
  23  |   });
  24  | 
  25  |   test('blog post has proper meta tags', async ({ page }) => {
  26  |     await page.goto('/blog/introducing-quiltcorgi');
  27  |     const title = await page.title();
  28  |     expect(title).toContain('Introducing QuiltCorgi');
  29  |   });
  30  | 
  31  |   test('RSS feed returns valid XML', async ({ page }) => {
  32  |     const response = await page.goto('/blog/rss.xml');
  33  |     expect(response?.status()).toBe(200);
  34  | 
  35  |     const contentType = response?.headers()['content-type'];
  36  |     expect(contentType).toContain('xml');
  37  | 
  38  |     const body = await response?.text();
  39  |     expect(body).toContain('<?xml');
  40  |     expect(body).toContain('<rss');
  41  |     expect(body).toContain('QuiltCorgi Blog');
  42  |     expect(body).toContain('<item>');
  43  |   });
  44  | 
  45  |   test('tag filter works on blog index', async ({ page }) => {
  46  |     await page.goto('/blog');
  47  |     const tagButton = page.getByRole('button', { name: /announcement/i });
  48  |     if (await tagButton.isVisible()) {
  49  |       await tagButton.click();
  50  |       const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
  51  |       const count = await posts.count();
  52  |       expect(count).toBeGreaterThan(0);
  53  |     }
  54  |   });
  55  | 
  56  |   test('blog post navigation works', async ({ page }) => {
  57  |     await page.goto('/blog');
  58  |     const firstPost = page
  59  |       .getByRole('button')
  60  |       .filter({ hasText: /QuiltCorgi Team/i })
  61  |       .first();
  62  |     await firstPost.click();
  63  |     await expect(page).toHaveURL(/\/blog\/.+/);
  64  |   });
  65  | 
  66  |   test('blog post has read time estimate', async ({ page }) => {
  67  |     await page.goto('/blog/introducing-quiltcorgi');
  68  |     await expect(page.getByText(/min read/i)).toBeVisible();
  69  |   });
  70  | 
  71  |   test('blog post has author information', async ({ page }) => {
  72  |     await page.goto('/blog/introducing-quiltcorgi');
  73  |     await expect(page.getByText(/QuiltCorgi Team/i).first()).toBeVisible();
  74  |   });
  75  | 
  76  |   test('blog post has publish date', async ({ page }) => {
  77  |     await page.goto('/blog/introducing-quiltcorgi');
  78  |     const datePattern = /\d{4}/;
  79  |     await expect(page.locator('text=' + datePattern.source).first()).toBeVisible();
  80  |   });
  81  | 
  82  |   test('blog post has table of contents', async ({ page }) => {
  83  |     await page.goto('/blog/introducing-quiltcorgi');
  84  | 
  85  |     // Look for TOC or headings navigation
  86  |     const toc = page.getByText(/table of contents|contents|in this article/i);
  87  |     if (await toc.isVisible()) {
  88  |       await expect(toc).toBeVisible();
  89  |     }
  90  |   });
  91  | 
  92  |   test('blog post has related posts section', async ({ page }) => {
  93  |     await page.goto('/blog/introducing-quiltcorgi');
  94  | 
  95  |     // Look for related posts or "you might also like"
  96  |     const related = page.getByText(/related|you might|also like|similar/i);
  97  |     if (await related.isVisible()) {
  98  |       await expect(related).toBeVisible();
  99  |     }
  100 |   });
  101 | 
  102 |   test('blog post has share buttons', async ({ page }) => {
  103 |     await page.goto('/blog/introducing-quiltcorgi');
  104 | 
  105 |     // Look for social share buttons
  106 |     const shareButtons = page.getByRole('button', { name: /share|twitter|facebook|linkedin/i });
  107 |     const count = await shareButtons.count();
```