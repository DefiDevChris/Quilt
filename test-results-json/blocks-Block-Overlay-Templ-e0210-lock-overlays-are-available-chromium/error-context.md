# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blocks.spec.ts >> Block Overlay Templates >> traditional block overlays are available
- Location: tests/e2e/blocks.spec.ts:161:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/nine patch|traditional|overlay/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/nine patch|traditional|overlay/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e5]:
    - paragraph [ref=e6]: Failed to load project
    - link "Return to Dashboard" [ref=e7] [cursor=pointer]:
      - /url: /dashboard
  - generic "Notifications"
  - generic [active]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - navigation [ref=e13]:
            - button "previous" [disabled] [ref=e14]:
              - img "previous" [ref=e15]
            - generic [ref=e17]:
              - generic [ref=e18]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e19]:
              - img "next" [ref=e20]
          - img
        - generic [ref=e22]:
          - generic [ref=e23]:
            - img [ref=e24]
            - generic "Latest available version is detected (16.2.3)." [ref=e26]: Next.js 16.2.3
            - generic [ref=e27]: Turbopack
          - img
      - generic [ref=e28]:
        - dialog "Console Error" [ref=e29]:
          - generic [ref=e32]:
            - generic [ref=e33]:
              - generic [ref=e34]:
                - generic [ref=e36]: Console Error
                - generic [ref=e37]:
                  - button "Copy Error Info" [ref=e38] [cursor=pointer]:
                    - img [ref=e39]
                  - button "No related documentation found" [disabled] [ref=e41]:
                    - img [ref=e42]
                  - button "Attach Node.js inspector" [ref=e44] [cursor=pointer]:
                    - img [ref=e45]
              - generic [ref=e54]: "eval() is not supported in this environment. If this page was served with a `Content-Security-Policy` header, make sure that `unsafe-eval` is included. React requires eval() in development mode for various debugging features like reconstructing callstacks from a different environment. React will never use eval() in production mode"
            - generic [ref=e57]:
              - paragraph [ref=e58]:
                - text: Call Stack
                - generic [ref=e59]: "24"
              - button "Show 24 ignore-listed frame(s)" [ref=e60] [cursor=pointer]:
                - text: Show 24 ignore-listed frame(s)
                - img [ref=e61]
          - generic [ref=e63]: "1"
          - generic [ref=e64]: "2"
        - contentinfo [ref=e65]:
          - region "Error feedback" [ref=e66]:
            - paragraph [ref=e67]:
              - link "Was this helpful?" [ref=e68] [cursor=pointer]:
                - /url: https://nextjs.org/telemetry#error-feedback
            - button "Mark as helpful" [ref=e69] [cursor=pointer]:
              - img [ref=e70]
            - button "Mark as not helpful" [ref=e73] [cursor=pointer]:
              - img [ref=e74]
    - generic [ref=e80] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e81]:
        - img [ref=e82]
      - generic [ref=e85]:
        - button "Open issues overlay" [ref=e86]:
          - generic [ref=e87]:
            - generic [ref=e88]: "0"
            - generic [ref=e89]: "1"
          - generic [ref=e90]: Issue
        - button "Collapse issues badge" [ref=e91]:
          - img [ref=e92]
  - alert [ref=e94]
