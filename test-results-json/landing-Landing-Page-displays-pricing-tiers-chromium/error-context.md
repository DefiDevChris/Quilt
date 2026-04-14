# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: landing.spec.ts >> Landing Page >> displays pricing tiers
- Location: tests/e2e/landing.spec.ts:23:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/free/i)
Expected: visible
Error: strict mode violation: getByText(/free/i) resolved to 4 elements:
    1) <a href="/auth/signup" class="px-8 py-4 text-[var(--color-text)] rounded-full font-bold text-lg text-center">Start Designing Free</a> aka getByRole('link', { name: 'Start Designing Free' }).first()
    2) <p class="text-[18px] leading-[28px] text-[var(--color-text-dim)] mb-16 max-w-2xl mx-auto">Each layout preset handles a different stage of y…</p> aka getByText('Each layout preset handles a')
    3) <p class="text-[18px] leading-[28px] font-medium text-[var(--color-text-dim)]">Choose from four layout modes &mdash; grid, sashi…</p> aka getByText('Choose from four layout modes')
    4) <a href="/auth/signup" class="px-8 py-4 bg-primary text-default rounded-full font-bold text-lg hover:bg-primary-dark transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)] inline-block">Start Designing Free</a> aka getByRole('link', { name: 'Start Designing Free' }).nth(1)

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/free/i)

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
          - link "Sign In" [ref=e12] [cursor=pointer]:
            - /url: /auth/signin
          - link "Start Designing" [ref=e13] [cursor=pointer]:
            - /url: /auth/signup
    - main [ref=e14]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - heading "From First Stitch to Finished Quilt" [level=1] [ref=e25]:
            - text: From First Stitch
            - generic [ref=e26]: to Finished Quilt
          - paragraph [ref=e27]: Design your quilt, calculate your yardage, and export true-scale patterns with seam allowances built in. A growing block library, and a community of quilters who get it.
          - link "Start Designing Free" [ref=e29] [cursor=pointer]:
            - /url: /auth/signup
        - generic [ref=e30]:
          - img "QuiltCorgi Mascot" [ref=e31]
          - img "QuiltCorgi Mascot" [ref=e32]
          - generic [ref=e33]:
            - generic [ref=e34]:
              - generic [ref=e35]:
                - img [ref=e37]
                - generic [ref=e38]: QuiltCorgi
              - generic [ref=e39]:
                - generic [ref=e40]: Main
                - generic [ref=e41]: +
              - generic [ref=e42]: My Quilt Project·Quilt Canvas
              - generic [ref=e43]:
                - generic [ref=e44]: Share
                - generic [ref=e45]: View
                - generic [ref=e46]: Tools
                - generic [ref=e47]: Export
            - generic [ref=e48]:
              - generic [ref=e49]:
                - generic [ref=e50]:
                  - img [ref=e51]
                  - generic [ref=e53]: Select
                - generic [ref=e54]:
                  - img [ref=e55]
                  - generic [ref=e57]: Curved
                - generic [ref=e59]:
                  - img [ref=e60]
                  - generic [ref=e65]: Block Li...
                - generic [ref=e66]:
                  - img [ref=e67]
                  - generic [ref=e69]: Fabric Li...
                - generic [ref=e70]:
                  - img [ref=e71]
                  - generic [ref=e75]: Photo t...
                - generic [ref=e76]:
                  - img [ref=e77]
                  - generic [ref=e82]: Layout ...
                - generic [ref=e83]:
                  - img [ref=e84]
                  - generic [ref=e86]: Rectan...
                - generic [ref=e87]:
                  - img [ref=e88]
                  - generic [ref=e90]: Circle
                - generic [ref=e91]:
                  - img [ref=e92]
                  - generic [ref=e94]: Triangle
              - generic [ref=e97]:
                - img [ref=e99]
                - img [ref=e105]
                - img [ref=e111]
                - img [ref=e117]
                - img [ref=e123]
                - img [ref=e129]
                - img [ref=e135]
                - img [ref=e141]
                - img [ref=e147]
              - generic [ref=e152]:
                - button "SELECTION" [ref=e153]:
                  - generic [ref=e154]: SELECTION
                  - img [ref=e155]
                - button "PRECISION" [ref=e157]:
                  - generic [ref=e158]: PRECISION
                  - img [ref=e159]
                - button "ROTATE & SHEAR" [ref=e161]:
                  - generic [ref=e162]: ROTATE & SHEAR
                  - img [ref=e163]
                - button "COLOR THEME" [ref=e165]:
                  - generic [ref=e166]: COLOR THEME
                  - img [ref=e167]
                - button "TEXT" [ref=e169]:
                  - generic [ref=e170]: TEXT
                  - img [ref=e171]
                - button "BLOCK BUILDER" [ref=e173]:
                  - generic [ref=e174]: BLOCK BUILDER
                  - img [ref=e175]
              - generic [ref=e177]:
                - img [ref=e179]
                - img [ref=e182]
                - img [ref=e185]
                - img [ref=e188]
                - img [ref=e191]
                - generic [ref=e194]: 48%
            - generic [ref=e195]:
              - generic [ref=e196]: "Mouse H: 12.50\" V: 8.25\""
              - generic [ref=e197]:
                - generic [ref=e198]: "Snap to Grid: ON"
                - generic [ref=e199]: "Snap to Nodes: OFF"
      - generic [ref=e201]:
        - generic [ref=e202]:
          - img "QuiltCorgi Mascot" [ref=e203]
          - generic [ref=e204]:
            - heading "Your Quilt, Start to Finish" [level=2] [ref=e210]
            - paragraph [ref=e211]: Design, calculate, and print — all in one place
        - generic [ref=e212]:
          - generic [ref=e214]:
            - img "Quilt layout squares" [ref=e216]
            - heading "Your Design Studio" [level=3] [ref=e217]
            - paragraph [ref=e218]: One creative flow. Lay out your quilt, draft custom blocks with snap-to-grid precision, and choose from six layout presets including sashing and on-point.
            - list [ref=e219]:
              - listitem [ref=e220]:
                - img [ref=e222]
                - text: Single persistent canvas
              - listitem [ref=e224]:
                - img [ref=e226]
                - text: Growing block library
              - listitem [ref=e228]:
                - img [ref=e230]
                - text: 6 layout presets
          - generic [ref=e233]:
            - img "Measuring tape" [ref=e235]
            - heading "Yardage & Cutting Made Easy" [level=3] [ref=e236]
            - paragraph [ref=e237]: No more guesswork at the fabric counter. QuiltCorgi calculates your yardage, generates sub-cutting charts, and even calibrates imported fabric photos to real-world scale.
            - list [ref=e238]:
              - listitem [ref=e239]:
                - img [ref=e241]
                - text: Automatic yardage estimation
              - listitem [ref=e243]:
                - img [ref=e245]
                - text: Sub-cutting & rotary charts
              - listitem [ref=e247]:
                - img [ref=e249]
                - text: Real-world fabric calibration
          - generic [ref=e252]:
            - img "Quilting scissors" [ref=e254]
            - heading "Print-Ready Patterns" [level=3] [ref=e255]
            - paragraph [ref=e256]: Export true 1:1 scale PDFs with seam allowances baked right in. Generate cutting charts and rotary templates that go straight from your printer to your sewing room.
            - list [ref=e257]:
              - listitem [ref=e258]:
                - img [ref=e260]
                - text: True-scale PDF with seam allowances
              - listitem [ref=e262]:
                - img [ref=e264]
                - text: Cutting chart generation
              - listitem [ref=e266]:
                - img [ref=e268]
                - text: Rotary cutting charts
      - generic [ref=e271]:
        - generic [ref=e272]:
          - generic [ref=e273]:
            - img "QuiltCorgi Mascot" [ref=e274]
            - heading "Six Layout Presets. One Creative Flow." [level=2] [ref=e281]
          - paragraph [ref=e282]: Each layout preset handles a different stage of your quilting journey — from simple grids to sashing, on-point, strippy, medallion, and free-form arrangements.
        - generic [ref=e283]:
          - generic [ref=e284]:
            - button "Quilt Worktable" [ref=e285]
            - button "Block Worktable" [ref=e286]
            - button "Image Worktable" [ref=e287]
            - button "Print Worktable" [ref=e288]
          - generic [ref=e289]:
            - generic [ref=e292]:
              - generic [ref=e293]:
                - generic [ref=e294]:
                  - img [ref=e296]
                  - generic [ref=e297]: QuiltCorgi
                - generic [ref=e298]:
                  - generic [ref=e299]: Main
                  - generic [ref=e300]: +
                - generic [ref=e301]:
                  - text: My Quilt·
                  - generic [ref=e302]: Main Canvas
                - generic [ref=e303]:
                  - generic [ref=e304]: Share
                  - generic [ref=e305]: View
                  - generic [ref=e306]: Tools
                  - generic [ref=e307]: Export
              - generic [ref=e308]:
                - generic [ref=e309]:
                  - generic [ref=e310]:
                    - generic [ref=e311]: TOOLS
                    - generic [ref=e312]:
                      - generic [ref=e313]:
                        - img [ref=e314]
                        - generic [ref=e316]: Select
                      - generic [ref=e317]:
                        - img [ref=e318]
                        - generic [ref=e320]: Curved Ed...
                      - generic [ref=e321]:
                        - img [ref=e322]
                        - generic [ref=e327]: Pan
                      - generic [ref=e328]:
                        - img [ref=e329]
                        - generic [ref=e334]: Block Libra...
                      - generic [ref=e335]:
                        - img [ref=e336]
                        - generic [ref=e338]: Fabric Libr...
                      - generic [ref=e339]:
                        - img [ref=e340]
                        - generic [ref=e344]: Photo to P...
                      - generic [ref=e345]:
                        - img [ref=e346]
                        - generic [ref=e351]: Layout Set...
                  - generic [ref=e352]:
                    - generic [ref=e353]: PATTERN
                    - generic [ref=e354]:
                      - generic [ref=e355]:
                        - img [ref=e356]
                        - generic [ref=e359]: Blocks
                      - generic [ref=e360]:
                        - img [ref=e361]
                        - generic [ref=e364]: Borders
                      - generic [ref=e365]:
                        - img [ref=e366]
                        - generic [ref=e368]: Hedging
                      - generic [ref=e369]:
                        - img [ref=e370]
                        - generic [ref=e372]: Sashing
                      - generic [ref=e373]:
                        - img [ref=e374]
                        - generic [ref=e376]: Grid & Dim...
                - generic [ref=e377]:
                  - generic [ref=e380]:
                    - img [ref=e382]
                    - img [ref=e388]
                    - img [ref=e394]
                    - img [ref=e400]
                    - img [ref=e406]
                    - img [ref=e413]
                    - img [ref=e419]
                    - img [ref=e425]
                    - img [ref=e431]
                  - generic [ref=e436]:
                    - img [ref=e438]
                    - img [ref=e441]
                    - img [ref=e444]
                    - img [ref=e447]
                    - img [ref=e450]
                    - generic [ref=e454]: 48%
                - generic [ref=e455]:
                  - generic [ref=e457]:
                    - generic [ref=e458]: SELECTION
                    - img [ref=e459]
                  - generic [ref=e461]:
                    - generic [ref=e462]:
                      - generic [ref=e463]: PRECISION
                      - img [ref=e464]
                    - generic [ref=e466]:
                      - generic [ref=e467]: PRECISION
                      - generic [ref=e468]:
                        - generic [ref=e469]:
                          - generic [ref=e470]: BLOCK WIDTH
                          - generic [ref=e471]: 48.000 in
                        - generic [ref=e472]:
                          - generic [ref=e473]: BLOCK HEIGHT
                          - generic [ref=e474]: 48.000 in
                      - generic [ref=e475]:
                        - img [ref=e477]
                        - generic [ref=e479]: Snap to Grid
                  - generic [ref=e481]:
                    - generic [ref=e482]: ROTATE & SHEAR
                    - img [ref=e483]
                  - generic [ref=e486]:
                    - generic [ref=e487]: COLOR THEME
                    - img [ref=e488]
                  - generic [ref=e491]:
                    - generic [ref=e492]: TEXT
                    - img [ref=e493]
                  - generic [ref=e496]:
                    - generic [ref=e497]: BLOCK BUILDER
                    - img [ref=e498]
              - generic [ref=e500]:
                - generic [ref=e501]: "Mouse H: 12.50\" V: 8.25\""
                - generic [ref=e502]:
                  - generic [ref=e503]: "Snap to Grid: ON"
                  - generic [ref=e504]: "Snap to Nodes: OFF"
            - paragraph [ref=e506]: Choose from four layout modes &mdash; grid, sashing, on-point, or go completely free-form.
      - generic [ref=e509]:
        - generic [ref=e510]:
          - generic [ref=e511]:
            - img "QuiltCorgi Mascot" [ref=e512]
            - heading "Tools quilters actually need. Built by quilters who care." [level=2] [ref=e513]:
              - text: Tools quilters actually need.
              - text: Built by quilters who care.
          - paragraph [ref=e514]: Whether you're snapping a photo of a quilt and recreating it digitally, positioning fabric motifs with precision, or drafting custom blocks in the Block Builder — every tool is made to help you create something you'll be proud of.
          - list [ref=e515]:
            - listitem [ref=e516]:
              - img [ref=e518]
              - generic [ref=e520]: Yardage calculations and sub-cutting charts — done for you
            - listitem [ref=e521]:
              - img [ref=e523]
              - generic [ref=e525]: Per-patch fabric assignment with pattern previews
            - listitem [ref=e526]:
              - img [ref=e528]
              - generic [ref=e530]: True 1:1 scale PDF patterns with seam allowances
            - listitem [ref=e531]:
              - img [ref=e533]
              - generic [ref=e535]: Block Builder for drafting custom blocks by seam line
            - listitem [ref=e536]:
              - img [ref=e538]
              - generic [ref=e540]: "Photo-to-Design: extract quilt pieces from photos using OpenCV"
            - listitem [ref=e541]:
              - img [ref=e543]
              - generic [ref=e545]: Print-ready cutting charts and rotary templates
            - listitem [ref=e546]:
              - img [ref=e548]
              - generic [ref=e550]: Snap a photo of a quilt and recreate it digitally (Pro)
            - listitem [ref=e551]:
              - img [ref=e553]
              - generic [ref=e555]: Six layout presets on a single persistent canvas
          - link "See What You Can Create" [ref=e556] [cursor=pointer]:
            - /url: /auth/signup
        - generic [ref=e559]:
          - generic [ref=e560]:
            - generic [ref=e561]:
              - img [ref=e563]
              - generic [ref=e564]: QuiltCorgi
            - generic [ref=e565]:
              - generic [ref=e566]: Main
              - generic [ref=e567]: +
            - generic [ref=e568]: Ohio Star Throw·Quilt Canvas
            - generic [ref=e569]:
              - generic [ref=e570]: Share
              - generic [ref=e571]: View
              - generic [ref=e572]: Tools
              - generic [ref=e573]: Export
          - generic [ref=e574]:
            - generic [ref=e575]:
              - generic [ref=e576]:
                - img [ref=e577]
                - generic [ref=e579]: Select
              - generic [ref=e580]:
                - img [ref=e581]
                - generic [ref=e583]: Curved
              - generic [ref=e585]:
                - img [ref=e586]
                - generic [ref=e591]: Block Li...
              - generic [ref=e592]:
                - img [ref=e593]
                - generic [ref=e598]: Layout
              - generic [ref=e599]:
                - img [ref=e600]
                - generic [ref=e602]: Rectan...
              - generic [ref=e603]:
                - img [ref=e604]
                - generic [ref=e606]: Triangle
            - generic [ref=e646]:
              - img [ref=e648]
              - img [ref=e651]
              - img [ref=e654]
              - img [ref=e657]
              - generic [ref=e659]: 54%
            - generic [ref=e660]:
              - generic [ref=e661]:
                - generic [ref=e662]: SELECTION
                - img [ref=e663]
              - generic [ref=e665]:
                - generic [ref=e666]: PRECISION
                - img [ref=e667]
              - generic [ref=e669]:
                - generic [ref=e670]: ROTATE & SHEAR
                - img [ref=e671]
              - generic [ref=e673]:
                - generic [ref=e674]: COLOR THEME
                - img [ref=e675]
              - generic [ref=e677]:
                - generic [ref=e678]: BLOCK BUILDER
                - img [ref=e679]
          - generic [ref=e681]:
            - generic [ref=e682]: "Mouse H: 27.00\" V: 27.00\""
            - generic [ref=e684]: "Snap to Grid: ON"
      - generic [ref=e687]:
        - img
        - img "QuiltCorgi Mascot" [ref=e688]
        - img "QuiltCorgi Mascot" [ref=e689]
        - generic [ref=e690]:
          - heading "Ready to Start Your Next Quilting Adventure?" [level=2] [ref=e696]
          - paragraph [ref=e697]: Explore QuiltCorgi today and experience the joy of effortless, digital quilt design. No credit card, no commitment — just you and your next great quilt.
          - link "Start Designing Free" [ref=e698] [cursor=pointer]:
            - /url: /auth/signup
    - contentinfo [ref=e699]:
      - generic [ref=e700]:
        - generic [ref=e701]:
          - generic [ref=e702]:
            - generic [ref=e703]:
              - img "QuiltCorgi Logo" [ref=e704]
              - generic [ref=e705]: QuiltCorgi
            - paragraph [ref=e706]: Design your quilts, calculate your yardage, and print patterns ready for the sewing room. A growing block library, and a community of quilters who get it.
          - generic [ref=e707]:
            - heading "Product" [level=4] [ref=e708]
            - list [ref=e709]:
              - listitem [ref=e710]:
                - link "Design Studio" [ref=e711] [cursor=pointer]:
                  - /url: "#features"
              - listitem [ref=e712]:
                - link "Yardage Calculator" [ref=e713] [cursor=pointer]:
                  - /url: "#features"
          - generic [ref=e714]:
            - heading "Resources" [level=4] [ref=e715]
            - list [ref=e716]:
              - listitem [ref=e717]:
                - link "Blog" [ref=e718] [cursor=pointer]:
                  - /url: /blog
              - listitem [ref=e719]:
                - link "Help Center" [ref=e720] [cursor=pointer]:
                  - /url: /help
          - generic [ref=e721]:
            - heading "Company" [level=4] [ref=e722]
            - list [ref=e723]:
              - listitem [ref=e724]:
                - link "About" [ref=e725] [cursor=pointer]:
                  - /url: /about
              - listitem [ref=e726]:
                - link "Contact" [ref=e727] [cursor=pointer]:
                  - /url: /contact
              - listitem [ref=e728]:
                - link "Privacy Policy" [ref=e729] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e730]:
                - link "Terms of Service" [ref=e731] [cursor=pointer]:
                  - /url: /terms
        - generic [ref=e732]:
          - paragraph [ref=e733]: © 2026 QuiltCorgi. All rights reserved.
          - generic [ref=e734]:
            - link "Privacy" [ref=e735] [cursor=pointer]:
              - /url: /privacy
            - link "Terms" [ref=e736] [cursor=pointer]:
              - /url: /terms
  - generic "Notifications"
  - button "Open Next.js Dev Tools" [ref=e742] [cursor=pointer]:
    - img [ref=e743]
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
> 25  |     await expect(page.getByText(/free/i)).toBeVisible();
      |                                           ^ Error: expect(locator).toBeVisible() failed
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
```