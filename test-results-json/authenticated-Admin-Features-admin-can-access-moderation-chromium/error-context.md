# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Admin Features >> admin can access moderation
- Location: tests/e2e/authenticated.spec.ts:114:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/moderation|posts/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/moderation|posts/i)

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
  17  |     await expect(newDesignCard).toBeVisible({ timeout: 10000 });
  18  |   });
  19  | 
  20  |   test('photo to design card is visible', async ({ page }) => {
  21  |     await page.goto('/dashboard');
  22  |     const photoCard = page.getByText(/photo to design/i);
  23  |     if (await photoCard.isVisible()) {
  24  |       await expect(photoCard).toBeVisible();
  25  |     }
  26  |   });
  27  | });
  28  | 
  29  | test.describe('Authenticated Projects', () => {
  30  |   test.beforeEach(async ({ page }) => {
  31  |     await mockAuth(page, 'pro');
  32  |   });
  33  | 
  34  |   test('projects page loads with search', async ({ page }) => {
  35  |     await page.goto('/projects');
  36  |     const searchInput = page.getByPlaceholder(/search/i);
  37  |     await expect(searchInput).toBeVisible({ timeout: 10000 });
  38  |   });
  39  | 
  40  |   test('new project button exists', async ({ page }) => {
  41  |     await page.goto('/projects');
  42  |     const newButton = page.getByRole('button', { name: /new project/i });
  43  |     if (await newButton.isVisible()) {
  44  |       await expect(newButton).toBeVisible();
  45  |     }
  46  |   });
  47  | });
  48  | 
  49  | test.describe('Authenticated Settings', () => {
  50  |   test.beforeEach(async ({ page }) => {
  51  |     await mockAuth(page, 'pro');
  52  |   });
  53  | 
  54  |   test('settings page loads', async ({ page }) => {
  55  |     await page.goto('/settings');
  56  |     await expect(page.getByText(/profile|settings/i)).toBeVisible({ timeout: 10000 });
  57  |   });
  58  | 
  59  |   test('delete account section exists', async ({ page }) => {
  60  |     await page.goto('/settings');
  61  |     const deleteSection = page.getByText(/delete account/i);
  62  |     if (await deleteSection.isVisible()) {
  63  |       await expect(deleteSection).toBeVisible();
  64  |     }
  65  |   });
  66  | });
  67  | 
  68  | test.describe('Pro User Features', () => {
  69  |   test.beforeEach(async ({ page }) => {
  70  |     await mockAuth(page, 'pro');
  71  |     await mockCanvas(page);
  72  |   });
  73  | 
  74  |   test('pro user can access studio', async ({ page }) => {
  75  |     await page.goto('/studio/test-project-1');
  76  |     const canvas = page.locator('canvas');
  77  |     await expect(canvas).toBeVisible({ timeout: 10000 });
  78  |   });
  79  | 
  80  |   test('pro user sees billing section', async ({ page }) => {
  81  |     await page.goto('/profile');
  82  |     const billing = page.getByText(/billing|subscription/i);
  83  |     if (await billing.isVisible()) {
  84  |       await expect(billing).toBeVisible();
  85  |     }
  86  |   });
  87  | });
  88  | 
  89  | test.describe('Free User Limits', () => {
  90  |   test.beforeEach(async ({ page }) => {
  91  |     await mockAuth(page, 'free');
  92  |   });
  93  | 
  94  |   test('free user sees upgrade prompts', async ({ page }) => {
  95  |     await page.goto('/profile');
  96  |     const upgrade = page.getByText(/upgrade to pro/i);
  97  |     if (await upgrade.isVisible()) {
  98  |       await expect(upgrade).toBeVisible();
  99  |     }
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Admin Features', () => {
  104 |   test.beforeEach(async ({ page }) => {
  105 |     await mockAuth(page, 'admin');
  106 |   });
  107 | 
  108 |   test('admin can access admin page', async ({ page }) => {
  109 |     await page.goto('/admin');
  110 |     const adminContent = page.getByText(/admin|moderation/i);
  111 |     await expect(adminContent).toBeVisible({ timeout: 10000 });
  112 |   });
  113 | 
  114 |   test('admin can access moderation', async ({ page }) => {
  115 |     await page.goto('/admin/moderation');
  116 |     const modContent = page.getByText(/moderation|posts/i);
> 117 |     await expect(modContent).toBeVisible({ timeout: 10000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  118 |   });
  119 | });
  120 | 
  121 | test.describe('Canvas Operations', () => {
  122 |   test.beforeEach(async ({ page }) => {
  123 |     await mockAuth(page, 'pro');
  124 |     await mockCanvas(page);
  125 |   });
  126 | 
  127 |   test('canvas keyboard shortcuts work', async ({ page }) => {
  128 |     await page.goto('/studio/test-project-1');
  129 |     await page.waitForTimeout(2000);
  130 |     await page.keyboard.press('Control+Z');
  131 |     await page.keyboard.press('Control+Y');
  132 |     await page.keyboard.press('Control+A');
  133 |   });
  134 | 
  135 |   test('canvas zoom controls exist', async ({ page }) => {
  136 |     await page.goto('/studio/test-project-1');
  137 |     const zoomIn = page.getByRole('button', { name: /zoom in/i });
  138 |     const zoomOut = page.getByRole('button', { name: /zoom out/i });
  139 |     if (await zoomIn.isVisible()) {
  140 |       await expect(zoomIn).toBeVisible();
  141 |     }
  142 |     if (await zoomOut.isVisible()) {
  143 |       await expect(zoomOut).toBeVisible();
  144 |     }
  145 |   });
  146 | });
  147 | 
  148 | test.describe('Worktable Operations', () => {
  149 |   test.beforeEach(async ({ page }) => {
  150 |     await mockAuth(page, 'pro');
  151 |     await mockCanvas(page);
  152 |   });
  153 | 
  154 |   test('worktable tabs are visible', async ({ page }) => {
  155 |     await page.goto('/studio/test-project-1');
  156 |     await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
  157 |   });
  158 | 
  159 |   test('can switch between worktables', async ({ page }) => {
  160 |     await page.goto('/studio/test-project-1');
  161 |     const tab2 = page.getByRole('tab', { name: /worktable 2/i });
  162 |     if (await tab2.isVisible()) {
  163 |       await tab2.click();
  164 |     }
  165 |   });
  166 | });
  167 | 
  168 | test.describe('History and Save', () => {
  169 |   test.beforeEach(async ({ page }) => {
  170 |     await mockAuth(page, 'pro');
  171 |     await mockCanvas(page);
  172 |   });
  173 | 
  174 |   test('auto-save indicator shows', async ({ page }) => {
  175 |     await page.goto('/studio/test-project-1');
  176 |     const saved = page.getByText(/saved/i);
  177 |     if (await saved.isVisible({ timeout: 15000 })) {
  178 |       await expect(saved).toBeVisible();
  179 |     }
  180 |   });
  181 | 
  182 |   test('save keyboard shortcut works', async ({ page }) => {
  183 |     await page.goto('/studio/test-project-1');
  184 |     await page.waitForTimeout(2000);
  185 |     await page.keyboard.press('Control+S');
  186 |   });
  187 | });
  188 | 
  189 | test.describe('Photo to Design', () => {
  190 |   test.beforeEach(async ({ page }) => {
  191 |     await mockAuth(page, 'pro');
  192 |   });
  193 | 
  194 |   test('photo to design dialog opens', async ({ page }) => {
  195 |     await page.goto('/dashboard');
  196 |     const photoButton = page.getByText(/photo to design/i);
  197 |     if (await photoButton.isVisible()) {
  198 |       await photoButton.click();
  199 |       const upload = page.getByText(/upload/i);
  200 |       if (await upload.isVisible({ timeout: 5000 })) {
  201 |         await expect(upload).toBeVisible();
  202 |       }
  203 |     }
  204 |   });
  205 | });
  206 | 
  207 | test.describe('Billing and Subscriptions', () => {
  208 |   test.beforeEach(async ({ page }) => {
  209 |     await mockAuth(page, 'pro');
  210 |   });
  211 | 
  212 |   test('billing page loads for pro users', async ({ page }) => {
  213 |     await page.goto('/profile');
  214 |     const billing = page.getByText(/billing|subscription/i);
  215 |     if (await billing.isVisible()) {
  216 |       await expect(billing).toBeVisible();
  217 |     }
```