# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> Blog Performance and SEO >> blog post pages have proper SEO meta tags
- Location: tests/e2e/blog.spec.ts:285:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "QuiltCorgi"
Received string:    "Post Not Found | Quilt Studio"
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
        - link "Sign In" [ref=e11] [cursor=pointer]:
          - /url: /auth/signin
        - link "Start Designing" [ref=e12] [cursor=pointer]:
          - /url: /auth/signup
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
  190 |       const firstPost = posts.first();
  191 | 
  192 |       // Should have title
  193 |       await expect(firstPost.locator('h2, h3')).toBeVisible();
  194 | 
  195 |       // Should have date or "time ago"
  196 |       const dateText = firstPost
  197 |         .locator('text')
  198 |         .filter({ hasText: /\d{1,2}\/\d{1,2}\/\d{4}|\d+.*ago|min read/i });
  199 |       await expect(dateText.first()).toBeVisible();
  200 |     }
  201 |   });
  202 | 
  203 |   test('blog breadcrumbs work', async ({ page }) => {
  204 |     await page.goto('/blog/introducing-quiltcorgi');
  205 | 
  206 |     // Look for breadcrumb navigation
  207 |     const breadcrumb = page.getByRole('link', { name: /blog|home/i });
  208 |     if (await breadcrumb.isVisible()) {
  209 |       await breadcrumb.first().click();
  210 |       await expect(page).toHaveURL('/blog');
  211 |     }
  212 |   });
  213 | 
  214 |   test('blog post reading progress indicator', async ({ page }) => {
  215 |     await page.goto('/blog/introducing-quiltcorgi');
  216 | 
  217 |     // Look for reading progress bar or indicator
  218 |     const progress = page.locator('[data-reading-progress], .reading-progress');
  219 |     if (await progress.isVisible()) {
  220 |       await expect(progress).toBeVisible();
  221 |     }
  222 |   });
  223 | });
  224 | 
  225 | test.describe('Blog RSS and Feeds', () => {
  226 |   test('RSS feed link is present', async ({ page }) => {
  227 |     await page.goto('/blog');
  228 | 
  229 |     // Look for RSS feed link
  230 |     const rssLink = page.getByRole('link', { name: /rss|feed/i });
  231 |     if (await rssLink.isVisible()) {
  232 |       await expect(rssLink).toHaveAttribute('href', /rss\.xml|feed/);
  233 |     }
  234 |   });
  235 | 
  236 |   test('RSS feed returns valid XML', async ({ page }) => {
  237 |     const response = await page.goto('/blog/rss.xml');
  238 |     expect(response?.status()).toBe(200);
  239 | 
  240 |     const contentType = response?.headers()['content-type'];
  241 |     expect(contentType).toContain('xml');
  242 | 
  243 |     const body = await response?.text();
  244 |     expect(body).toContain('<?xml');
  245 |     expect(body).toContain('<rss');
  246 |     expect(body).toContain('QuiltCorgi Blog');
  247 | 
  248 |     // Should have at least one item
  249 |     expect(body).toContain('<item>');
  250 |   });
  251 | 
  252 |   test('RSS feed has proper item structure', async ({ page }) => {
  253 |     const response = await page.goto('/blog/rss.xml');
  254 |     const body = await response?.text();
  255 | 
  256 |     // Each item should have title, link, description, pubDate
  257 |     expect(body).toContain('<title>');
  258 |     expect(body).toContain('<link>');
  259 |     expect(body).toContain('<description>');
  260 |     expect(body).toContain('<pubDate>');
  261 |   });
  262 | 
  263 |   test('RSS feed items have correct URLs', async ({ page }) => {
  264 |     const response = await page.goto('/blog/rss.xml');
  265 |     const body = await response?.text();
  266 | 
  267 |     // Links should be absolute URLs
  268 |     expect(body).toContain('https://');
  269 |     expect(body).toContain('/blog/');
  270 |   });
  271 | });
  272 | 
  273 | // Blog admin tests moved to blog-admin.spec.ts
  274 | 
  275 | test.describe('Blog Performance and SEO', () => {
  276 |   test('blog pages load within reasonable time', async ({ page }) => {
  277 |     const startTime = Date.now();
  278 |     await page.goto('/blog');
  279 |     const loadTime = Date.now() - startTime;
  280 | 
  281 |     // Should load within 3 seconds
  282 |     expect(loadTime).toBeLessThan(3000);
  283 |   });
  284 | 
  285 |   test('blog post pages have proper SEO meta tags', async ({ page }) => {
  286 |     await page.goto('/blog/introducing-quiltcorgi');
  287 | 
  288 |     // Check title tag
  289 |     const title = await page.title();
> 290 |     expect(title).toContain('QuiltCorgi');
      |                   ^ Error: expect(received).toContain(expected) // indexOf
  291 | 
  292 |     // Check meta description
  293 |     const metaDescription = page.locator('meta[name="description"]');
  294 |     const description = await metaDescription.getAttribute('content');
  295 |     expect(description?.length).toBeGreaterThan(50);
  296 | 
  297 |     // Check Open Graph tags
  298 |     const ogTitle = page.locator('meta[property="og:title"]');
  299 |     await expect(ogTitle).toHaveAttribute('content');
  300 | 
  301 |     const ogDescription = page.locator('meta[property="og:description"]');
  302 |     await expect(ogDescription).toHaveAttribute('content');
  303 |   });
  304 | 
  305 |   test('blog index has proper structured data', async ({ page }) => {
  306 |     await page.goto('/blog');
  307 | 
  308 |     // Should have JSON-LD structured data
  309 |     const structuredData = page.locator('script[type="application/ld+json"]');
  310 |     const count = await structuredData.count();
  311 |     expect(count).toBeGreaterThanOrEqual(0);
  312 | 
  313 |     if (count > 0) {
  314 |       const content = await structuredData.first().textContent();
  315 |       expect(content).toContain('Blog');
  316 |     }
  317 |   });
  318 | 
  319 |   test('blog images are optimized', async ({ page }) => {
  320 |     await page.goto('/blog/introducing-quiltcorgi');
  321 | 
  322 |     // Check image alt texts
  323 |     const images = page.locator('img');
  324 |     const count = await images.count();
  325 | 
  326 |     for (let i = 0; i < Math.min(count, 5); i++) {
  327 |       const img = images.nth(i);
  328 |       const alt = await img.getAttribute('alt');
  329 |       expect(alt?.length).toBeGreaterThan(0);
  330 |     }
  331 |   });
  332 | });
  333 | 
```