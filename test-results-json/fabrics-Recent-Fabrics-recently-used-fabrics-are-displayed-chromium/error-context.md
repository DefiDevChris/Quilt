# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fabrics.spec.ts >> Recent Fabrics >> recently used fabrics are displayed
- Location: tests/e2e/fabrics.spec.ts:211:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/recent|fabric/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/recent|fabric/i)

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
  118 |     await page.waitForTimeout(2000);
  119 |     const calibrateButton = page.getByRole('button', { name: /calibrate/i });
  120 |     if (await calibrateButton.isVisible()) {
  121 |       await calibrateButton.click();
  122 |     }
  123 |     const scaleInput = page.locator('input[type="number"]').or(page.getByText(/scale/i));
  124 |     if (await scaleInput.isVisible()) {
  125 |       await expect(scaleInput).toBeVisible();
  126 |     }
  127 |   });
  128 | });
  129 | 
  130 | test.describe('Fussy Cut Preview', () => {
  131 |   test.beforeEach(async ({ page }) => {
  132 |     await mockAuth(page, 'pro');
  133 |     await mockCanvas(page);
  134 |     await mockProject(page, 'test-project-1');
  135 |   });
  136 | 
  137 |   test('fussy cut tool is available', async ({ page }) => {
  138 |     await page.goto('/studio/test-project-1');
  139 |     await page.waitForTimeout(2000);
  140 |     const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
  141 |     if (await fussyCutButton.isVisible()) {
  142 |       await expect(fussyCutButton).toBeVisible();
  143 |     }
  144 |   });
  145 | 
  146 |   test('fussy cut preview shows fabric positioning', async ({ page }) => {
  147 |     await page.goto('/studio/test-project-1');
  148 |     await page.waitForTimeout(2000);
  149 |     const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
  150 |     if (await fussyCutButton.isVisible()) {
  151 |       await fussyCutButton.click();
  152 |       await expect(page.getByText(/position|fussy/i)).toBeVisible();
  153 |     }
  154 |   });
  155 | });
  156 | 
  157 | test.describe('Color Tools', () => {
  158 |   test.beforeEach(async ({ page }) => {
  159 |     await mockAuth(page, 'pro');
  160 |     await mockCanvas(page);
  161 |     await mockProject(page, 'test-project-1');
  162 |   });
  163 | 
  164 |   test('serendipity color shuffle works', async ({ page }) => {
  165 |     await page.goto('/studio/test-project-1');
  166 |     await page.waitForTimeout(2000);
  167 |     const shuffleButton = page.getByRole('button', { name: /shuffle|serendipity/i });
  168 |     if (await shuffleButton.isVisible()) {
  169 |       await shuffleButton.click();
  170 |     }
  171 |   });
  172 | 
  173 |   test('quick color palette opens', async ({ page }) => {
  174 |     await page.goto('/studio/test-project-1');
  175 |     await page.waitForTimeout(2000);
  176 |     const paletteButton = page.getByRole('button', { name: /palette|color/i });
  177 |     if (await paletteButton.isVisible()) {
  178 |       await paletteButton.click();
  179 |       await expect(page.getByText(/color|palette/i)).toBeVisible();
  180 |     }
  181 |   });
  182 | 
  183 |   test('color theme tool is available', async ({ page }) => {
  184 |     await page.goto('/studio/test-project-1');
  185 |     await page.waitForTimeout(2000);
  186 |     const themeButton = page.getByRole('button', { name: /theme|color theme/i });
  187 |     if (await themeButton.isVisible()) {
  188 |       await themeButton.click();
  189 |       await expect(page.getByText(/theme|color/i)).toBeVisible();
  190 |     }
  191 |   });
  192 | });
  193 | 
  194 | test.describe('Recent Fabrics', () => {
  195 |   test.beforeEach(async ({ page }) => {
  196 |     await mockAuth(page, 'pro');
  197 |     await mockCanvas(page);
  198 |     await mockProject(page, 'test-project-1');
  199 |   });
  200 | 
  201 |   test('recent fabrics section exists', async ({ page }) => {
  202 |     await page.goto('/studio/test-project-1');
  203 |     await page.waitForTimeout(2000);
  204 |     const fabricButton = page.getByRole('button', { name: /fabrics/i });
  205 |     if (await fabricButton.isVisible()) {
  206 |       await fabricButton.click();
  207 |       await expect(page.getByText(/recent|recently/i)).toBeVisible();
  208 |     }
  209 |   });
  210 | 
  211 |   test('recently used fabrics are displayed', async ({ page }) => {
  212 |     await page.goto('/studio/test-project-1');
  213 |     await page.waitForTimeout(2000);
  214 |     const fabricButton = page.getByRole('button', { name: /fabrics/i });
  215 |     if (await fabricButton.isVisible()) {
  216 |       await fabricButton.click();
  217 |     }
> 218 |     await expect(page.getByText(/recent|fabric/i)).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  219 |   });
  220 | });
  221 | 
  222 | test.describe('Free Tier Fabric Limits', () => {
  223 |   test.beforeEach(async ({ page }) => {
  224 |     await mockAuth(page, 'free');
  225 |     await mockCanvas(page);
  226 |     await mockProject(page, 'test-project-1');
  227 |     await page.route('**/api/fabrics', async (route) => {
  228 |       await route.fulfill({
  229 |         status: 200,
  230 |         contentType: 'application/json',
  231 |         body: JSON.stringify([]),
  232 |       });
  233 |     });
  234 |   });
  235 | 
  236 |   test('free users see fabric limit warning', async ({ page }) => {
  237 |     await page.goto('/studio/test-project-1');
  238 |     await page.waitForTimeout(2000);
  239 |     const fabricButton = page.getByRole('button', { name: /fabrics/i });
  240 |     if (await fabricButton.isVisible()) {
  241 |       await fabricButton.click();
  242 |       await expect(page.getByText(/limit|upgrade|fabrics/i)).toBeVisible();
  243 |     }
  244 |   });
  245 | 
  246 |   test('free users cannot access fabric calibration', async ({ page }) => {
  247 |     await page.goto('/studio/test-project-1');
  248 |     await page.waitForTimeout(2000);
  249 |     const calibrateButton = page.getByRole('button', { name: /calibrate/i });
  250 |     if (await calibrateButton.isVisible()) {
  251 |       await calibrateButton.click();
  252 |       await expect(page.getByText(/upgrade|pro|limit/i)).toBeVisible();
  253 |     }
  254 |   });
  255 | 
  256 |   test('free users cannot access fussy cut', async ({ page }) => {
  257 |     await page.goto('/studio/test-project-1');
  258 |     await page.waitForTimeout(2000);
  259 |     const fussyCutButton = page.getByRole('button', { name: /fussy cut/i });
  260 |     if (await fussyCutButton.isVisible()) {
  261 |       await fussyCutButton.click();
  262 |       await expect(page.getByText(/upgrade|pro|limit/i)).toBeVisible();
  263 |     }
  264 |   });
  265 | });
  266 | 
```