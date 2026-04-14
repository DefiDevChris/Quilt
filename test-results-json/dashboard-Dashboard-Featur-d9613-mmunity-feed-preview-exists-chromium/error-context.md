# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard Features (Authenticated) >> community feed preview exists
- Location: tests/e2e/dashboard.spec.ts:48:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/community|inspiration/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/community|inspiration/i)

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
> 50  |     await expect(page.getByText(/community|inspiration/i)).toBeVisible();
      |                                                            ^ Error: expect(locator).toBeVisible() failed
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
  98  |       await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
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