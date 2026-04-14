# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Worktable Operations >> worktable tabs are visible
- Location: tests/e2e/authenticated.spec.ts:154:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/worktable/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/worktable/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - paragraph [ref=e6]: Failed to load project
    - link "Return to Dashboard" [ref=e7] [cursor=pointer]:
      - /url: /dashboard
  - generic "Notifications"
  - generic [ref=e12] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e13]:
      - img [ref=e14]
    - generic [ref=e17]:
      - button "Open issues overlay" [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: "0"
          - generic [ref=e21]: "1"
        - generic [ref=e22]: Issue
      - button "Collapse issues badge" [ref=e23]:
        - img [ref=e24]
  - alert [ref=e26]
```

# Test source

```ts
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
  117 |     await expect(modContent).toBeVisible({ timeout: 10000 });
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
> 156 |     await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
      |                                                ^ Error: expect(locator).toBeVisible() failed
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
  218 |   });
  219 | 
  220 |   test('monthly plan option is visible', async ({ page }) => {
  221 |     await page.goto('/profile');
  222 |     const monthly = page.getByText(/\$8.*month/i);
  223 |     if (await monthly.isVisible()) {
  224 |       await expect(monthly).toBeVisible();
  225 |     }
  226 |   });
  227 | 
  228 |   test('annual plan option is visible', async ({ page }) => {
  229 |     await page.goto('/profile');
  230 |     const annual = page.getByText(/\$60.*year/i);
  231 |     if (await annual.isVisible()) {
  232 |       await expect(annual).toBeVisible();
  233 |     }
  234 |   });
  235 | });
  236 | 
```