# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sketchbook.spec.ts >> Sketchbook >> protected studio route redirects unauthenticated users
- Location: tests/e2e/sketchbook.spec.ts:10:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /auth\/signin|signin|unauthorized/
Received string:  "http://localhost:3000/studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    2 × unexpected value "http://localhost:3000/studio"
    - waiting for" http://localhost:3000/studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49" navigation to finish...
    - navigated to "http://localhost:3000/studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49"
    6 × unexpected value "http://localhost:3000/studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - button "Open menu" [ref=e8]:
          - img [ref=e9]
        - button "Back to Dashboard" [ref=e12]:
          - img [ref=e13]
          - text: Dashboard
        - generic [ref=e17]: Untitled Quilt
      - generic [ref=e18]:
        - generic [ref=e19]:
          - button "Lock viewport" [ref=e21]:
            - img [ref=e22]
          - button "Recenter viewport" [ref=e26]:
            - img [ref=e27]
        - button "Quilt settings" [ref=e33]:
          - img [ref=e34]
          - text: Quilt
          - img [ref=e36]
    - generic [ref=e38]:
      - navigation "Design tools" [ref=e39]:
        - generic [ref=e40]:
          - generic [ref=e42]:
            - button "Select" [pressed] [ref=e45]:
              - img [ref=e47]
              - generic [ref=e49]: Select
            - button "Pan" [ref=e52]:
              - img [ref=e54]
              - generic [ref=e59]: Pan
            - button "Easydraw" [ref=e62]:
              - img [ref=e64]
              - generic [ref=e67]: Easydraw
            - button "Bend" [ref=e70]:
              - img [ref=e72]
              - generic [ref=e75]: Bend
          - generic [ref=e78]:
            - button "Rectangle" [ref=e81]:
              - img [ref=e83]
              - generic [ref=e85]: Rectangle
            - button "Triangle" [ref=e88]:
              - img [ref=e90]
              - generic [ref=e92]: Triangle
          - generic [ref=e95]:
            - button "Undo" [ref=e98]:
              - img [ref=e100]
              - generic [ref=e103]: Undo
            - button "Redo" [disabled] [ref=e106]:
              - img [ref=e108]
              - generic [ref=e111]: Redo
          - generic [ref=e114]:
            - button "Zoom In" [ref=e117]:
              - img [ref=e119]
              - generic [ref=e122]: Zoom In
            - button "Zoom Out" [ref=e125]:
              - img [ref=e127]
              - generic [ref=e130]: Zoom Out
      - complementary [ref=e140]:
        - tablist "Library" [ref=e141]:
          - tab "Layouts" [selected] [ref=e142]
          - tab "Blocks" [ref=e143]
          - tab "Fabrics" [ref=e144]
        - tabpanel "Layouts" [ref=e146]:
          - generic [ref=e147]:
            - button "Grid Simple rows × columns of evenly sized blocks" [ref=e149]:
              - img [ref=e152]
              - generic [ref=e169]:
                - generic [ref=e171]: Grid
                - paragraph [ref=e172]: Simple rows × columns of evenly sized blocks
              - img [ref=e173]
            - button "Sashing Blocks separated by fabric strips" [ref=e176]:
              - img [ref=e179]
              - generic [ref=e203]:
                - generic [ref=e205]: Sashing
                - paragraph [ref=e206]: Blocks separated by fabric strips
              - img [ref=e207]
            - button "On-Point 45° rotated blocks with setting triangles" [ref=e210]:
              - img [ref=e213]
              - generic [ref=e229]:
                - generic [ref=e231]: On-Point
                - paragraph [ref=e232]: 45° rotated blocks with setting triangles
              - img [ref=e233]
            - button "Strip Alternating block columns and fabric strips" [ref=e236]:
              - img [ref=e239]
              - generic [ref=e254]:
                - generic [ref=e256]: Strip
                - paragraph [ref=e257]: Alternating block columns and fabric strips
              - img [ref=e258]
            - button "Border + Center Center block with concentric borders" [ref=e261]:
              - img [ref=e264]:
                - generic [ref=e268]: Center
              - generic [ref=e269]:
                - generic [ref=e271]: Border + Center
                - paragraph [ref=e272]: Center block with concentric borders
              - img [ref=e273]
            - button "Free-Form No layout fence — draw freely on the grid" [ref=e276]:
              - img [ref=e279]:
                - generic [ref=e281]: Free Draw
              - generic [ref=e282]:
                - generic [ref=e284]: Free-Form
                - paragraph [ref=e285]: No layout fence — draw freely on the grid
              - img [ref=e286]
    - generic [ref=e288]:
      - generic [ref=e289]:
        - generic [ref=e290]: "Mouse H: 0.00\" V: 0.00\""
        - button "Shades OFF" [ref=e291]
      - generic [ref=e292]:
        - generic [ref=e293]: "Snap to Grid: ON"
        - generic [ref=e294]: "Snap to Nodes: OFF"
    - dialog "New Quilt" [ref=e295]:
      - generic [active] [ref=e296]:
        - generic [ref=e297]:
          - heading "New Quilt" [level=2] [ref=e298]
          - button "Close" [ref=e299]:
            - img [ref=e300]
        - generic [ref=e303]:
          - generic [ref=e304]: Quilt Size
          - generic [ref=e305]:
            - button "Baby 36″ × 52″" [ref=e306]:
              - generic [ref=e307]: Baby
              - generic [ref=e308]: 36″ × 52″
            - button "Throw 50″ × 65″" [ref=e309]:
              - generic [ref=e310]: Throw
              - generic [ref=e311]: 50″ × 65″
            - button "Twin 68″ × 90″" [ref=e312]:
              - generic [ref=e313]: Twin
              - generic [ref=e314]: 68″ × 90″
            - button "Full/Double 81″ × 96″" [ref=e315]:
              - generic [ref=e316]: Full/Double
              - generic [ref=e317]: 81″ × 96″
            - button "Queen 90″ × 108″" [ref=e318]:
              - generic [ref=e319]: Queen
              - generic [ref=e320]: 90″ × 108″
            - button "King 108″ × 108″" [ref=e321]:
              - generic [ref=e322]: King
              - generic [ref=e323]: 108″ × 108″
          - button "Custom Size" [ref=e324]:
            - generic [ref=e325]: Custom Size
          - generic [ref=e326]:
            - button "Skip" [ref=e327]
            - button "Create Quilt" [ref=e328]
  - generic "Notifications"
  - generic [ref=e333] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e334]:
      - img [ref=e335]
    - generic [ref=e338]:
      - button "Open issues overlay" [ref=e339]:
        - generic [ref=e340]:
          - generic [ref=e341]: "0"
          - generic [ref=e342]: "1"
        - generic [ref=e343]: Issue
      - button "Collapse issues badge" [ref=e344]:
        - img [ref=e345]
  - alert [ref=e347]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas, mockProject } from './utils';
  3   | 
  4   | test.describe('Sketchbook', () => {
  5   |   test('app loads without errors', async ({ page }) => {
  6   |     await page.goto('/');
  7   |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  8   |   });
  9   | 
  10  |   test('protected studio route redirects unauthenticated users', async ({ page }) => {
  11  |     await page.goto('/studio');
> 12  |     await expect(page).toHaveURL(/auth\/signin|signin|unauthorized/, { timeout: 5000 });
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  13  |   });
  14  | });
  15  | 
  16  | test.describe('Project Creation', () => {
  17  |   test.beforeEach(async ({ page }) => {
  18  |     await mockAuth(page, 'pro');
  19  |     await page.route('**/api/projects', async (route) => {
  20  |       if (route.request().method() === 'POST') {
  21  |         await route.fulfill({
  22  |           status: 200,
  23  |           contentType: 'application/json',
  24  |           body: JSON.stringify({ id: 'new-project-123', success: true }),
  25  |         });
  26  |       } else {
  27  |         await route.fulfill({
  28  |           status: 200,
  29  |           contentType: 'application/json',
  30  |           body: JSON.stringify([
  31  |             { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  32  |           ]),
  33  |         });
  34  |       }
  35  |     });
  36  |   });
  37  | 
  38  |   test('can create new project from dashboard', async ({ page }) => {
  39  |     await page.goto('/dashboard');
  40  |     const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
  41  |     if (await newProjectButton.isVisible()) {
  42  |       await newProjectButton.click();
  43  |     }
  44  |   });
  45  | 
  46  |   test('new project has default canvas', async ({ page }) => {
  47  |     await mockCanvas(page);
  48  |     await mockProject(page, 'new-project-123');
  49  |     await page.goto('/dashboard');
  50  |     const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
  51  |     if (await newProjectButton.isVisible()) {
  52  |       await newProjectButton.click();
  53  |     }
  54  |     const canvas = page.locator('canvas');
  55  |     if (await canvas.isVisible()) {
  56  |       await expect(canvas).toBeVisible();
  57  |     }
  58  |   });
  59  | 
  60  |   test('new project has default worktable', async ({ page }) => {
  61  |     await mockCanvas(page);
  62  |     await mockProject(page, 'new-project-123');
  63  |     await page.goto('/dashboard');
  64  |     const newProjectButton = page.getByRole('button', { name: /new project|new design/i });
  65  |     if (await newProjectButton.isVisible()) {
  66  |       await newProjectButton.click();
  67  |     }
  68  |     await expect(page.getByText(/worktable 1/i)).toBeVisible();
  69  |   });
  70  | });
  71  | 
  72  | test.describe('Project Management', () => {
  73  |   test.beforeEach(async ({ page }) => {
  74  |     await mockAuth(page, 'pro');
  75  |     await page.route('**/api/projects', async (route) => {
  76  |       await route.fulfill({
  77  |         status: 200,
  78  |         contentType: 'application/json',
  79  |         body: JSON.stringify([
  80  |           { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  81  |         ]),
  82  |       });
  83  |     });
  84  |   });
  85  | 
  86  |   test('projects list shows all projects', async ({ page }) => {
  87  |     await page.goto('/projects');
  88  |     const projects = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i));
  89  |     await expect(projects.first()).toBeVisible();
  90  |   });
  91  | 
  92  |   test('can search projects', async ({ page }) => {
  93  |     await page.goto('/projects');
  94  |     const searchInput = page.getByPlaceholder(/search/i);
  95  |     if (await searchInput.isVisible()) {
  96  |       await searchInput.fill('test');
  97  |       await page.waitForTimeout(500);
  98  |     }
  99  |   });
  100 | 
  101 |   test('can delete project', async ({ page }) => {
  102 |     await page.goto('/projects');
  103 |     const project = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i)).first();
  104 |     if (await project.isVisible()) {
  105 |       await project.hover();
  106 |       const deleteButton = page.getByRole('button', { name: /delete/i });
  107 |       if (await deleteButton.isVisible()) {
  108 |         await deleteButton.click();
  109 |         await expect(page.getByText(/confirm|delete/i)).toBeVisible();
  110 |       }
  111 |     }
  112 |   });
```