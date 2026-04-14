# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> Blog Section >> blog post has read time estimate
- Location: tests/e2e/blog.spec.ts:66:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/min read/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/min read/i)

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
        - link "Go to Dashboard" [ref=e12] [cursor=pointer]:
          - /url: /dashboard
  - main [ref=e13]:
    - generic [ref=e14]:
      - img "QuiltCorgi Mascot" [ref=e15]
      - heading "404" [level=1] [ref=e16]
      - heading "Page Not Found" [level=2] [ref=e17]
      - paragraph [ref=e18]: Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      - generic [ref=e19]:
        - link "Go to Dashboard" [ref=e20] [cursor=pointer]:
          - /url: /dashboard
        - link "Back to Home" [ref=e21] [cursor=pointer]:
          - /url: /
  - contentinfo [ref=e22]:
    - generic [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - img "QuiltCorgi Logo" [ref=e27]
            - generic [ref=e28]: QuiltCorgi
          - paragraph [ref=e29]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
        - generic [ref=e30]:
          - heading "Product" [level=4] [ref=e31]
          - list [ref=e32]:
            - listitem [ref=e33]:
              - link "Design Studio" [ref=e34] [cursor=pointer]:
                - /url: "#features"
            - listitem [ref=e35]:
              - link "Yardage Calculator" [ref=e36] [cursor=pointer]:
                - /url: "#features"
        - generic [ref=e37]:
          - heading "Resources" [level=4] [ref=e38]
          - list [ref=e39]:
            - listitem [ref=e40]:
              - link "Blog" [ref=e41] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e42]:
              - link "Help Center" [ref=e43] [cursor=pointer]:
                - /url: /help
        - generic [ref=e44]:
          - heading "Company" [level=4] [ref=e45]
          - list [ref=e46]:
            - listitem [ref=e47]:
              - link "About" [ref=e48] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e49]:
              - link "Contact" [ref=e50] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e51]:
              - link "Privacy Policy" [ref=e52] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e53]:
              - link "Terms of Service" [ref=e54] [cursor=pointer]:
                - /url: /terms
      - generic [ref=e55]:
        - paragraph [ref=e56]: © 2026 QuiltCorgi. All rights reserved.
        - generic [ref=e57]:
          - link "Privacy" [ref=e58] [cursor=pointer]:
            - /url: /privacy
          - link "Terms" [ref=e59] [cursor=pointer]:
            - /url: /terms
  - generic "Notifications"
  - generic [ref=e64] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e65]:
      - img [ref=e66]
    - generic [ref=e69]:
      - button "Open issues overlay" [ref=e70]:
        - generic [ref=e71]:
          - generic [ref=e72]: "0"
          - generic [ref=e73]: "1"
        - generic [ref=e74]: Issue
      - button "Collapse issues badge" [ref=e75]:
        - img [ref=e76]
  - alert [ref=e78]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { authenticatedTest, clearSession, waitForElement } from './utils';
  3   | 
  4   | test.describe('Blog Section', () => {
  5   |   test('blog index page loads with posts', async ({ page }) => {
  6   |     await page.goto('/blog');
  7   |     await expect(page.getByRole('heading', { name: 'Blog', exact: true }).first()).toBeVisible();
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
> 68  |     await expect(page.getByText(/min read/i)).toBeVisible();
      |                                               ^ Error: expect(locator).toBeVisible() failed
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
  108 |     expect(count).toBeGreaterThanOrEqual(0);
  109 |   });
  110 | 
  111 |   test('blog post images load correctly', async ({ page }) => {
  112 |     await page.goto('/blog/introducing-quiltcorgi');
  113 | 
  114 |     // Check for broken images
  115 |     const images = page.locator('img');
  116 |     const count = await images.count();
  117 | 
  118 |     for (let i = 0; i < count; i++) {
  119 |       const img = images.nth(i);
  120 |       const src = await img.getAttribute('src');
  121 |       if (src) {
  122 |         // Image should load without errors
  123 |         await expect(img).toBeVisible();
  124 |       }
  125 |     }
  126 |   });
  127 | 
  128 |   test('blog post has proper typography', async ({ page }) => {
  129 |     await page.goto('/blog/introducing-quiltcorgi');
  130 | 
  131 |     // Should have proper heading hierarchy
  132 |     await expect(page.locator('h1')).toHaveCount(1); // One main title
  133 |     const h2Count = await page.locator('h2').count();
  134 |     expect(h2Count).toBeGreaterThanOrEqual(0);
  135 |   });
  136 | 
  137 |   test('blog post has code blocks if applicable', async ({ page }) => {
  138 |     await page.goto('/blog/introducing-quiltcorgi');
  139 | 
  140 |     // Check for code blocks or pre elements
  141 |     const codeBlocks = page.locator('pre, code');
  142 |     const count = await codeBlocks.count();
  143 |     expect(count).toBeGreaterThanOrEqual(0);
  144 |   });
  145 | });
  146 | 
  147 | test.describe('Blog Navigation and Search', () => {
  148 |   test('blog index has search functionality', async ({ page }) => {
  149 |     await page.goto('/blog');
  150 | 
  151 |     // Look for search input
  152 |     const searchInput = page.getByPlaceholder(/search.*blog|find.*post/i);
  153 |     if (await searchInput.isVisible()) {
  154 |       await searchInput.fill('quilt');
  155 |       await page.waitForTimeout(500);
  156 | 
  157 |       // Should filter results
  158 |       const posts = page.getByRole('button').filter({ hasText: /QuiltCorgi Team/i });
  159 |       const count = await posts.count();
  160 |       expect(count).toBeGreaterThanOrEqual(0);
  161 |     }
  162 |   });
  163 | 
  164 |   test('blog index has category/tag filters', async ({ page }) => {
  165 |     await page.goto('/blog');
  166 | 
  167 |     // Look for category buttons or filters
  168 |     const categoryButtons = page
```