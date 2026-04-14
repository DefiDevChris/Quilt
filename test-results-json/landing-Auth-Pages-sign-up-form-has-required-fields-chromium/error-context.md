# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Auth Pages >> sign up form has required fields
- Location: tests/e2e/landing.spec.ts:55:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/password/i)
Expected: visible
Error: strict mode violation: getByLabel(/password/i) resolved to 2 elements:
    1) <input value="" required="" id="password" minlength="8" type="password" autocomplete="new-password" placeholder="At least 8 characters" class="w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2.5 text-base text-default placeholder:text-dim outline-none transition-colors duration-150 pr-10"/> aka getByRole('textbox', { name: 'Password' })
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
        - heading "Create your account" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Name
          - textbox "Name" [ref=e17]:
            - /placeholder: Your name
        - generic [ref=e18]:
          - generic [ref=e19]: Email
          - textbox "Email" [ref=e20]:
            - /placeholder: you@example.com
        - generic [ref=e21]:
          - generic [ref=e23]: Password
          - generic [ref=e24]:
            - textbox "Password" [ref=e25]:
              - /placeholder: At least 8 characters
            - button "Show password" [ref=e26]:
              - img [ref=e27]
          - paragraph [ref=e30]: Must include uppercase, lowercase, and numbers
        - button "Create Account" [ref=e31]
      - paragraph [ref=e32]:
        - text: Already have an account?
        - link "Sign in" [ref=e33] [cursor=pointer]:
          - /url: /auth/signin
  - generic "Notifications"
  - generic [ref=e38] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e39]:
      - img [ref=e40]
    - generic [ref=e43]:
      - button "Open issues overlay" [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: "0"
          - generic [ref=e47]: "1"
        - generic [ref=e48]: Issue
      - button "Collapse issues badge" [ref=e49]:
        - img [ref=e50]
  - alert [ref=e52]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Landing Page', () => {
  4   |   test('renders hero section with CTA', async ({ page }) => {
  5   |     await page.goto('/');
  6   |     await expect(page.getByRole('heading', { level: 1 })).toContainText('First Stitch');
  7   |     await expect(page.getByRole('link', { name: /start designing free/i }).first()).toBeVisible();
  8   |   });
  9   | 
  10  |   test('renders feature highlights section', async ({ page }) => {
  11  |     await page.goto('/');
  12  |     await expect(page.getByText(/block library/i)).toBeVisible();
  13  |     await expect(page.getByText('True-scale PDF with seam allowances')).toBeVisible();
  14  |     await expect(page.getByText('Automatic yardage estimation')).toBeVisible();
  15  |   });
  16  | 
  17  |   test('nav links to auth pages', async ({ page }) => {
  18  |     await page.goto('/');
  19  |     const ctaLink = page.getByRole('link', { name: /start designing free/i }).first();
  20  |     await expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  21  |   });
  22  | 
  23  |   test('displays pricing tiers', async ({ page }) => {
  24  |     await page.goto('/');
  25  |     await expect(page.getByText(/free/i)).toBeVisible();
  26  |     await expect(page.getByText(/pro/i)).toBeVisible();
  27  |   });
  28  | 
  29  |   test('navigation menu works', async ({ page }) => {
  30  |     await page.goto('/');
  31  |     const blogLink = page.getByRole('link', { name: /blog/i });
  32  |     if (await blogLink.isVisible()) {
  33  |       await expect(blogLink).toHaveAttribute('href', '/blog');
  34  |     }
  35  |   });
  36  | });
  37  | 
  38  | test.describe('Auth Pages', () => {
  39  |   test('sign in page loads', async ({ page }) => {
  40  |     await page.goto('/auth/signin');
  41  |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  42  |   });
  43  | 
  44  |   test('sign up page loads', async ({ page }) => {
  45  |     await page.goto('/auth/signup');
  46  |     await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');
  47  |   });
  48  | 
  49  |   test('sign in form has required fields', async ({ page }) => {
  50  |     await page.goto('/auth/signin');
  51  |     await expect(page.getByLabel(/email/i)).toBeVisible();
  52  |     await expect(page.getByLabel(/password/i)).toBeVisible();
  53  |   });
  54  | 
  55  |   test('sign up form has required fields', async ({ page }) => {
  56  |     await page.goto('/auth/signup');
  57  |     await expect(page.getByLabel(/email/i)).toBeVisible();
> 58  |     await expect(page.getByLabel(/password/i)).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  59  |   });
  60  | 
  61  |   test('forgot password link exists', async ({ page }) => {
  62  |     await page.goto('/auth/signin');
  63  |     const forgotLink = page.getByRole('link', { name: /forgot password/i });
  64  |     await expect(forgotLink).toBeVisible();
  65  |   });
  66  | });
  67  | 
  68  | test.describe('Protected Routes', () => {
  69  |   test('dashboard redirects to sign in when not authenticated', async ({ page }) => {
  70  |     await page.goto('/dashboard');
  71  |     await page.waitForURL(/signin/);
  72  |     expect(page.url()).toContain('signin');
  73  |   });
  74  | 
  75  |   test('studio redirects to sign in when not authenticated', async ({ page }) => {
  76  |     await page.goto('/studio/some-project-id');
  77  |     await page.waitForURL(/signin/);
  78  |     expect(page.url()).toContain('signin');
  79  |   });
  80  | 
  81  |   test('projects page redirects to sign in when not authenticated', async ({ page }) => {
  82  |     await page.goto('/projects');
  83  |     await page.waitForURL(/signin/);
  84  |     expect(page.url()).toContain('signin');
  85  |   });
  86  | 
  87  |   test('settings page redirects to sign in when not authenticated', async ({ page }) => {
  88  |     await page.goto('/settings');
  89  |     await page.waitForURL(/signin/);
  90  |     expect(page.url()).toContain('signin');
  91  |   });
  92  | });
  93  | 
  94  | test.describe('SEO', () => {
  95  |   test('landing page has proper meta tags', async ({ page }) => {
  96  |     await page.goto('/');
  97  |     const title = await page.title();
  98  |     expect(title).toContain('QuiltCorgi');
  99  | 
  100 |     const metaDescription = page.locator('meta[name="description"]');
  101 |     await expect(metaDescription).toHaveAttribute('content', /quilt/i);
  102 |   });
  103 | 
  104 |   test('robots.txt is accessible', async ({ page }) => {
  105 |     const response = await page.goto('/robots.txt');
  106 |     expect(response?.status()).toBe(200);
  107 |     const body = await response?.text();
  108 |     expect(body).toContain('User-agent');
  109 |     expect(body).toContain('Disallow: /api/');
  110 |   });
  111 | 
  112 |   test('sitemap.xml is accessible', async ({ page }) => {
  113 |     const response = await page.goto('/sitemap.xml');
  114 |     expect(response?.status()).toBe(200);
  115 |     const body = await response?.text();
  116 |     expect(body).toContain('urlset');
  117 |   });
  118 | 
  119 |   test('manifest.json is accessible', async ({ page }) => {
  120 |     const response = await page.goto('/manifest.json');
  121 |     expect(response?.status()).toBe(200);
  122 |     const body = await response?.text();
  123 |     const manifest = JSON.parse(body ?? '{}');
  124 |     expect(manifest.name).toBe('QuiltCorgi');
  125 |     expect(manifest.theme_color).toBe('#D4883C');
  126 |   });
  127 | });
  128 | 
  129 | test.describe('Accessibility', () => {
  130 |   test('landing page has skip link', async ({ page }) => {
  131 |     await page.goto('/');
  132 |     const skipLink = page.getByText('Skip to main content');
  133 |     await expect(skipLink).toBeAttached();
  134 |   });
  135 | 
  136 |   test('landing page has proper heading hierarchy', async ({ page }) => {
  137 |     await page.goto('/');
  138 |     const h1 = page.getByRole('heading', { level: 1 });
  139 |     await expect(h1).toHaveCount(1);
  140 |   });
  141 | 
  142 |   test('images have alt text', async ({ page }) => {
  143 |     await page.goto('/');
  144 |     const images = page.locator('img');
  145 |     const count = await images.count();
  146 |     for (let i = 0; i < Math.min(count, 5); i++) {
  147 |       const img = images.nth(i);
  148 |       const alt = await img.getAttribute('alt');
  149 |       expect(alt).toBeTruthy();
  150 |     }
  151 |   });
  152 | });
  153 | 
```