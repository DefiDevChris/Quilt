# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-seo.spec.ts >> SEO Optimization >> structured data is present
- Location: tests/e2e/accessibility-seo.spec.ts:118:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
  22  |     await page.goto('/auth/signin');
  23  |     await expect(page.getByLabel(/email/i)).toBeVisible();
  24  |     await expect(page.getByLabel(/password/i)).toBeVisible();
  25  |   });
  26  | 
  27  |   test('buttons have accessible names', async ({ page }) => {
  28  |     await page.goto('/');
  29  |     const buttons = page.getByRole('button');
  30  |     const count = await buttons.count();
  31  |     for (let i = 0; i < Math.min(count, 5); i++) {
  32  |       const button = buttons.nth(i);
  33  |       const name = (await button.getAttribute('aria-label')) || (await button.textContent());
  34  |       expect(name).toBeTruthy();
  35  |     }
  36  |   });
  37  | 
  38  |   test('links have descriptive text', async ({ page }) => {
  39  |     await page.goto('/');
  40  |     const links = page.getByRole('link');
  41  |     const count = await links.count();
  42  |     for (let i = 0; i < Math.min(count, 5); i++) {
  43  |       const link = links.nth(i);
  44  |       const text = await link.textContent();
  45  |       expect(text?.trim().length).toBeGreaterThan(0);
  46  |     }
  47  |   });
  48  | 
  49  |   test('color contrast is sufficient', async ({ page }) => {
  50  |     await page.goto('/');
  51  |     const body = page.locator('body');
  52  |     const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
  53  |     expect(bgColor).toBeTruthy();
  54  |   });
  55  | 
  56  |   test('focus indicators are visible', async ({ page }) => {
  57  |     await page.goto('/');
  58  |     await page.keyboard.press('Tab');
  59  |     const focused = page.locator(':focus');
  60  |     await expect(focused).toBeVisible();
  61  |   });
  62  | });
  63  | 
  64  | test.describe('SEO Optimization', () => {
  65  |   test('all pages have unique titles', async ({ page }) => {
  66  |     const pages = ['/', '/blog', '/auth/signin'];
  67  |     const titles = new Set();
  68  | 
  69  |     for (const route of pages) {
  70  |       await page.goto(route);
  71  |       const title = await page.title();
  72  |       expect(title).toBeTruthy();
  73  |       titles.add(title);
  74  |     }
  75  | 
  76  |     expect(titles.size).toBe(pages.length);
  77  |   });
  78  | 
  79  |   test('meta descriptions are present', async ({ page }) => {
  80  |     await page.goto('/');
  81  |     const metaDesc = page.locator('meta[name="description"]');
  82  |     await expect(metaDesc).toHaveAttribute('content', /.+/);
  83  |   });
  84  | 
  85  |   test('Open Graph tags are present', async ({ page }) => {
  86  |     await page.goto('/');
  87  |     const ogTitle = page.locator('meta[property="og:title"]');
  88  |     const ogDesc = page.locator('meta[property="og:description"]');
  89  |     const ogImage = page.locator('meta[property="og:image"]');
  90  | 
  91  |     if ((await ogTitle.count()) > 0) {
  92  |       await expect(ogTitle).toHaveAttribute('content', /.+/);
  93  |     }
  94  |     if ((await ogDesc.count()) > 0) {
  95  |       await expect(ogDesc).toHaveAttribute('content', /.+/);
  96  |     }
  97  |     if ((await ogImage.count()) > 0) {
  98  |       await expect(ogImage).toHaveAttribute('content', /.+/);
  99  |     }
  100 |   });
  101 | 
  102 |   test('Twitter Card tags are present', async ({ page }) => {
  103 |     await page.goto('/');
  104 |     const twitterCard = page.locator('meta[name="twitter:card"]');
  105 |     if ((await twitterCard.count()) > 0) {
  106 |       await expect(twitterCard).toHaveAttribute('content', /.+/);
  107 |     }
  108 |   });
  109 | 
  110 |   test('canonical URLs are set', async ({ page }) => {
  111 |     await page.goto('/');
  112 |     const canonical = page.locator('link[rel="canonical"]');
  113 |     if ((await canonical.count()) > 0) {
  114 |       await expect(canonical).toHaveAttribute('href', /.+/);
  115 |     }
  116 |   });
  117 | 
  118 |   test('structured data is present', async ({ page }) => {
  119 |     await page.goto('/blog/introducing-quiltcorgi');
  120 |     const structuredData = page.locator('script[type="application/ld+json"]');
  121 |     const count = await structuredData.count();
> 122 |     expect(count).toBeGreaterThan(0);
      |                   ^ Error: expect(received).toBeGreaterThan(expected)
  123 |   });
  124 | 
  125 |   test('images have alt attributes', async ({ page }) => {
  126 |     await page.goto('/');
  127 |     const images = page.locator('img');
  128 |     const count = await images.count();
  129 | 
  130 |     for (let i = 0; i < Math.min(count, 10); i++) {
  131 |       const img = images.nth(i);
  132 |       const alt = await img.getAttribute('alt');
  133 |       expect(alt).not.toBeNull();
  134 |     }
  135 |   });
  136 | 
  137 |   test('headings follow hierarchy', async ({ page }) => {
  138 |     await page.goto('/');
  139 |     const h1 = page.getByRole('heading', { level: 1 });
  140 |     await expect(h1).toHaveCount(1);
  141 |   });
  142 | 
  143 |   test('language attribute is set', async ({ page }) => {
  144 |     await page.goto('/');
  145 |     const html = page.locator('html');
  146 |     await expect(html).toHaveAttribute('lang', 'en');
  147 |   });
  148 | });
  149 | 
  150 | test.describe('Performance Metrics', () => {
  151 |   test('no console errors on landing page', async ({ page }) => {
  152 |     const errors: string[] = [];
  153 |     page.on('console', (msg) => {
  154 |       if (msg.type() === 'error') {
  155 |         errors.push(msg.text());
  156 |       }
  157 |     });
  158 | 
  159 |     await page.goto('/');
  160 |     await page.waitForTimeout(2000);
  161 | 
  162 |     const criticalErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('404'));
  163 |     expect(criticalErrors.length).toBe(0);
  164 |   });
  165 | 
  166 |   test('no console errors on blog page', async ({ page }) => {
  167 |     const errors: string[] = [];
  168 |     page.on('console', (msg) => {
  169 |       if (msg.type() === 'error') {
  170 |         errors.push(msg.text());
  171 |       }
  172 |     });
  173 | 
  174 |     await page.goto('/blog');
  175 |     await page.waitForTimeout(2000);
  176 | 
  177 |     const criticalErrors = errors.filter((e) => !e.includes('favicon') && !e.includes('404'));
  178 |     expect(criticalErrors.length).toBe(0);
  179 |   });
  180 | 
  181 |   test('images are optimized', async ({ page }) => {
  182 |     await page.goto('/');
  183 |     const images = page.locator('img');
  184 |     const count = await images.count();
  185 | 
  186 |     for (let i = 0; i < Math.min(count, 5); i++) {
  187 |       const img = images.nth(i);
  188 |       const src = await img.getAttribute('src');
  189 |       expect(src).toBeTruthy();
  190 |     }
  191 |   });
  192 | });
  193 | 
  194 | test.describe('Mobile Accessibility', () => {
  195 |   test('touch targets are large enough', async ({ page, isMobile }) => {
  196 |     if (isMobile) {
  197 |       await page.goto('/');
  198 |       const buttons = page.getByRole('button');
  199 |       const count = await buttons.count();
  200 | 
  201 |       for (let i = 0; i < Math.min(count, 5); i++) {
  202 |         const button = buttons.nth(i);
  203 |         const box = await button.boundingBox();
  204 |         if (box) {
  205 |           expect(box.width).toBeGreaterThanOrEqual(44);
  206 |           expect(box.height).toBeGreaterThanOrEqual(44);
  207 |         }
  208 |       }
  209 |     }
  210 |   });
  211 | 
  212 |   test('viewport meta tag is set', async ({ page }) => {
  213 |     await page.goto('/');
  214 |     const viewport = page.locator('meta[name="viewport"]');
  215 |     await expect(viewport).toHaveAttribute('content', /width=device-width/);
  216 |   });
  217 | 
  218 |   test('text is readable on mobile', async ({ page, isMobile }) => {
  219 |     if (isMobile) {
  220 |       await page.goto('/');
  221 |       const body = page.locator('body');
  222 |       const fontSize = await body.evaluate((el) => window.getComputedStyle(el).fontSize);
```