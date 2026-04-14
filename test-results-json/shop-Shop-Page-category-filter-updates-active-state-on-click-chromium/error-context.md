# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shop.spec.ts >> Shop Page >> category filter updates active state on click
- Location: tests/e2e/shop.spec.ts:26:7

# Error details

```
Error: expect(locator).toHaveCSS(expected) failed

Locator: getByRole('button', { name: /charm packs/i }).first()
Error: expected value must be a string or regular expression
Expected has type:  object
Expected has value: Any<String>

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - button "5\" Charm Packs 5\" Charm Packs Pre-cut 5\" squares" [active] [ref=e35]:
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
        - paragraph [ref=e172]: 0 fabrics found
        - generic [ref=e173]: 5" Charm Packs
    - generic [ref=e249]:
      - img [ref=e251]
      - heading "Join the QuiltCorgi Community" [level=2] [ref=e254]
      - paragraph [ref=e255]: Get notified about new fabrics, exclusive collections, and quilting inspiration delivered to your inbox.
      - generic [ref=e256]:
        - textbox "Email address for newsletter" [ref=e257]:
          - /placeholder: Your email address
        - button "Subscribe" [ref=e258]
  - generic "Notifications"
  - generic [ref=e263] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e264]:
      - img [ref=e265]
    - generic [ref=e268]:
      - button "Open issues overlay" [ref=e269]:
        - generic [ref=e270]:
          - generic [ref=e271]: "0"
          - generic [ref=e272]: "1"
        - generic [ref=e273]: Issue
      - button "Collapse issues badge" [ref=e274]:
        - img [ref=e275]
  - alert [ref=e277]
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
  13  |     await expect(metaDesc).toHaveAttribute('content', /premium quilting fabrics/i);
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
> 31  |     await expect(charmPackBtn).toHaveCSS('border-color', expect.any(String));
      |                                ^ Error: expect(locator).toHaveCSS(expected) failed
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
  114 | 
```