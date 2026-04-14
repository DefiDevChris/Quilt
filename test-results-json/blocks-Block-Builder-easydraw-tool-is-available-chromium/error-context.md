# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blocks.spec.ts >> Block Builder >> easydraw tool is available
- Location: tests/e2e/blocks.spec.ts:104:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /easydraw/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /easydraw/i })

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
  11  |         status: 200,
  12  |         contentType: 'application/json',
  13  |         body: JSON.stringify([
  14  |           { id: 'block-1', name: 'Nine Patch', category: 'traditional' },
  15  |           { id: 'block-2', name: 'Square in Square', category: 'traditional' },
  16  |         ]),
  17  |       });
  18  |     });
  19  |   });
  20  | 
  21  |   test('block library opens', async ({ page }) => {
  22  |     await page.goto('/studio/test-project-1');
  23  |     await page.waitForTimeout(2000);
  24  |     const blockButton = page.getByRole('button', { name: /blocks/i });
  25  |     if (await blockButton.isVisible()) {
  26  |       await blockButton.click();
  27  |       await expect(page.getByText(/block library|blocks/i)).toBeVisible();
  28  |     }
  29  |   });
  30  | 
  31  |   test('block categories are visible', async ({ page }) => {
  32  |     await page.goto('/studio/test-project-1');
  33  |     await page.waitForTimeout(2000);
  34  |     const blockButton = page.getByRole('button', { name: /blocks/i });
  35  |     if (await blockButton.isVisible()) {
  36  |       await blockButton.click();
  37  |       await expect(page.getByText(/traditional|categories/i)).toBeVisible();
  38  |     }
  39  |   });
  40  | 
  41  |   test('block search works', async ({ page }) => {
  42  |     await page.goto('/studio/test-project-1');
  43  |     await page.waitForTimeout(2000);
  44  |     const blockButton = page.getByRole('button', { name: /blocks/i });
  45  |     if (await blockButton.isVisible()) {
  46  |       await blockButton.click();
  47  |     }
  48  |     const searchInput = page.getByPlaceholder(/search/i);
  49  |     if (await searchInput.isVisible()) {
  50  |       await searchInput.fill('nine patch');
  51  |       await expect(page.getByText(/nine patch|nine|patch/i)).toBeVisible();
  52  |     }
  53  |   });
  54  | 
  55  |   test('block can be dragged to canvas', async ({ page }) => {
  56  |     await page.goto('/studio/test-project-1');
  57  |     await page.waitForTimeout(2000);
  58  |     const blockButton = page.getByRole('button', { name: /blocks/i });
  59  |     if (await blockButton.isVisible()) {
  60  |       await blockButton.click();
  61  |     }
  62  |     const block = page.locator('[data-testid="block-item"]').or(page.getByText(/nine patch/i)).first();
  63  |     const canvas = page.locator('canvas');
  64  |     if (await block.isVisible() && await canvas.isVisible()) {
  65  |       await block.dragTo(canvas);
  66  |     }
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
> 111 |     await expect(page.getByRole('button', { name: /easydraw/i })).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
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
  167 |       await expect(page.getByText(/nine patch|traditional|overlay/i)).toBeVisible();
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
```