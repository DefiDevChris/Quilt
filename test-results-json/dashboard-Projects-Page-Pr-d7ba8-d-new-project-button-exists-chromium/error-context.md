# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Projects Page >> Projects Page (Authenticated) >> new project button exists
- Location: tests/e2e/dashboard.spec.ts:96:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /new project|new design/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /new project|new design/i })

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
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Dashboard Access', () => {
  5   |   test('dashboard redirects unauthenticated users', async ({ page }) => {
  6   |     await page.goto('/dashboard');
  7   |     await page.waitForURL(/signin/);
  8   |     expect(page.url()).toContain('signin');
  9   |   });
  10  | });
  11  | 
  12  | test.describe('Dashboard Features (Authenticated)', () => {
  13  |   test.beforeEach(async ({ page }) => {
  14  |     await mockAuth(page, 'pro');
  15  |     await page.route('**/api/projects', async (route) => {
  16  |       await route.fulfill({
  17  |         status: 200,
  18  |         contentType: 'application/json',
  19  |         body: JSON.stringify([
  20  |           { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  21  |         ]),
  22  |       });
  23  |     });
  24  |   });
  25  | 
  26  |   test('dashboard loads bento grid', async ({ page }) => {
  27  |     await page.goto('/dashboard');
  28  |     await expect(page.getByText(/new design/i)).toBeVisible();
  29  |   });
  30  | 
  31  |   test('new design card is clickable', async ({ page }) => {
  32  |     await page.goto('/dashboard');
  33  |     const newDesignCard = page.getByText(/new design/i);
  34  |     await expect(newDesignCard).toBeVisible();
  35  |     await newDesignCard.click();
  36  |   });
  37  | 
  38  |   test('photo to design card is visible', async ({ page }) => {
  39  |     await page.goto('/dashboard');
  40  |     await expect(page.getByText(/photo to design/i)).toBeVisible();
  41  |   });
  42  | 
  43  |   test('recent projects section exists', async ({ page }) => {
  44  |     await page.goto('/dashboard');
  45  |     await expect(page.getByText(/recent|projects/i)).toBeVisible();
  46  |   });
  47  | 
  48  |   test('community feed preview exists', async ({ page }) => {
  49  |     await page.goto('/dashboard');
  50  |     await expect(page.getByText(/community|inspiration/i)).toBeVisible();
  51  |   });
  52  | 
  53  |   test('quick actions are visible', async ({ page }) => {
  54  |     await page.goto('/dashboard');
  55  |     await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
  56  |   });
  57  | });
  58  | 
  59  | test.describe('Projects Page', () => {
  60  |   test('projects page redirects unauthenticated users', async ({ page }) => {
  61  |     await page.goto('/projects');
  62  |     await page.waitForURL(/signin/);
  63  |     expect(page.url()).toContain('signin');
  64  |   });
  65  | 
  66  |   test.describe('Projects Page (Authenticated)', () => {
  67  |     test.beforeEach(async ({ page }) => {
  68  |       await mockAuth(page, 'pro');
  69  |       await page.route('**/api/projects', async (route) => {
  70  |         await route.fulfill({
  71  |           status: 200,
  72  |           contentType: 'application/json',
  73  |           body: JSON.stringify([
  74  |             { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
  75  |           ]),
  76  |         });
  77  |       });
  78  |     });
  79  | 
  80  |     test('projects page loads with search', async ({ page }) => {
  81  |       await page.goto('/projects');
  82  |       const searchInput = page.getByPlaceholder(/search/i);
  83  |       if (await searchInput.isVisible()) {
  84  |         await expect(searchInput).toBeVisible();
  85  |       }
  86  |     });
  87  | 
  88  |     test('projects can be filtered', async ({ page }) => {
  89  |       await page.goto('/projects');
  90  |       const filterButton = page.getByRole('button', { name: /filter/i });
  91  |       if (await filterButton.isVisible()) {
  92  |         await filterButton.click();
  93  |       }
  94  |     });
  95  | 
  96  |     test('new project button exists', async ({ page }) => {
  97  |       await page.goto('/projects');
> 98  |       await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
      |                                                                                   ^ Error: expect(locator).toBeVisible() failed
  99  |     });
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Settings Page', () => {
  104 |   test('settings page redirects unauthenticated users', async ({ page }) => {
  105 |     await page.goto('/settings');
  106 |     await page.waitForURL(/signin/);
  107 |     expect(page.url()).toContain('signin');
  108 |   });
  109 | 
  110 |   test.describe('Settings Page (Authenticated)', () => {
  111 |     test.beforeEach(async ({ page }) => {
  112 |       await mockAuth(page, 'pro');
  113 |     });
  114 | 
  115 |     test('settings page loads', async ({ page }) => {
  116 |       await page.goto('/settings');
  117 |       await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
  118 |     });
  119 | 
  120 |     test('delete account section exists', async ({ page }) => {
  121 |       await page.goto('/settings');
  122 |       await expect(page.getByText(/delete account|danger/i)).toBeVisible();
  123 |     });
  124 |   });
  125 | });
  126 | 
  127 | test.describe('Profile Page', () => {
  128 |   test('profile page redirects unauthenticated users', async ({ page }) => {
  129 |     await page.goto('/profile');
  130 |     await page.waitForURL(/signin/);
  131 |     expect(page.url()).toContain('signin');
  132 |   });
  133 | 
  134 |   test.describe('Profile Page (Authenticated)', () => {
  135 |     test.beforeEach(async ({ page }) => {
  136 |       await mockAuth(page, 'pro');
  137 |     });
  138 | 
  139 |     test('profile page loads', async ({ page }) => {
  140 |       await page.goto('/profile');
  141 |       await expect(page.getByText(/profile|my profile/i)).toBeVisible();
  142 |     });
  143 | 
  144 |     test('billing section exists for pro users', async ({ page }) => {
  145 |       await page.goto('/profile');
  146 |       await expect(page.getByText(/billing|subscription|pro/i)).toBeVisible();
  147 |     });
  148 |   });
  149 | });
  150 | 
```