# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sketchbook.spec.ts >> Project Management >> projects list shows all projects
- Location: tests/e2e/sketchbook.spec.ts:86:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="project-card"]').or(getByText(/test project/i)).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="project-card"]').or(getByText(/test project/i)).first()

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
  4   | test.describe('Sketchbook', () => {
  5   |   test('app loads without errors', async ({ page }) => {
  6   |     await page.goto('/');
  7   |     await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  8   |   });
  9   | 
  10  |   test('protected studio route redirects unauthenticated users', async ({ page }) => {
  11  |     await page.goto('/studio');
  12  |     await expect(page).toHaveURL(/auth\/signin|signin|unauthorized/, { timeout: 5000 });
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
> 89  |     await expect(projects.first()).toBeVisible();
      |                                    ^ Error: expect(locator).toBeVisible() failed
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
  113 | 
  114 |   test('can duplicate project', async ({ page }) => {
  115 |     await page.goto('/projects');
  116 |     const project = page.locator('[data-testid="project-card"]').or(page.getByText(/test project/i)).first();
  117 |     if (await project.isVisible()) {
  118 |       await project.hover();
  119 |       const duplicateButton = page.getByRole('button', { name: /duplicate/i });
  120 |       if (await duplicateButton.isVisible()) {
  121 |         await duplicateButton.click();
  122 |       }
  123 |     }
  124 |   });
  125 | 
  126 |   test('can rename project', async ({ page }) => {
  127 |     await mockCanvas(page);
  128 |     await mockProject(page, 'test-project-1');
  129 |     await page.goto('/studio/test-project-1');
  130 |     await page.waitForTimeout(2000);
  131 |     const projectName = page.locator('[data-testid="project-name"]').or(page.getByText(/test project/i));
  132 |     if (await projectName.isVisible()) {
  133 |       await projectName.click();
  134 |       await page.keyboard.type('New Name');
  135 |       await page.keyboard.press('Enter');
  136 |     }
  137 |   });
  138 | });
  139 | 
  140 | test.describe('Recent Projects', () => {
  141 |   test.beforeEach(async ({ page }) => {
  142 |     await mockAuth(page, 'pro');
  143 |     await page.route('**/api/projects', async (route) => {
  144 |       await route.fulfill({
  145 |         status: 200,
  146 |         contentType: 'application/json',
  147 |         body: JSON.stringify([
  148 |           { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  149 |         ]),
  150 |       });
  151 |     });
  152 |   });
  153 | 
  154 |   test('recent projects show on dashboard', async ({ page }) => {
  155 |     await page.goto('/dashboard');
  156 |     await expect(page.getByText(/recent|projects/i)).toBeVisible();
  157 |   });
  158 | 
  159 |   test('can open recent project', async ({ page }) => {
  160 |     await mockCanvas(page);
  161 |     await mockProject(page, 'test-project-1');
  162 |     await page.goto('/dashboard');
  163 |     const recentProject = page.locator('[data-testid="recent-project"]').or(page.getByText(/test project/i)).first();
  164 |     if (await recentProject.isVisible()) {
  165 |       await recentProject.click();
  166 |       await expect(page).toHaveURL(/\/studio\/.+/);
  167 |     }
  168 |   });
  169 | });
  170 | 
```