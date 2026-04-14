# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sketchbook.spec.ts >> Recent Projects >> recent projects show on dashboard
- Location: tests/e2e/sketchbook.spec.ts:154:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/recent|projects/i)
Expected: visible
Error: strict mode violation: getByText(/recent|projects/i) resolved to 2 elements:
    1) <p class="text-sm truncate">No projects yet</p> aka getByRole('button', { name: 'Continue Latest No projects' })
    2) <p class="font-semibold text-sm mb-0.5">Projects</p> aka getByRole('link', { name: 'Projects Manage your designs' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/recent|projects/i)

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
      - generic [ref=e13]:
        - link "Sign In" [ref=e14] [cursor=pointer]:
          - /url: /auth/signin
        - link "Start Designing" [ref=e15] [cursor=pointer]:
          - /url: /auth/signup
    - main [ref=e16]:
      - generic [ref=e19]:
        - generic [ref=e21]:
          - heading "Dashboard" [level=1] [ref=e22]
          - paragraph [ref=e23]: Good evening, there
        - generic [ref=e24]:
          - heading "Quick Actions" [level=2] [ref=e25]
          - generic [ref=e26]:
            - button "New Design Start a fresh project from scratch or a template" [ref=e27]:
              - generic [ref=e29]:
                - paragraph [ref=e30]: New Design
                - paragraph [ref=e31]: Start a fresh project from scratch or a template
            - link "Photo to Design Extract a pattern from a photo of a quilt" [ref=e32] [cursor=pointer]:
              - /url: /photo-to-design
              - generic [ref=e34]:
                - paragraph [ref=e35]: Photo to Design
                - paragraph [ref=e36]: Extract a pattern from a photo of a quilt
            - button "Continue Latest No projects yet" [disabled] [ref=e37]:
              - generic [ref=e39]:
                - paragraph [ref=e40]: Continue Latest
                - paragraph [ref=e41]: No projects yet
        - generic [ref=e42]:
          - heading "Navigate" [level=2] [ref=e43]
          - generic [ref=e44]:
            - link "Projects Manage your designs" [ref=e45] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e48]:
                - paragraph [ref=e49]: Projects
                - paragraph [ref=e50]: Manage your designs
            - link "Fabric Library Browse fabrics" [ref=e51] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e54]:
                - paragraph [ref=e55]: Fabric Library
                - paragraph [ref=e56]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e57]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - paragraph [ref=e61]: Mobile Uploads
                  - paragraph [ref=e62]: Process uploads
                - generic [ref=e63]: "0"
            - link "Settings Account preferences" [ref=e64] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e67]:
                - paragraph [ref=e68]: Settings
                - paragraph [ref=e69]: Account preferences
  - generic "Notifications"
  - generic [ref=e74] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e75]:
      - img [ref=e76]
    - generic [ref=e79]:
      - button "Open issues overlay" [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: "0"
          - generic [ref=e83]: "1"
        - generic [ref=e84]: Issue
      - button "Collapse issues badge" [ref=e85]:
        - img [ref=e86]
  - alert [ref=e88]
```

# Test source

```ts
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
> 156 |     await expect(page.getByText(/recent|projects/i)).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
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