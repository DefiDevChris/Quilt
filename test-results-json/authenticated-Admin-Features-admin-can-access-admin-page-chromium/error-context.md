# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Admin Features >> admin can access admin page
- Location: tests/e2e/authenticated.spec.ts:108:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/admin|moderation/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/admin|moderation/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [active]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - navigation [ref=e7]:
            - button "previous" [disabled] [ref=e8]:
              - img "previous" [ref=e9]
            - generic [ref=e11]:
              - generic [ref=e12]: 1/
              - text: "2"
            - button "next" [ref=e13] [cursor=pointer]:
              - img "next" [ref=e14]
          - img
        - generic [ref=e16]:
          - generic [ref=e17]:
            - img [ref=e18]
            - generic "Latest available version is detected (16.2.3)." [ref=e20]: Next.js 16.2.3
            - generic [ref=e21]: Turbopack
          - img
      - generic [ref=e22]:
        - dialog "Console Error" [ref=e23]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]:
                - generic [ref=e30]: Console Error
                - generic [ref=e31]:
                  - button "Copy Error Info" [ref=e32] [cursor=pointer]:
                    - img [ref=e33]
                  - button "No related documentation found" [disabled] [ref=e35]:
                    - img [ref=e36]
                  - button "Attach Node.js inspector" [ref=e38] [cursor=pointer]:
                    - img [ref=e39]
              - generic [ref=e48]: "eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment. React will never use eval() in production mode"
            - generic [ref=e51]:
              - paragraph [ref=e52]:
                - text: Call Stack
                - generic [ref=e53]: "24"
              - button "Show 24 ignore-listed frame(s)" [ref=e54] [cursor=pointer]:
                - text: Show 24 ignore-listed frame(s)
                - img [ref=e55]
          - generic [ref=e57]: "1"
          - generic [ref=e58]: "2"
        - contentinfo [ref=e59]:
          - region "Error feedback" [ref=e60]:
            - paragraph [ref=e61]:
              - link "Was this helpful?" [ref=e62] [cursor=pointer]:
                - /url: https://nextjs.org/telemetry#error-feedback
            - button "Mark as helpful" [ref=e63] [cursor=pointer]:
              - img [ref=e64]
            - button "Mark as not helpful" [ref=e67] [cursor=pointer]:
              - img [ref=e68]
    - generic [ref=e74] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e75]:
        - img [ref=e76]
      - generic [ref=e79]:
        - button "Open issues overlay" [ref=e80]:
          - generic [ref=e81]:
            - generic [ref=e82]: "1"
            - generic [ref=e83]: "2"
          - generic [ref=e84]:
            - text: Issue
            - generic [ref=e85]: s
        - button "Collapse issues badge" [ref=e86]:
          - img [ref=e87]
  - generic [ref=e89]:
    - heading "Something went wrong" [level=1] [ref=e90]
    - paragraph [ref=e91]: We're sorry, but something unexpected happened. Please try refreshing the page.
    - button "Try again" [ref=e92] [cursor=pointer]
```

# Test source

```ts
  11  |     await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
  12  |   });
  13  | 
  14  |   test('new design card is clickable', async ({ page }) => {
  15  |     await page.goto('/dashboard');
  16  |     const newDesignCard = page.getByText(/new design/i);
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
> 111 |     await expect(adminContent).toBeVisible({ timeout: 10000 });
      |                                ^ Error: expect(locator).toBeVisible() failed
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
```