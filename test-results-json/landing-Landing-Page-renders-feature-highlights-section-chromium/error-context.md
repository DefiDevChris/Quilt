# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> renders feature highlights section
- Location: tests/e2e/landing.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/block library/i)
Expected: visible
Error: strict mode violation: getByText(/block library/i) resolved to 3 elements:
    1) <p class="text-[18px] leading-[28px] md:text-[20px] md:leading-[30px] text-[var(--color-text-dim)] max-w-xl leading-relaxed">Design your quilt, calculate your yardage, and ex…</p> aka getByText('Design your quilt, calculate')
    2) <li class="flex items-center gap-2">…</li> aka getByText('Growing block library', { exact: true })
    3) <p class="text-[var(--color-text-dim)] text-sm leading-relaxed max-w-xs">Design your quilts, calculate your yardage, and p…</p> aka getByText('Design your quilts, calculate')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/block library/i)

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
      - generic [ref=e18]:
        - generic [ref=e19]:
          - heading "From First Stitch to Finished Quilt" [level=1] [ref=e26]:
            - text: From First Stitch
            - generic [ref=e27]: to Finished Quilt
          - paragraph [ref=e28]: Design your quilt, calculate your yardage, and export true-scale patterns with seam allowances built in. A growing block library, and a community of quilters who get it.
          - link "Start Designing Free" [ref=e30] [cursor=pointer]:
            - /url: /auth/signup
        - generic [ref=e31]:
          - img "QuiltCorgi Mascot" [ref=e32]
          - img "QuiltCorgi Mascot" [ref=e33]
          - generic [ref=e34]:
            - generic [ref=e35]:
              - generic [ref=e36]:
                - img [ref=e38]
                - generic [ref=e39]: QuiltCorgi
              - generic [ref=e40]:
                - generic [ref=e41]: Main
                - generic [ref=e42]: +
              - generic [ref=e43]: My Quilt Project·Quilt Canvas
              - generic [ref=e44]:
                - generic [ref=e45]: Share
                - generic [ref=e46]: View
                - generic [ref=e47]: Tools
                - generic [ref=e48]: Export
            - generic [ref=e49]:
              - generic [ref=e50]:
                - generic [ref=e51]:
                  - img [ref=e52]
                  - generic [ref=e54]: Select
                - generic [ref=e55]:
                  - img [ref=e56]
                  - generic [ref=e58]: Curved
                - generic [ref=e60]:
                  - img [ref=e61]
                  - generic [ref=e66]: Block Li...
                - generic [ref=e67]:
                  - img [ref=e68]
                  - generic [ref=e70]: Fabric Li...
                - generic [ref=e71]:
                  - img [ref=e72]
                  - generic [ref=e76]: Photo t...
                - generic [ref=e77]:
                  - img [ref=e78]
                  - generic [ref=e83]: Layout ...
                - generic [ref=e84]:
                  - img [ref=e85]
                  - generic [ref=e87]: Rectan...
                - generic [ref=e88]:
                  - img [ref=e89]
                  - generic [ref=e91]: Circle
                - generic [ref=e92]:
                  - img [ref=e93]
                  - generic [ref=e95]: Triangle
              - generic [ref=e98]:
                - img [ref=e100]
                - img [ref=e106]
                - img [ref=e112]
                - img [ref=e118]
                - img [ref=e124]
                - img [ref=e130]
                - img [ref=e136]
                - img [ref=e142]
                - img [ref=e148]
              - generic [ref=e153]:
                - button "SELECTION" [ref=e154]:
                  - generic [ref=e155]: SELECTION
                  - img [ref=e156]
                - button "PRECISION" [ref=e158]:
                  - generic [ref=e159]: PRECISION
                  - img [ref=e160]
                - button "ROTATE & SHEAR" [ref=e162]:
                  - generic [ref=e163]: ROTATE & SHEAR
                  - img [ref=e164]
                - button "COLOR THEME" [ref=e166]:
                  - generic [ref=e167]: COLOR THEME
                  - img [ref=e168]
                - button "TEXT" [ref=e170]:
                  - generic [ref=e171]: TEXT
                  - img [ref=e172]
                - button "BLOCK BUILDER" [ref=e174]:
                  - generic [ref=e175]: BLOCK BUILDER
                  - img [ref=e176]
              - generic [ref=e178]:
                - img [ref=e180]
                - img [ref=e183]
                - img [ref=e186]
                - img [ref=e189]
                - img [ref=e192]
                - generic [ref=e195]: 48%
            - generic [ref=e196]:
              - generic [ref=e197]: "Mouse H: 12.50\" V: 8.25\""
              - generic [ref=e198]:
                - generic [ref=e199]: "Snap to Grid: ON"
                - generic [ref=e200]: "Snap to Nodes: OFF"
      - generic [ref=e202]:
        - generic [ref=e203]:
          - img "QuiltCorgi Mascot" [ref=e204]
          - generic [ref=e205]:
            - heading "Your Quilt, Start to Finish" [level=2] [ref=e211]
            - paragraph [ref=e212]: Design, calculate, and print — all in one place
        - generic [ref=e213]:
          - generic [ref=e215]:
            - img "Quilt layout squares" [ref=e217]
            - heading "Your Design Studio" [level=3] [ref=e218]
            - paragraph [ref=e219]: One creative flow. Lay out your quilt, draft custom blocks with snap-to-grid precision, and choose from six layout presets including sashing and on-point.
            - list [ref=e220]:
              - listitem [ref=e221]:
                - img [ref=e223]
                - text: Single persistent canvas
              - listitem [ref=e225]:
                - img [ref=e227]
                - text: Growing block library
              - listitem [ref=e229]:
                - img [ref=e231]
                - text: 6 layout presets
          - generic [ref=e234]:
            - img "Measuring tape" [ref=e236]
            - heading "Yardage & Cutting Made Easy" [level=3] [ref=e237]
            - paragraph [ref=e238]: No more guesswork at the fabric counter. QuiltCorgi calculates your yardage, generates sub-cutting charts, and even calibrates imported fabric photos to real-world scale.
            - list [ref=e239]:
              - listitem [ref=e240]:
                - img [ref=e242]
                - text: Automatic yardage estimation
              - listitem [ref=e244]:
                - img [ref=e246]
                - text: Sub-cutting & rotary charts
              - listitem [ref=e248]:
                - img [ref=e250]
                - text: Real-world fabric calibration
          - generic [ref=e253]:
            - img "Quilting scissors" [ref=e255]
            - heading "Print-Ready Patterns" [level=3] [ref=e256]
            - paragraph [ref=e257]: Export true 1:1 scale PDFs with seam allowances baked right in. Generate cutting charts and rotary templates that go straight from your printer to your sewing room.
            - list [ref=e258]:
              - listitem [ref=e259]:
                - img [ref=e261]
                - text: True-scale PDF with seam allowances
              - listitem [ref=e263]:
                - img [ref=e265]
                - text: Cutting chart generation
              - listitem [ref=e267]:
                - img [ref=e269]
                - text: Rotary cutting charts
      - generic [ref=e272]:
        - generic [ref=e273]:
          - generic [ref=e274]:
            - img "QuiltCorgi Mascot" [ref=e275]
            - heading "Six Layout Presets. One Creative Flow." [level=2] [ref=e282]
          - paragraph [ref=e283]: Each layout preset handles a different stage of your quilting journey — from simple grids to sashing, on-point, strippy, medallion, and free-form arrangements.
        - generic [ref=e284]:
          - generic [ref=e285]:
            - button "Quilt Worktable" [ref=e286]
            - button "Block Worktable" [ref=e287]
            - button "Image Worktable" [ref=e288]
            - button "Print Worktable" [ref=e289]
          - generic [ref=e290]:
            - generic [ref=e293]:
              - generic [ref=e294]:
                - generic [ref=e295]:
                  - img [ref=e297]
                  - generic [ref=e298]: QuiltCorgi
                - generic [ref=e299]:
                  - generic [ref=e300]: Main
                  - generic [ref=e301]: +
                - generic [ref=e302]:
                  - text: My Quilt·
                  - generic [ref=e303]: Main Canvas
                - generic [ref=e304]:
                  - generic [ref=e305]: Share
                  - generic [ref=e306]: View
                  - generic [ref=e307]: Tools
                  - generic [ref=e308]: Export
              - generic [ref=e309]:
                - generic [ref=e310]:
                  - generic [ref=e311]:
                    - generic [ref=e312]: TOOLS
                    - generic [ref=e313]:
                      - generic [ref=e314]:
                        - img [ref=e315]
                        - generic [ref=e317]: Select
                      - generic [ref=e318]:
                        - img [ref=e319]
                        - generic [ref=e321]: Curved Ed...
                      - generic [ref=e322]:
                        - img [ref=e323]
                        - generic [ref=e328]: Pan
                      - generic [ref=e329]:
                        - img [ref=e330]
                        - generic [ref=e335]: Block Libra...
                      - generic [ref=e336]:
                        - img [ref=e337]
                        - generic [ref=e339]: Fabric Libr...
                      - generic [ref=e340]:
                        - img [ref=e341]
                        - generic [ref=e345]: Photo to P...
                      - generic [ref=e346]:
                        - img [ref=e347]
                        - generic [ref=e352]: Layout Set...
                  - generic [ref=e353]:
                    - generic [ref=e354]: PATTERN
                    - generic [ref=e355]:
                      - generic [ref=e356]:
                        - img [ref=e357]
                        - generic [ref=e360]: Blocks
                      - generic [ref=e361]:
                        - img [ref=e362]
                        - generic [ref=e365]: Borders
                      - generic [ref=e366]:
                        - img [ref=e367]
                        - generic [ref=e369]: Hedging
                      - generic [ref=e370]:
                        - img [ref=e371]
                        - generic [ref=e373]: Sashing
                      - generic [ref=e374]:
                        - img [ref=e375]
                        - generic [ref=e377]: Grid & Dim...
                - generic [ref=e378]:
                  - generic [ref=e381]:
                    - img [ref=e383]
                    - img [ref=e389]
                    - img [ref=e395]
                    - img [ref=e401]
                    - img [ref=e407]
                    - img [ref=e414]
                    - img [ref=e420]
                    - img [ref=e426]
                    - img [ref=e432]
                  - generic [ref=e437]:
                    - img [ref=e439]
                    - img [ref=e442]
                    - img [ref=e445]
                    - img [ref=e448]
                    - img [ref=e451]
                    - generic [ref=e455]: 48%
                - generic [ref=e456]:
                  - generic [ref=e458]:
                    - generic [ref=e459]: SELECTION
                    - img [ref=e460]
                  - generic [ref=e462]:
                    - generic [ref=e463]:
                      - generic [ref=e464]: PRECISION
                      - img [ref=e465]
                    - generic [ref=e467]:
                      - generic [ref=e468]: PRECISION
                      - generic [ref=e469]:
                        - generic [ref=e470]:
                          - generic [ref=e471]: BLOCK WIDTH
                          - generic [ref=e472]: 48.000 in
                        - generic [ref=e473]:
                          - generic [ref=e474]: BLOCK HEIGHT
                          - generic [ref=e475]: 48.000 in
                      - generic [ref=e476]:
                        - img [ref=e478]
                        - generic [ref=e480]: Snap to Grid
                  - generic [ref=e482]:
                    - generic [ref=e483]: ROTATE & SHEAR
                    - img [ref=e484]
                  - generic [ref=e487]:
                    - generic [ref=e488]: COLOR THEME
                    - img [ref=e489]
                  - generic [ref=e492]:
                    - generic [ref=e493]: TEXT
                    - img [ref=e494]
                  - generic [ref=e497]:
                    - generic [ref=e498]: BLOCK BUILDER
                    - img [ref=e499]
              - generic [ref=e501]:
                - generic [ref=e502]: "Mouse H: 12.50\" V: 8.25\""
                - generic [ref=e503]:
                  - generic [ref=e504]: "Snap to Grid: ON"
                  - generic [ref=e505]: "Snap to Nodes: OFF"
            - paragraph [ref=e507]: Choose from four layout modes &mdash; grid, sashing, on-point, or go completely free-form.
      - generic [ref=e510]:
        - generic [ref=e511]:
          - generic [ref=e512]:
            - img "QuiltCorgi Mascot" [ref=e513]
            - heading "Tools quilters actually need. Built by quilters who care." [level=2] [ref=e514]:
              - text: Tools quilters actually need.
              - text: Built by quilters who care.
          - paragraph [ref=e515]: Whether you're snapping a photo of a quilt and recreating it digitally, positioning fabric motifs with precision, or drafting custom blocks in the Block Builder — every tool is made to help you create something you'll be proud of.
          - list [ref=e516]:
            - listitem [ref=e517]:
              - img [ref=e519]
              - generic [ref=e521]: Yardage calculations and sub-cutting charts — done for you
            - listitem [ref=e522]:
              - img [ref=e524]
              - generic [ref=e526]: Per-patch fabric assignment with pattern previews
            - listitem [ref=e527]:
              - img [ref=e529]
              - generic [ref=e531]: True 1:1 scale PDF patterns with seam allowances
            - listitem [ref=e532]:
              - img [ref=e534]
              - generic [ref=e536]: Block Builder for drafting custom blocks by seam line
            - listitem [ref=e537]:
              - img [ref=e539]
              - generic [ref=e541]: "Photo-to-Design: extract quilt pieces from photos using OpenCV"
            - listitem [ref=e542]:
              - img [ref=e544]
              - generic [ref=e546]: Print-ready cutting charts and rotary templates
            - listitem [ref=e547]:
              - img [ref=e549]
              - generic [ref=e551]: Snap a photo of a quilt and recreate it digitally (Pro)
            - listitem [ref=e552]:
              - img [ref=e554]
              - generic [ref=e556]: Six layout presets on a single persistent canvas
          - link "See What You Can Create" [ref=e557] [cursor=pointer]:
            - /url: /auth/signup
        - generic [ref=e560]:
          - generic [ref=e561]:
            - generic [ref=e562]:
              - img [ref=e564]
              - generic [ref=e565]: QuiltCorgi
            - generic [ref=e566]:
              - generic [ref=e567]: Main
              - generic [ref=e568]: +
            - generic [ref=e569]: Ohio Star Throw·Quilt Canvas
            - generic [ref=e570]:
              - generic [ref=e571]: Share
              - generic [ref=e572]: View
              - generic [ref=e573]: Tools
              - generic [ref=e574]: Export
          - generic [ref=e575]:
            - generic [ref=e576]:
              - generic [ref=e577]:
                - img [ref=e578]
                - generic [ref=e580]: Select
              - generic [ref=e581]:
                - img [ref=e582]
                - generic [ref=e584]: Curved
              - generic [ref=e586]:
                - img [ref=e587]
                - generic [ref=e592]: Block Li...
              - generic [ref=e593]:
                - img [ref=e594]
                - generic [ref=e599]: Layout
              - generic [ref=e600]:
                - img [ref=e601]
                - generic [ref=e603]: Rectan...
              - generic [ref=e604]:
                - img [ref=e605]
                - generic [ref=e607]: Triangle
            - generic [ref=e647]:
              - img [ref=e649]
              - img [ref=e652]
              - img [ref=e655]
              - img [ref=e658]
              - generic [ref=e660]: 54%
            - generic [ref=e661]:
              - generic [ref=e662]:
                - generic [ref=e663]: SELECTION
                - img [ref=e664]
              - generic [ref=e666]:
                - generic [ref=e667]: PRECISION
                - img [ref=e668]
              - generic [ref=e670]:
                - generic [ref=e671]: ROTATE & SHEAR
                - img [ref=e672]
              - generic [ref=e674]:
                - generic [ref=e675]: COLOR THEME
                - img [ref=e676]
              - generic [ref=e678]:
                - generic [ref=e679]: BLOCK BUILDER
                - img [ref=e680]
          - generic [ref=e682]:
            - generic [ref=e683]: "Mouse H: 27.00\" V: 27.00\""
            - generic [ref=e685]: "Snap to Grid: ON"
      - generic [ref=e688]:
        - img
        - img "QuiltCorgi Mascot" [ref=e689]
        - img "QuiltCorgi Mascot" [ref=e690]
        - generic [ref=e691]:
          - heading "Ready to Start Your Next Quilting Adventure?" [level=2] [ref=e697]
          - paragraph [ref=e698]: Explore QuiltCorgi today and experience the joy of effortless, digital quilt design. No credit card, no commitment — just you and your next great quilt.
          - link "Start Designing Free" [ref=e699] [cursor=pointer]:
            - /url: /auth/signup
    - contentinfo [ref=e700]:
      - generic [ref=e701]:
        - generic [ref=e702]:
          - generic [ref=e703]:
            - generic [ref=e704]:
              - img "QuiltCorgi Logo" [ref=e705]
              - generic [ref=e706]: QuiltCorgi
            - paragraph [ref=e707]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
          - generic [ref=e708]:
            - heading "Product" [level=4] [ref=e709]
            - list [ref=e710]:
              - listitem [ref=e711]:
                - link "Design Studio" [ref=e712] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e713]:
                - link "Yardage Calculator" [ref=e714] [cursor=pointer]:
                  - /url: "#features"
          - generic [ref=e715]:
            - heading "Resources" [level=4] [ref=e716]
            - list [ref=e717]:
              - listitem [ref=e718]:
                - link "Blog" [ref=e719] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e720]:
                - link "Help Center" [ref=e721] [cursor=pointer]:
                  - /url: /help
          - generic [ref=e722]:
            - heading "Company" [level=4] [ref=e723]
            - list [ref=e724]:
              - listitem [ref=e725]:
                - link "About" [ref=e726] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e727]:
                - link "Contact" [ref=e728] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e729]:
                - link "Privacy Policy" [ref=e730] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e731]:
                - link "Terms of Service" [ref=e732] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e733]:
          - paragraph [ref=e734]: © 2026 QuiltCorgi. All rights reserved.
          - generic [ref=e735]:
            - link "Privacy" [ref=e736] [cursor=pointer]:
              - /url: /privacy
            - link "Terms" [ref=e737] [cursor=pointer]:
              - /url: /terms
  - generic "Notifications"
  - generic [ref=e742] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e743]:
      - img [ref=e744]
    - generic [ref=e747]:
      - button "Open issues overlay" [ref=e748]:
        - generic [ref=e749]:
          - generic [ref=e750]: "0"
          - generic [ref=e751]: "1"
        - generic [ref=e752]: Issue
      - button "Collapse issues badge" [ref=e753]:
        - img [ref=e754]
  - alert [ref=e756]
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
> 12  |     await expect(page.getByText(/block library/i)).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
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
```