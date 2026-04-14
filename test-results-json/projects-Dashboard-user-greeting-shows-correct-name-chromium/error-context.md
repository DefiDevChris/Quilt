# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Dashboard >> user greeting shows correct name
- Location: tests/e2e/projects.spec.ts:39:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/test user|hello|welcome/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/test user|hello|welcome/i).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e4]:
    - navigation "Main navigation" [ref=e5]:
      - link "QuiltCorgi Logo QuiltCorgi" [ref=e6] [cursor=pointer]:
        - /url: /dashboard
        - img "QuiltCorgi Logo" [ref=e7]
        - generic [ref=e8]: QuiltCorgi
      - generic [ref=e9]:
        - link "Dashboard" [ref=e10] [cursor=pointer]:
          - /url: /dashboard
        - link "Shop" [ref=e11] [cursor=pointer]:
          - /url: /shop
        - link "Profile" [ref=e12] [cursor=pointer]:
          - /url: /profile
      - button "User menu" [ref=e14]:
        - img "Default Avatar" [ref=e16]
    - main [ref=e17]:
      - generic [ref=e20]:
        - generic [ref=e22]:
          - heading "Dashboard" [level=1] [ref=e23]
          - paragraph [ref=e24]: Good evening, Test
        - generic [ref=e25]:
          - heading "Quick Actions" [level=2] [ref=e26]
          - generic [ref=e27]:
            - button "New Design Start a fresh project from scratch or a template" [ref=e28]:
              - generic [ref=e30]:
                - paragraph [ref=e31]: New Design
                - paragraph [ref=e32]: Start a fresh project from scratch or a template
            - link "Photo to Design Extract a pattern from a photo of a quilt" [ref=e33] [cursor=pointer]:
              - /url: /photo-to-design
              - generic [ref=e35]:
                - paragraph [ref=e36]: Photo to Design
                - paragraph [ref=e37]: Extract a pattern from a photo of a quilt
            - button "Continue Latest No projects yet" [disabled] [ref=e38]:
              - generic [ref=e40]:
                - paragraph [ref=e41]: Continue Latest
                - paragraph [ref=e42]: No projects yet
        - generic [ref=e43]:
          - heading "Navigate" [level=2] [ref=e44]
          - generic [ref=e45]:
            - link "Projects Manage your designs" [ref=e46] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e49]:
                - paragraph [ref=e50]: Projects
                - paragraph [ref=e51]: Manage your designs
            - link "Fabric Library Browse fabrics" [ref=e52] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e55]:
                - paragraph [ref=e56]: Fabric Library
                - paragraph [ref=e57]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e58]:
              - generic [ref=e60]:
                - generic [ref=e61]:
                  - paragraph [ref=e62]: Mobile Uploads
                  - paragraph [ref=e63]: Process uploads
                - generic [ref=e64]: "0"
            - link "Settings Account preferences" [ref=e65] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e68]:
                - paragraph [ref=e69]: Settings
                - paragraph [ref=e70]: Account preferences
  - generic "Notifications"
  - generic [ref=e75] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e76]:
      - img [ref=e77]
    - generic [ref=e80]:
      - button "Open issues overlay" [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]: "0"
          - generic [ref=e84]: "1"
        - generic [ref=e85]: Issue
      - button "Collapse issues badge" [ref=e86]:
        - img [ref=e87]
  - alert [ref=e89]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas, mockProject } from './utils';
  3   | 
  4   | test.describe('Dashboard', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |     await page.route('**/api/projects', async (route) => {
  8   |       await route.fulfill({
  9   |         status: 200,
  10  |         contentType: 'application/json',
  11  |         body: JSON.stringify([
  12  |           { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  13  |           { id: 'test-project-2', name: 'Test Project 2', createdAt: new Date().toISOString() },
  14  |         ]),
  15  |       });
  16  |     });
  17  |   });
  18  | 
  19  |   test('dashboard page loads for authenticated users', async ({ page }) => {
  20  |     await page.goto('/dashboard');
  21  |     await expect(page).toHaveURL(/\/dashboard/);
  22  |   });
  23  | 
  24  |   test('dashboard shows quick start workflows', async ({ page }) => {
  25  |     await page.goto('/dashboard');
  26  |     await expect(page.getByText(/new design/i)).toBeVisible();
  27  |     await expect(page.getByText(/photo to design/i)).toBeVisible();
  28  |   });
  29  | 
  30  |   test('new design button opens project dialog', async ({ page }) => {
  31  |     await page.goto('/dashboard');
  32  |     const newDesignButton = page.getByRole('button', { name: /new design/i });
  33  |     if (await newDesignButton.isVisible()) {
  34  |       await newDesignButton.click();
  35  |       await expect(page.getByRole('dialog').or(page.getByText(/project name/i))).toBeVisible();
  36  |     }
  37  |   });
  38  | 
  39  |   test('user greeting shows correct name', async ({ page }) => {
  40  |     await page.goto('/dashboard');
> 41  |     await expect(page.getByText(/test user|hello|welcome/i).first()).toBeVisible();
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  42  |   });
  43  | });
  44  | 
  45  | test.describe('Projects Page', () => {
  46  |   test.beforeEach(async ({ page }) => {
  47  |     await mockAuth(page, 'pro');
  48  |     await page.route('**/api/projects', async (route) => {
  49  |       await route.fulfill({
  50  |         status: 200,
  51  |         contentType: 'application/json',
  52  |         body: JSON.stringify([
  53  |           { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  54  |           { id: 'test-project-2', name: 'Test Project 2', createdAt: new Date().toISOString() },
  55  |         ]),
  56  |       });
  57  |     });
  58  |   });
  59  | 
  60  |   test('projects page loads with projects list', async ({ page }) => {
  61  |     await page.goto('/projects');
  62  |     await expect(page.getByRole('heading', { name: /all projects|my projects|quiltbook/i })).toBeVisible();
  63  |   });
  64  | 
  65  |   test('projects page shows project count', async ({ page }) => {
  66  |     await page.goto('/projects');
  67  |     await expect(page.getByText(/designs?|projects?|2 projects?/i)).toBeVisible();
  68  |   });
  69  | 
  70  |   test('search filters projects', async ({ page }) => {
  71  |     await page.goto('/projects');
  72  |     const searchInput = page.getByPlaceholder(/search/i);
  73  |     if (await searchInput.isVisible()) {
  74  |       await searchInput.fill('test');
  75  |       await page.waitForTimeout(500);
  76  |     }
  77  |   });
  78  | 
  79  |   test('grid view toggle works', async ({ page }) => {
  80  |     await page.goto('/projects');
  81  |     const gridButton = page.getByRole('button', { name: /grid/i });
  82  |     if (await gridButton.isVisible()) {
  83  |       await gridButton.click();
  84  |     }
  85  |   });
  86  | 
  87  |   test('list view toggle works', async ({ page }) => {
  88  |     await page.goto('/projects');
  89  |     const listButton = page.getByRole('button', { name: /list/i });
  90  |     if (await listButton.isVisible()) {
  91  |       await listButton.click();
  92  |     }
  93  |   });
  94  | 
  95  |   test('clicking project navigates to studio', async ({ page }) => {
  96  |     await page.goto('/projects');
  97  |     const projectLink = page.getByRole('link', { name: /test project/i }).first();
  98  |     if (await projectLink.isVisible()) {
  99  |       await projectLink.click();
  100 |       await expect(page).toHaveURL(/\/studio\/.+/);
  101 |     }
  102 |   });
  103 | 
  104 |   test('empty state shows when no projects', async ({ page }) => {
  105 |     await page.route('**/api/projects', async (route) => {
  106 |       await route.fulfill({
  107 |         status: 200,
  108 |         contentType: 'application/json',
  109 |         body: JSON.stringify([]),
  110 |       });
  111 |     });
  112 |     await page.goto('/projects');
  113 |     await expect(page.getByText(/no projects|start creating|start designing/i)).toBeVisible();
  114 |   });
  115 | 
  116 |   test('project actions menu works', async ({ page }) => {
  117 |     await page.goto('/projects');
  118 |     const actionMenu = page.locator('[aria-label*="actions" i], button:has(svg)').first();
  119 |     if (await actionMenu.isVisible()) {
  120 |       await actionMenu.click();
  121 |       await expect(page.getByText(/duplicate|delete|rename/i).first()).toBeVisible();
  122 |     }
  123 |   });
  124 | 
  125 |   test('sort options work', async ({ page }) => {
  126 |     await page.goto('/projects');
  127 |     const sortButton = page.getByRole('button', { name: /sort|order|recent/i }).first();
  128 |     if (await sortButton.isVisible()) {
  129 |       await sortButton.click();
  130 |       await expect(page.getByText(/newest|oldest|name|a-z|z-a|recent/i).first()).toBeVisible();
  131 |     }
  132 |   });
  133 | });
  134 | 
  135 | test.describe('Project Creation', () => {
  136 |   test.beforeEach(async ({ page }) => {
  137 |     await mockAuth(page, 'pro');
  138 |     await page.route('**/api/projects', async (route) => {
  139 |       if (route.request().method() === 'POST') {
  140 |         await route.fulfill({
  141 |           status: 200,
```