# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Projects Page >> projects page loads with projects list
- Location: tests/e2e/projects.spec.ts:60:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /all projects|my projects|quiltbook/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: /all projects|my projects|quiltbook/i })

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
      - generic [ref=e19]:
        - generic:
          - img "QuiltCorgi Mascot"
        - generic [ref=e20]:
          - generic [ref=e22]:
            - generic [ref=e23]:
              - paragraph [ref=e26]: Archive
              - heading "Project Library" [level=1] [ref=e27]
              - paragraph [ref=e28]: 0 curated designs
            - generic [ref=e30]:
              - generic [ref=e31]:
                - button "Grid View" [ref=e32]:
                  - img [ref=e33]
                - button "List View" [ref=e35]:
                  - img [ref=e36]
              - link "Create New" [ref=e37] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e38]
                - text: Create New
          - generic [ref=e40]:
            - img "QuiltCorgi Mascot" [ref=e41]
            - heading "No projects yet" [level=3] [ref=e42]
            - paragraph [ref=e43]: Start your first quilt design and build your collection of curated patterns.
            - link "Start Your First Quilt" [ref=e44] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e45]
              - text: Start Your First Quilt
  - generic "Notifications"
  - generic [ref=e50] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e51]:
      - img [ref=e52]
    - generic [ref=e55]:
      - button "Open issues overlay" [ref=e56]:
        - generic [ref=e57]:
          - generic [ref=e58]: "1"
          - generic [ref=e59]: "2"
        - generic [ref=e60]:
          - text: Issue
          - generic [ref=e61]: s
      - button "Collapse issues badge" [ref=e62]:
        - img [ref=e63]
  - alert [ref=e65]
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
  41  |     await expect(page.getByText(/test user|hello|welcome/i).first()).toBeVisible();
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
> 62  |     await expect(page.getByRole('heading', { name: /all projects|my projects|quiltbook/i })).toBeVisible();
      |                                                                                              ^ Error: expect(locator).toBeVisible() failed
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
  142 |           contentType: 'application/json',
  143 |           body: JSON.stringify({ id: 'new-project-123', success: true }),
  144 |         });
  145 |       } else {
  146 |         await route.fulfill({
  147 |           status: 200,
  148 |           contentType: 'application/json',
  149 |           body: JSON.stringify([]),
  150 |         });
  151 |       }
  152 |     });
  153 |   });
  154 | 
  155 |   test('new project dialog opens', async ({ page }) => {
  156 |     await page.goto('/dashboard');
  157 |     const newDesignButton = page.getByRole('button', { name: /new design/i });
  158 |     if (await newDesignButton.isVisible()) {
  159 |       await newDesignButton.click();
  160 |       await expect(page.getByRole('dialog').or(page.getByText(/project name|create project/i))).toBeVisible();
  161 |     }
  162 |   });
```