```

# Test source

```ts
  67  |   });
  68  | 
  69  |   test('block preview shows on hover', async ({ page }) => {
  70  |     await page.goto('/studio/test-project-1');
  71  |     await page.waitForTimeout(2000);
  72  |     const blockButton = page.getByRole('button', { name: /blocks/i });
  73  |     if (await blockButton.isVisible()) {
  74  |       await blockButton.click();
  75  |     }
  76  |     const block = page.locator('[data-testid="block-item"]').or(page.getByText(/nine patch/i)).first();
  77  |     if (await block.isVisible()) {
  78  |       await block.hover();
  79  |       const preview = page.locator('[data-testid="block-preview"]').or(page.getByText(/preview/i));
  80  |       if (await preview.isVisible()) {
  81  |         await expect(preview).toBeVisible();
  82  |       }
  83  |     }
  84  |   });
  85  | });
  86  | 
  87  | test.describe('Block Builder', () => {
  88  |   test.beforeEach(async ({ page }) => {
  89  |     await mockAuth(page, 'pro');
  90  |     await mockCanvas(page);
  91  |     await mockProject(page, 'test-project-1');
  92  |   });
  93  | 
  94  |   test('block builder tab opens', async ({ page }) => {
  95  |     await page.goto('/studio/test-project-1');
  96  |     await page.waitForTimeout(2000);
  97  |     const builderButton = page.getByRole('button', { name: /block builder|builder/i });
  98  |     if (await builderButton.isVisible()) {
  99  |       await builderButton.click();
  100 |       await expect(page.getByText(/easydraw|builder/i)).toBeVisible();
  101 |     }
  102 |   });
  103 | 
  104 |   test('easydraw tool is available', async ({ page }) => {
  105 |     await page.goto('/studio/test-project-1');
  106 |     await page.waitForTimeout(2000);
  107 |     const builderButton = page.getByRole('button', { name: /block builder|builder/i });
  108 |     if (await builderButton.isVisible()) {
  109 |       await builderButton.click();
  110 |     }
  111 |     await expect(page.getByRole('button', { name: /easydraw/i })).toBeVisible();
  112 |   });
  113 | 
  114 |   test('applique tool is available', async ({ page }) => {
  115 |     await page.goto('/studio/test-project-1');
  116 |     await page.waitForTimeout(2000);
  117 |     const builderButton = page.getByRole('button', { name: /block builder|builder/i });
  118 |     if (await builderButton.isVisible()) {
  119 |       await builderButton.click();
  120 |     }
  121 |     const appliqueButton = page.getByRole('button', { name: /applique/i });
  122 |     if (await appliqueButton.isVisible()) {
  123 |       await expect(appliqueButton).toBeVisible();
  124 |     }
  125 |   });
  126 | 
  127 |   test('freeform tool is available', async ({ page }) => {
  128 |     await page.goto('/studio/test-project-1');
  129 |     await page.waitForTimeout(2000);
  130 |     const builderButton = page.getByRole('button', { name: /block builder|builder/i });
  131 |     if (await builderButton.isVisible()) {
  132 |       await builderButton.click();
  133 |     }
  134 |     const freeformButton = page.getByRole('button', { name: /freeform/i });
  135 |     if (await freeformButton.isVisible()) {
  136 |       await expect(freeformButton).toBeVisible();
  137 |     }
  138 |   });
  139 | 
  140 |   test('custom block can be saved', async ({ page }) => {
  141 |     await page.goto('/studio/test-project-1');
  142 |     await page.waitForTimeout(2000);
  143 |     const builderButton = page.getByRole('button', { name: /block builder|builder/i });
  144 |     if (await builderButton.isVisible()) {
  145 |       await builderButton.click();
  146 |     }
  147 |     const saveButton = page.getByRole('button', { name: /save block|save/i });
  148 |     if (await saveButton.isVisible()) {
  149 |       await expect(saveButton).toBeVisible();
  150 |     }
  151 |   });
  152 | });
  153 | 
  154 | test.describe('Block Overlay Templates', () => {
  155 |   test.beforeEach(async ({ page }) => {
  156 |     await mockAuth(page, 'pro');
  157 |     await mockCanvas(page);
  158 |     await mockProject(page, 'test-project-1');
  159 |   });
  160 | 
  161 |   test('traditional block overlays are available', async ({ page }) => {
  162 |     await page.goto('/studio/test-project-1');
  163 |     await page.waitForTimeout(2000);
  164 |     const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
  165 |     if (await overlayButton.isVisible()) {
  166 |       await overlayButton.click();
> 167 |       await expect(page.getByText(/nine patch|traditional|overlay/i)).toBeVisible();
      |                                                                       ^ Error: expect(locator).toBeVisible() failed
  168 |     }
  169 |   });
  170 | 
  171 |   test('overlay opacity can be adjusted', async ({ page }) => {
  172 |     await page.goto('/studio/test-project-1');
  173 |     await page.waitForTimeout(2000);
  174 |     const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
  175 |     if (await overlayButton.isVisible()) {
  176 |       await overlayButton.click();
  177 |     }
  178 |     const opacitySlider = page.locator('input[type="range"]').or(page.getByText(/opacity/i));
  179 |     if (await opacitySlider.isVisible()) {
  180 |       await expect(opacitySlider).toBeVisible();
  181 |     }
  182 |   });
  183 | 
  184 |   test('overlay can be locked', async ({ page }) => {
  185 |     await page.goto('/studio/test-project-1');
  186 |     await page.waitForTimeout(2000);
  187 |     const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
  188 |     if (await overlayButton.isVisible()) {
  189 |       await overlayButton.click();
  190 |     }
  191 |     const lockButton = page.getByRole('button', { name: /lock/i });
  192 |     if (await lockButton.isVisible()) {
  193 |       await expect(lockButton).toBeVisible();
  194 |     }
  195 |   });
  196 | 
  197 |   test('recommended dimensions modal shows', async ({ page }) => {
  198 |     await page.goto('/studio/test-project-1');
  199 |     await page.waitForTimeout(2000);
  200 |     const overlayButton = page.getByRole('button', { name: /overlay|blocks/i });
  201 |     if (await overlayButton.isVisible()) {
  202 |       await overlayButton.click();
  203 |     }
  204 |     const overlay = page.locator('[data-testid="overlay-item"]').or(page.getByText(/nine patch/i)).first();
  205 |     if (await overlay.isVisible()) {
  206 |       await overlay.click();
  207 |       await expect(page.getByText(/recommended dimensions|dimensions/i)).toBeVisible();
  208 |     }
  209 |   });
  210 | });
  211 | 
  212 | test.describe('Block Grid', () => {
  213 |   test.beforeEach(async ({ page }) => {
  214 |     await mockAuth(page, 'pro');
  215 |     await mockCanvas(page);
  216 |     await mockProject(page, 'test-project-1');
  217 |   });
  218 | 
  219 |   test('block grid tool is available', async ({ page }) => {
  220 |     await page.goto('/studio/test-project-1');
  221 |     await page.waitForTimeout(2000);
  222 |     const gridButton = page.getByRole('button', { name: /grid/i });
  223 |     if (await gridButton.isVisible()) {
  224 |       await expect(gridButton).toBeVisible();
  225 |     }
  226 |   });
  227 | 
  228 |   test('grid can be toggled on/off', async ({ page }) => {
  229 |     await page.goto('/studio/test-project-1');
  230 |     await page.waitForTimeout(2000);
  231 |     const gridButton = page.getByRole('button', { name: /grid/i });
  232 |     if (await gridButton.isVisible()) {
  233 |       await gridButton.click();
  234 |     }
  235 |   });
  236 | 
  237 |   test('grid settings can be adjusted', async ({ page }) => {
  238 |     await page.goto('/studio/test-project-1');
  239 |     await page.waitForTimeout(2000);
  240 |     const gridButton = page.getByRole('button', { name: /grid/i });
  241 |     if (await gridButton.isVisible()) {
  242 |       await gridButton.click();
  243 |     }
  244 |     const settingsButton = page.getByRole('button', { name: /settings/i });
  245 |     if (await settingsButton.isVisible()) {
  246 |       await settingsButton.click();
  247 |       await expect(page.getByText(/grid size|settings/i)).toBeVisible();
  248 |     }
  249 |   });
  250 | });
  251 | 
  252 | test.describe('Free Tier Block Limits', () => {
  253 |   test.beforeEach(async ({ page }) => {
  254 |     await mockAuth(page, 'free');
  255 |     await mockCanvas(page);
  256 |     await mockProject(page, 'test-project-1');
  257 |     await page.route('**/api/blocks', async (route) => {
  258 |       await route.fulfill({
  259 |         status: 200,
  260 |         contentType: 'application/json',
  261 |         body: JSON.stringify([]),
  262 |       });
  263 |     });
  264 |   });
  265 | 
  266 |   test('free users see block limit warning', async ({ page }) => {
  267 |     await page.goto('/studio/test-project-1');
```