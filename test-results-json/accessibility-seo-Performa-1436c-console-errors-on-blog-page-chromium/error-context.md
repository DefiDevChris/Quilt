# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-seo.spec.ts >> Performance Metrics >> no console errors on blog page
- Location: tests/e2e/accessibility-seo.spec.ts:166:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 0
Received: 3
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
          - link "Sign In" [ref=e13] [cursor=pointer]:
            - /url: /auth/signin
          - link "Start Designing" [ref=e14] [cursor=pointer]:
            - /url: /auth/signup
    - main [ref=e15]:
      - generic [ref=e17]:
        - img "QuiltCorgi Mascot" [ref=e18]
        - heading "No stories yet" [level=2] [ref=e19]
        - paragraph [ref=e20]: New content is being crafted. Return soon for fresh inspiration.
    - contentinfo [ref=e21]:
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]:
              - img "QuiltCorgi Logo" [ref=e26]
              - generic [ref=e27]: QuiltCorgi
            - paragraph [ref=e28]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
          - generic [ref=e29]:
            - heading "Product" [level=4] [ref=e30]
            - list [ref=e31]:
              - listitem [ref=e32]:
                - link "Design Studio" [ref=e33] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e34]:
                - link "Yardage Calculator" [ref=e35] [cursor=pointer]:
                  - /url: "#features"
          - generic [ref=e36]:
            - heading "Resources" [level=4] [ref=e37]
            - list [ref=e38]:
              - listitem [ref=e39]:
                - link "Blog" [ref=e40] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e41]:
                - link "Help Center" [ref=e42] [cursor=pointer]:
                  - /url: /help
          - generic [ref=e43]:
            - heading "Company" [level=4] [ref=e44]
            - list [ref=e45]:
              - listitem [ref=e46]:
                - link "About" [ref=e47] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e48]:
                - link "Contact" [ref=e49] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e50]:
                - link "Privacy Policy" [ref=e51] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e52]:
                - link "Terms of Service" [ref=e53] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e54]:
          - paragraph [ref=e55]: © 2026 QuiltCorgi. All rights reserved.
          - generic [ref=e56]:
            - link "Privacy" [ref=e57] [cursor=pointer]:
              - /url: /privacy
            - link "Terms" [ref=e58] [cursor=pointer]:
              - /url: /terms
  - generic "Notifications"
  - generic [ref=e63] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e64]:
      - img [ref=e65]
    - generic [ref=e68]:
      - button "Open issues overlay" [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]: "0"
          - generic [ref=e72]: "1"
        - generic [ref=e73]: Issue
      - button "Collapse issues badge" [ref=e74]:
        - img [ref=e75]
  - alert [ref=e77]
```

# Test source

```ts
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
  122 |     expect(count).toBeGreaterThan(0);
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
> 178 |     expect(criticalErrors.length).toBe(0);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
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
  223 |       const size = parseInt(fontSize);
  224 |       expect(size).toBeGreaterThanOrEqual(14);
  225 |     }
  226 |   });
  227 | });
  228 | 
  229 | test.describe('Security Headers', () => {
  230 |   test('CSP headers are set', async ({ page }) => {
  231 |     const response = await page.goto('/');
  232 |     const headers = response?.headers();
  233 |     // CSP may be set via meta tag or header
  234 |     const csp = headers?.['content-security-policy'];
  235 |     if (csp) {
  236 |       expect(csp).toBeTruthy();
  237 |     }
  238 |   });
  239 | 
  240 |   test('X-Frame-Options is set', async ({ page }) => {
  241 |     const response = await page.goto('/');
  242 |     const headers = response?.headers();
  243 |     const xFrameOptions = headers?.['x-frame-options'];
  244 |     if (xFrameOptions) {
  245 |       expect(xFrameOptions).toBeTruthy();
  246 |     }
  247 |   });
  248 | });
  249 | 
  250 | test.describe('Internationalization', () => {
  251 |   test('dates are formatted correctly', async ({ page }) => {
  252 |     await page.goto('/blog/introducing-quiltcorgi');
  253 |     const datePattern = /\d{4}/;
  254 |     const dateElement = page.locator(`text=${datePattern.source}`).first();
  255 |     if (await dateElement.isVisible()) {
  256 |       await expect(dateElement).toBeVisible();
  257 |     }
  258 |   });
  259 | 
  260 |   test('numbers are formatted correctly', async ({ page }) => {
  261 |     await page.goto('/');
  262 |     const numberPattern = /\d+/;
  263 |     const numberElement = page.locator(`text=${numberPattern.source}`).first();
  264 |     if (await numberElement.isVisible()) {
  265 |       await expect(numberElement).toBeVisible();
  266 |     }
  267 |   });
  268 | });
  269 | 
```