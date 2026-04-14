# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Protected Routes >> dashboard redirects to sign in when not authenticated
- Location: tests/e2e/landing.spec.ts:69:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - navigation "Main navigation" [ref=e5]:
      - link "QuiltCorgi Logo QuiltCorgi" [ref=e6] [cursor=pointer]:
        - /url: /dashboard
        - img "QuiltCorgi Logo" [ref=e7]
        - generic [ref=e8]: QuiltCorgi
      - generic [ref=e9]:
        - link "Dashboard" [ref=e10] [cursor=pointer]:
          - /url: /dashboard
        - link "Shop" [ref=e11] [cursor=pointer]:
          - /url: /shop
      - generic [ref=e13]:
        - link "Sign In" [ref=e14] [cursor=pointer]:
          - /url: /auth/signin
        - link "Start Designing" [ref=e15] [cursor=pointer]:
          - /url: /auth/signup
    - main [ref=e16]:
      - generic [ref=e19]:
        - generic [ref=e21]:
          - heading "Dashboard" [level=1] [ref=e22]
          - paragraph [ref=e23]: Good evening, there
        - generic [ref=e24]:
          - heading "Quick Actions" [level=2] [ref=e25]
          - generic [ref=e26]:
            - button "New Design Start a fresh project from scratch or a template" [ref=e27]:
              - generic [ref=e29]:
                - paragraph [ref=e30]: New Design
                - paragraph [ref=e31]: Start a fresh project from scratch or a template
            - link "Photo to Design Extract a pattern from a photo of a quilt" [ref=e32] [cursor=pointer]:
              - /url: /photo-to-design
              - generic [ref=e34]:
                - paragraph [ref=e35]: Photo to Design
                - paragraph [ref=e36]: Extract a pattern from a photo of a quilt
            - button "Continue Latest No projects yet" [disabled] [ref=e37]:
              - generic [ref=e39]:
                - paragraph [ref=e40]: Continue Latest
                - paragraph [ref=e41]: No projects yet
        - generic [ref=e42]:
          - heading "Navigate" [level=2] [ref=e43]
          - generic [ref=e44]:
            - link "Projects Manage your designs" [ref=e45] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e48]:
                - paragraph [ref=e49]: Projects
                - paragraph [ref=e50]: Manage your designs
            - link "Fabric Library Browse fabrics" [ref=e51] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e54]:
                - paragraph [ref=e55]: Fabric Library
                - paragraph [ref=e56]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e57]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - paragraph [ref=e61]: Mobile Uploads
                  - paragraph [ref=e62]: Process uploads
                - generic [ref=e63]: "0"
            - link "Settings Account preferences" [ref=e64] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e67]:
                - paragraph [ref=e68]: Settings
                - paragraph [ref=e69]: Account preferences
  - generic "Notifications"
  - generic [ref=e74] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e75]:
      - img [ref=e76]
    - generic [ref=e79]:
      - button "Open issues overlay" [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: "0"
          - generic [ref=e83]: "1"
        - generic [ref=e84]: Issue
      - button "Collapse issues badge" [ref=e85]:
        - img [ref=e86]
  - alert [ref=e88]
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
  58  |     await expect(page.getByLabel(/password/i)).toBeVisible();
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
> 71  |     await page.waitForURL(/signin/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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