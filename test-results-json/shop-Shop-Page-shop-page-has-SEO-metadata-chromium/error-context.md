# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Shop Page >> shop page has SEO metadata
- Location: tests/e2e/shop.spec.ts:10:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: locator('meta[name="description"]')
Expected pattern: /premium quilting fabrics/i
Received string:  "A modern, browser-based quilt design studio with a growing block library, fabric visualization, and 1:1 PDF pattern export. Free to start."
Timeout: 5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('meta[name="description"]')
    9 × locator resolved to <meta name="description" content="A modern, browser-based quilt design studio with a growing block library, fabric visualization, and 1:1 PDF pattern export. Free to start."/>
      - unexpected value "A modern, browser-based quilt design studio with a growing block library, fabric visualization, and 1:1 PDF pattern export. Free to start."

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Flowing fabric drapes" [ref=e6]
      - img "Fabric shop shelves" [ref=e9]
      - img "Fabric collection display" [ref=e12]
      - generic [ref=e15]:
        - heading "Fabric Shop" [level=1] [ref=e21]
        - paragraph [ref=e22]: Discover our curated collection of premium quilting fabrics, pre-cuts, and notions
        - generic [ref=e23]:
          - button "Browse Fabrics" [ref=e24]
          - button "Shop by Category" [ref=e25]
      - generic [ref=e26]:
        - button "Go to slide 1" [ref=e27]
        - button "Go to slide 2" [ref=e28]
        - button "Go to slide 3" [ref=e29]
    - generic [ref=e30]:
      - generic [ref=e31]:
        - heading "Shop by Category" [level=2] [ref=e32]
        - paragraph [ref=e33]: Find exactly what you need for your next project
      - generic [ref=e34]:
        - button "5\" Charm Packs 5\" Charm Packs Pre-cut 5\" squares" [ref=e35]:
          - img "5\" Charm Packs" [ref=e37]
          - generic [ref=e39]:
            - generic [ref=e40]:
              - img [ref=e41]
              - heading "5\" Charm Packs" [level=3] [ref=e54]
            - paragraph [ref=e55]: Pre-cut 5" squares
        - button "2.5\" Jelly Rolls 2.5\" Jelly Rolls Pre-cut strips" [ref=e56]:
          - img "2.5\" Jelly Rolls" [ref=e58]
          - generic [ref=e60]:
            - generic [ref=e61]:
              - img [ref=e62]
              - heading "2.5\" Jelly Rolls" [level=3] [ref=e70]
            - paragraph [ref=e71]: Pre-cut strips
        - button "10\" Layer Cakes 10\" Layer Cakes Pre-cut 10\" squares" [ref=e72]:
          - img "10\" Layer Cakes" [ref=e74]
          - generic [ref=e76]:
            - generic [ref=e77]:
              - img [ref=e78]
              - heading "10\" Layer Cakes" [level=3] [ref=e84]
            - paragraph [ref=e85]: Pre-cut 10" squares
        - button "Fabric by the Yard Fabric by the Yard Cut to your needs" [ref=e86]:
          - img "Fabric by the Yard" [ref=e88]
          - generic [ref=e90]:
            - generic [ref=e91]:
              - img [ref=e92]
              - heading "Fabric by the Yard" [level=3] [ref=e97]
            - paragraph [ref=e98]: Cut to your needs
        - button "Quilting Notions Quilting Notions Tools & supplies" [ref=e99]:
          - img "Quilting Notions" [ref=e101]
          - generic [ref=e103]:
            - generic [ref=e104]:
              - img [ref=e105]
              - heading "Quilting Notions" [level=3] [ref=e110]
            - paragraph [ref=e111]: Tools & supplies
        - button "Batting & Backing Batting & Backing Foundation fabrics" [ref=e112]:
          - img "Batting & Backing" [ref=e114]
          - generic [ref=e116]:
            - generic [ref=e117]:
              - img [ref=e118]
              - heading "Batting & Backing" [level=3] [ref=e124]
            - paragraph [ref=e125]: Foundation fabrics
        - button "Quilt Patterns Quilt Patterns Design inspiration" [ref=e126]:
          - img "Quilt Patterns" [ref=e128]
          - generic [ref=e130]:
            - generic [ref=e131]:
              - img [ref=e132]
              - heading "Quilt Patterns" [level=3] [ref=e138]
            - paragraph [ref=e139]: Design inspiration
        - button "Quilting Thread Quilting Thread Premium threads" [ref=e140]:
          - img "Quilting Thread" [ref=e142]
          - generic [ref=e144]:
            - generic [ref=e145]:
              - img [ref=e146]
              - heading "Quilting Thread" [level=3] [ref=e151]
            - paragraph [ref=e152]: Premium threads
    - generic [ref=e153]:
      - generic [ref=e155]:
        - generic [ref=e156]:
          - generic [ref=e157]: Search fabrics
          - img [ref=e158]
          - textbox "Search fabrics" [ref=e161]:
            - /placeholder: Search fabrics by name, manufacturer, or collection...
        - button "Filters" [ref=e162]:
          - img [ref=e163]
          - text: Filters
        - generic [ref=e164]: Sort fabrics
        - combobox "Sort fabrics" [ref=e165]:
          - option "Name A-Z" [selected]
          - 'option "Price: Low to High"'
          - 'option "Price: High to Low"'
          - option "Newest"
      - generic [ref=e167]:
        - img [ref=e168]
        - paragraph [ref=e172]: 30 fabrics found
      - generic [ref=e173]:
        - generic [ref=e177]:
          - heading "American Made Brand Cotton Solids - 190 - muslin" [level=3] [ref=e178]
          - paragraph [ref=e179]: Clothworks
          - generic [ref=e180]:
            - generic [ref=e181]: $752.00/yd
            - generic [ref=e182]: Yellow
          - button "Add to Cart" [ref=e183]
        - generic [ref=e187]:
          - heading "American Made Brand Cotton Solids - AMB-118" [level=3] [ref=e188]
          - paragraph [ref=e189]: Clothworks
          - generic [ref=e190]:
            - generic [ref=e191]: $1061.00/yd
            - generic [ref=e192]: White
          - button "Add to Cart" [ref=e193]
        - generic [ref=e197]:
          - heading "American Made Brand Cotton Solids - AMB-119" [level=3] [ref=e198]
          - paragraph [ref=e199]: Clothworks
          - generic [ref=e200]:
            - generic [ref=e201]: $580.00/yd
            - generic [ref=e202]: Gray
          - button "Add to Cart" [ref=e203]
        - generic [ref=e207]:
          - heading "American Made Brand Cotton Solids - AMB-121" [level=3] [ref=e208]
          - paragraph [ref=e209]: Clothworks
          - generic [ref=e210]:
            - generic [ref=e211]: $989.00/yd
            - generic [ref=e212]: Pink
          - button "Add to Cart" [ref=e213]
        - generic [ref=e217]:
          - heading "American Made Brand Cotton Solids - AMB-122" [level=3] [ref=e218]
          - paragraph [ref=e219]: Clothworks
          - generic [ref=e220]:
            - generic [ref=e221]: $1089.00/yd
            - generic [ref=e222]: Pink
          - button "Add to Cart" [ref=e223]
        - generic [ref=e227]:
          - heading "American Made Brand Cotton Solids - AMB-124" [level=3] [ref=e228]
          - paragraph [ref=e229]: Clothworks
          - generic [ref=e230]:
            - generic [ref=e231]: $433.00/yd
            - generic [ref=e232]: Blue
          - button "Add to Cart" [ref=e233]
        - generic [ref=e237]:
          - heading "American Made Brand Cotton Solids - AMB-125" [level=3] [ref=e238]
          - paragraph [ref=e239]: Clothworks
          - generic [ref=e240]:
            - generic [ref=e241]: $430.00/yd
            - generic [ref=e242]: Blue
          - button "Add to Cart" [ref=e243]
        - generic [ref=e247]:
          - heading "American Made Brand Cotton Solids - AMB-126" [level=3] [ref=e248]
          - paragraph [ref=e249]: Clothworks
          - generic [ref=e250]:
            - generic [ref=e251]: $866.00/yd
            - generic [ref=e252]: Yellow
          - button "Add to Cart" [ref=e253]
        - generic [ref=e257]:
          - heading "American Made Brand Cotton Solids - AMB-127" [level=3] [ref=e258]
          - paragraph [ref=e259]: Clothworks
          - generic [ref=e260]:
            - generic [ref=e261]: $1008.00/yd
            - generic [ref=e262]: Green
          - button "Add to Cart" [ref=e263]
        - generic [ref=e267]:
          - heading "American Made Brand Cotton Solids - AMB-74" [level=3] [ref=e268]
          - paragraph [ref=e269]: Clothworks
          - generic [ref=e270]:
            - generic [ref=e271]: $801.00/yd
            - generic [ref=e272]: Pink
          - button "Add to Cart" [ref=e273]
        - generic [ref=e277]:
          - heading "American Made Brand Cotton Solids - AMB-77" [level=3] [ref=e278]
          - paragraph [ref=e279]: Clothworks
          - generic [ref=e280]:
            - generic [ref=e281]: $508.00/yd
            - generic [ref=e282]: Pink
          - button "Add to Cart" [ref=e283]
        - generic [ref=e287]:
          - heading "American Made Brand Cotton Solids - AMB-86" [level=3] [ref=e288]
          - paragraph [ref=e289]: Clothworks
          - generic [ref=e290]:
            - generic [ref=e291]: $564.00/yd
            - generic [ref=e292]: Blue
          - button "Add to Cart" [ref=e293]
        - generic [ref=e297]:
          - heading "American Made Brand Cotton Solids - Aqua - AMB-33" [level=3] [ref=e298]
          - paragraph [ref=e299]: Clothworks
          - generic [ref=e300]:
            - generic [ref=e301]: $901.00/yd
            - generic [ref=e302]: Blue
          - button "Add to Cart" [ref=e303]
        - generic [ref=e307]:
          - heading "American Made Brand Cotton Solids - Black - AMB-3" [level=3] [ref=e308]
          - paragraph [ref=e309]: Clothworks
          - generic [ref=e310]:
            - generic [ref=e311]: $800.00/yd
            - generic [ref=e312]: Black
          - button "Add to Cart" [ref=e313]
        - generic [ref=e317]:
          - heading "American Made Brand Cotton Solids - Blue - AMB-90" [level=3] [ref=e318]
          - paragraph [ref=e319]: Clothworks
          - generic [ref=e320]:
            - generic [ref=e321]: $524.00/yd
            - generic [ref=e322]: Blue
          - button "Add to Cart" [ref=e323]
        - generic [ref=e327]:
          - heading "American Made Brand Cotton Solids - Brick - AMB-51" [level=3] [ref=e328]
          - paragraph [ref=e329]: Clothworks
          - generic [ref=e330]:
            - generic [ref=e331]: $1139.00/yd
            - generic [ref=e332]: Pink
          - button "Add to Cart" [ref=e333]
        - generic [ref=e337]:
          - heading "American Made Brand Cotton Solids - Brown - AMB-15" [level=3] [ref=e338]
          - paragraph [ref=e339]: Clothworks
          - generic [ref=e340]:
            - generic [ref=e341]: $664.00/yd
            - generic [ref=e342]: Orange
          - button "Add to Cart" [ref=e343]
        - generic [ref=e347]:
          - heading "American Made Brand Cotton Solids - Coral - AMB-39" [level=3] [ref=e348]
          - paragraph [ref=e349]: Clothworks
          - generic [ref=e350]:
            - generic [ref=e351]: $426.00/yd
            - generic [ref=e352]: Red
          - button "Add to Cart" [ref=e353]
        - generic [ref=e357]:
          - heading "American Made Brand Cotton Solids - Cream - AMB-57" [level=3] [ref=e358]
          - paragraph [ref=e359]: Clothworks
          - generic [ref=e360]:
            - generic [ref=e361]: $929.00/yd
            - generic [ref=e362]: Yellow
          - button "Add to Cart" [ref=e363]
        - generic [ref=e367]:
          - heading "American Made Brand Cotton Solids - Dark Aqua - AMB-34" [level=3] [ref=e368]
          - paragraph [ref=e369]: Clothworks
          - generic [ref=e370]:
            - generic [ref=e371]: $1182.00/yd
            - generic [ref=e372]: Blue
          - button "Add to Cart" [ref=e373]
        - generic [ref=e377]:
          - heading "American Made Brand Cotton Solids - Dark Blue - AMB-30" [level=3] [ref=e378]
          - paragraph [ref=e379]: Clothworks
          - generic [ref=e380]:
            - generic [ref=e381]: $442.00/yd
            - generic [ref=e382]: Blue
          - button "Add to Cart" [ref=e383]
        - generic [ref=e387]:
          - heading "American Made Brand Cotton Solids - Dark Brick - AMB-52" [level=3] [ref=e388]
          - paragraph [ref=e389]: Clothworks
          - generic [ref=e390]:
            - generic [ref=e391]: $614.00/yd
            - generic [ref=e392]: Pink
          - button "Add to Cart" [ref=e393]
        - generic [ref=e397]:
          - heading "American Made Brand Cotton Solids - Dark Brown - AMB-16" [level=3] [ref=e398]
          - paragraph [ref=e399]: Clothworks
          - generic [ref=e400]:
            - generic [ref=e401]: $434.00/yd
            - generic [ref=e402]: Orange
          - button "Add to Cart" [ref=e403]
        - generic [ref=e407]:
          - heading "American Made Brand Cotton Solids - Dark Butter - AMB-60" [level=3] [ref=e408]
          - paragraph [ref=e409]: Clothworks
          - generic [ref=e410]:
            - generic [ref=e411]: $661.00/yd
            - generic [ref=e412]: Yellow
          - button "Add to Cart" [ref=e413]
      - generic [ref=e414]:
        - button "Previous" [disabled] [ref=e415]
        - generic [ref=e416]: Page 1 of 2
        - button "Next" [ref=e417]
    - generic [ref=e420]:
      - img [ref=e422]
      - heading "Join the QuiltCorgi Community" [level=2] [ref=e425]
      - paragraph [ref=e426]: Get notified about new fabrics, exclusive collections, and quilting inspiration delivered to your inbox.
      - generic [ref=e427]:
        - textbox "Email address for newsletter" [ref=e428]:
          - /placeholder: Your email address
        - button "Subscribe" [ref=e429]
  - generic "Notifications"
  - generic [ref=e434] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e435]:
      - img [ref=e436]
    - generic [ref=e439]:
      - button "Open issues overlay" [ref=e440]:
        - generic [ref=e441]:
          - generic [ref=e442]: "0"
          - generic [ref=e443]: "1"
        - generic [ref=e444]: Issue
      - button "Collapse issues badge" [ref=e445]:
        - img [ref=e446]
  - alert [ref=e448]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Shop Page', () => {
  4   |   test('shop page loads with hero section', async ({ page }) => {
  5   |     await page.goto('/shop');
  6   |     await expect(page.getByRole('heading', { level: 1, name: /fabric shop/i })).toBeVisible();
  7   |     await expect(page.getByText(/curated collection of premium quilting fabrics/i)).toBeVisible();
  8   |   });
  9   | 
  10  |   test('shop page has SEO metadata', async ({ page }) => {
  11  |     await page.goto('/shop');
  12  |     const metaDesc = page.locator('meta[name="description"]');
> 13  |     await expect(metaDesc).toHaveAttribute('content', /premium quilting fabrics/i);
      |                            ^ Error: expect(locator).toHaveAttribute(expected) failed
  14  |     const ogTitle = page.locator('meta[property="og:title"]');
  15  |     await expect(ogTitle).toHaveAttribute('content', /fabric shop/i);
  16  |   });
  17  | 
  18  |   test('categories section is visible', async ({ page }) => {
  19  |     await page.goto('/shop');
  20  |     await expect(page.getByRole('heading', { level: 2, name: /shop by category/i })).toBeVisible();
  21  |     await expect(page.getByText(/charm packs/i)).toBeVisible();
  22  |     await expect(page.getByText(/jelly rolls/i)).toBeVisible();
  23  |     await expect(page.getByText(/fabric by the yard/i)).toBeVisible();
  24  |   });
  25  | 
  26  |   test('category filter updates active state on click', async ({ page }) => {
  27  |     await page.goto('/shop');
  28  |     const charmPackBtn = page.getByRole('button', { name: /charm packs/i }).first();
  29  |     await charmPackBtn.click();
  30  |     // Active category should be visually highlighted (check for border color change)
  31  |     await expect(charmPackBtn).toHaveCSS('border-color', expect.any(String));
  32  |   });
  33  | 
  34  |   test('search input is accessible', async ({ page }) => {
  35  |     await page.goto('/shop');
  36  |     const searchInput = page.getByLabel('Search fabrics');
  37  |     await expect(searchInput).toBeVisible();
  38  |     await searchInput.fill('cotton');
  39  |     await expect(searchInput).toHaveValue('cotton');
  40  |   });
  41  | 
  42  |   test('filter panel toggles visibility', async ({ page }) => {
  43  |     await page.goto('/shop');
  44  |     const filterBtn = page.getByRole('button', { name: /filters/i });
  45  |     await expect(filterBtn).toBeVisible();
  46  |     await filterBtn.click();
  47  |     const filterPanel = page.locator('#filter-panel');
  48  |     await expect(filterPanel).toBeVisible();
  49  |     await filterBtn.click();
  50  |     await expect(filterPanel).not.toBeVisible();
  51  |   });
  52  | 
  53  |   test('sort dropdown is accessible', async ({ page }) => {
  54  |     await page.goto('/shop');
  55  |     const sortSelect = page.getByLabel('Sort fabrics');
  56  |     await expect(sortSelect).toBeVisible();
  57  |     await sortSelect.selectOption('price-asc');
  58  |     await expect(sortSelect).toHaveValue('price-asc');
  59  |   });
  60  | 
  61  |   test('newsletter form accepts email and shows success', async ({ page }) => {
  62  |     await page.goto('/shop');
  63  |     const emailInput = page.getByLabel('Email address for newsletter');
  64  |     await expect(emailInput).toBeVisible();
  65  |     await emailInput.fill('test@example.com');
  66  |     const subscribeBtn = page.getByRole('button', { name: /subscribe/i });
  67  |     await subscribeBtn.click();
  68  |     // Should show success message
  69  |     await expect(page.getByText(/thanks for subscribing/i)).toBeVisible();
  70  |   });
  71  | 
  72  |   test('newsletter form rejects invalid email', async ({ page }) => {
  73  |     await page.goto('/shop');
  74  |     const emailInput = page.getByLabel('Email address for newsletter');
  75  |     await emailInput.fill('not-an-email');
  76  |     const subscribeBtn = page.getByRole('button', { name: /subscribe/i });
  77  |     await subscribeBtn.click();
  78  |     await expect(page.getByText(/valid email/i)).toBeVisible();
  79  |   });
  80  | 
  81  |   test('shop page is keyboard accessible', async ({ page }) => {
  82  |     await page.goto('/shop');
  83  |     // Tab through focusable elements
  84  |     await page.keyboard.press('Tab');
  85  |     await page.keyboard.press('Tab');
  86  |     // Search input should receive focus eventually
  87  |     const searchInput = page.getByLabel('Search fabrics');
  88  |     await searchInput.focus();
  89  |     await expect(searchInput).toBeFocused();
  90  |   });
  91  | });
  92  | 
  93  | test.describe('Shop API', () => {
  94  |   test('fabrics endpoint returns success when shop enabled', async ({ request }) => {
  95  |     const response = await request.get('/api/shop/fabrics?page=1&limit=10');
  96  |     // Shop may or may not be enabled in test env — both responses are valid
  97  |     expect([200, 503]).toContain(response.status());
  98  |   });
  99  | 
  100 |   test('fabrics endpoint accepts category filter', async ({ request }) => {
  101 |     const response = await request.get('/api/shop/fabrics?category=charm-packs&page=1&limit=10');
  102 |     expect([200, 503]).toContain(response.status());
  103 |   });
  104 | 
  105 |   test('settings endpoint returns enabled status', async ({ request }) => {
  106 |     const response = await request.get('/api/shop/settings');
  107 |     expect(response.status()).toBe(200);
  108 |     const body = await response.json();
  109 |     expect(body).toHaveProperty('success', true);
  110 |     expect(body.data).toHaveProperty('enabled');
  111 |     expect(typeof body.data.enabled).toBe('boolean');
  112 |   });
  113 | });
```