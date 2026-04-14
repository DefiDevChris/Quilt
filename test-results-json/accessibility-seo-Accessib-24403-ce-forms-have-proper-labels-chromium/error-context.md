# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility-seo.spec.ts >> Accessibility - WCAG Compliance >> forms have proper labels
- Location: tests/e2e/accessibility-seo.spec.ts:21:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/password/i)
Expected: visible
Error: strict mode violation: getByLabel(/password/i) resolved to 2 elements:
    1) <input value="" required="" id="password" minlength="8" type="password" placeholder="Your password" autocomplete="current-password" class="w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2.5 text-base text-default placeholder:text-dim outline-none transition-colors duration-150 pr-10"/> aka getByRole('textbox', { name: 'Password' })
    2) <button type="button" aria-label="Show password" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-default transition-colors duration-150">…</button> aka getByRole('button', { name: 'Show password' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel(/password/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e6]:
      - img "QuiltCorgi Mascot" [ref=e8]
      - generic [ref=e9]:
        - link "QuiltCorgi — Back to home" [ref=e10] [cursor=pointer]:
          - /url: /
          - img "QuiltCorgi — Back to home" [ref=e11]
        - generic [ref=e12]: QuiltCorgi
        - heading "Welcome back" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox "Email" [ref=e17]:
            - /placeholder: you@example.com
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Password
            - link "Forgot password?" [ref=e21] [cursor=pointer]:
              - /url: /auth/forgot-password
          - generic [ref=e22]:
            - textbox "Password" [ref=e23]:
              - /placeholder: Your password
            - button "Show password" [ref=e24]:
              - img [ref=e25]
        - button "Sign In" [ref=e28]
      - paragraph [ref=e29]:
        - text: Don't have an account?
        - link "Sign up" [ref=e30] [cursor=pointer]:
          - /url: /auth/signup
  - generic "Notifications"
  - generic [ref=e35] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e36]:
      - img [ref=e37]
    - generic [ref=e40]:
      - button "Open issues overlay" [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]: "0"
          - generic [ref=e44]: "1"
        - generic [ref=e45]: Issue
      - button "Collapse issues badge" [ref=e46]:
        - img [ref=e47]
  - alert [ref=e49]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth } from './utils';
  3   | 
  4   | test.describe('Accessibility - WCAG Compliance', () => {
  5   |   test('landing page has proper ARIA labels', async ({ page }) => {
  6   |     await page.goto('/');
  7   |     const nav = page.locator('nav');
  8   |     await expect(nav).toBeVisible();
  9   | 
  10  |     const main = page.locator('main');
  11  |     await expect(main).toBeVisible();
  12  |   });
  13  | 
  14  |   test('all interactive elements are keyboard accessible', async ({ page }) => {
  15  |     await page.goto('/');
  16  |     await page.keyboard.press('Tab');
  17  |     await page.keyboard.press('Tab');
  18  |     await page.keyboard.press('Enter');
  19  |   });
  20  | 
  21  |   test('forms have proper labels', async ({ page }) => {
  22  |     await page.goto('/auth/signin');
  23  |     await expect(page.getByLabel(/email/i)).toBeVisible();
> 24  |     await expect(page.getByLabel(/password/i)).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
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
  122 |     expect(count).toBeGreaterThan(0);
  123 |   });
  124 | 
```