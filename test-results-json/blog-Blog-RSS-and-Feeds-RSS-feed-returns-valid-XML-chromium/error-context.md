# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> Blog RSS and Feeds >> RSS feed returns valid XML
- Location: tests/e2e/blog.spec.ts:236:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "xml"
Received string:    "text/html; charset=utf-8"
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
  169 |       .getByRole('button')
  170 |       .filter({ hasText: /announcement|tutorial|news|update/i });
  171 |     const count = await categoryButtons.count();
  172 |     expect(count).toBeGreaterThanOrEqual(0);
  173 |   });
  174 | 
  175 |   test('pagination works on blog index', async ({ page }) => {
  176 |     await page.goto('/blog');
  177 | 
  178 |     // Look for pagination controls
  179 |     const pagination = page.getByRole('button', { name: /\d+|next|previous/i });
  180 |     const count = await pagination.count();
  181 |     expect(count).toBeGreaterThanOrEqual(0);
  182 |   });
  183 | 
  184 |   test('blog index shows post previews', async ({ page }) => {
  185 |     await page.goto('/blog');
  186 | 
  187 |     // Each post should have title, excerpt, date, author
  188 |     const posts = page.locator('[data-blog-post]');
  189 |     if ((await posts.count()) > 0) {
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
> 241 |     expect(contentType).toContain('xml');
      |                         ^ Error: expect(received).toContain(expected) // indexOf
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
  290 |     expect(title).toContain('QuiltCorgi');
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