# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard Access >> dashboard redirects unauthenticated users
- Location: tests/e2e/dashboard.spec.ts:5:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
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
            - button "Continue Latest Untitled Quilt" [ref=e38]:
              - generic [ref=e40]:
                - paragraph [ref=e41]: Continue Latest
                - paragraph [ref=e42]: Untitled Quilt
        - generic [ref=e43]:
          - heading "Navigate" [level=2] [ref=e44]
          - generic [ref=e45]:
            - link "Projects Manage your designs 22" [ref=e46] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e48]:
                - generic [ref=e49]:
                  - paragraph [ref=e50]: Projects
                  - paragraph [ref=e51]: Manage your designs
                - generic [ref=e52]: "22"
            - link "Fabric Library Browse fabrics" [ref=e53] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e56]:
                - paragraph [ref=e57]: Fabric Library
                - paragraph [ref=e58]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e59]:
              - generic [ref=e61]:
                - generic [ref=e62]:
                  - paragraph [ref=e63]: Mobile Uploads
                  - paragraph [ref=e64]: Process uploads
                - generic [ref=e65]: "0"
            - link "Settings Account preferences" [ref=e66] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e69]:
                - paragraph [ref=e70]: Settings
                - paragraph [ref=e71]: Account preferences
        - generic [ref=e72]:
          - generic [ref=e73]:
            - heading "Recent Projects" [level=2] [ref=e74]
            - link "View All" [ref=e75] [cursor=pointer]:
              - /url: /projects
              - text: View All
              - img [ref=e76]
          - generic [ref=e78]:
            - link "Untitled Quilt 2m ago imperial" [ref=e79] [cursor=pointer]:
              - /url: /studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49
              - img [ref=e81]
              - generic [ref=e92]:
                - paragraph [ref=e93]: Untitled Quilt
                - generic [ref=e94]:
                  - generic [ref=e95]: 2m ago
                  - generic [ref=e96]: imperial
            - link "Untitled Quilt 7m ago imperial" [ref=e97] [cursor=pointer]:
              - /url: /studio/ec2e575f-9017-4925-99f6-0e708b78181e
              - img [ref=e99]
              - generic [ref=e110]:
                - paragraph [ref=e111]: Untitled Quilt
                - generic [ref=e112]:
                  - generic [ref=e113]: 7m ago
                  - generic [ref=e114]: imperial
            - link "Untitled Quilt 1h ago imperial" [ref=e115] [cursor=pointer]:
              - /url: /studio/d3ebd90c-1fb8-4d99-9648-52f3cbda1728
              - img [ref=e117]
              - generic [ref=e128]:
                - paragraph [ref=e129]: Untitled Quilt
                - generic [ref=e130]:
                  - generic [ref=e131]: 1h ago
                  - generic [ref=e132]: imperial
            - link "Untitled Quilt 1h ago imperial" [ref=e133] [cursor=pointer]:
              - /url: /studio/a6a95723-92dc-4218-9bd8-4bf805666efd
              - img [ref=e135]
              - generic [ref=e146]:
                - paragraph [ref=e147]: Untitled Quilt
                - generic [ref=e148]:
                  - generic [ref=e149]: 1h ago
                  - generic [ref=e150]: imperial
            - link "Untitled Quilt 1h ago imperial" [ref=e151] [cursor=pointer]:
              - /url: /studio/4e670f16-f587-42eb-8ab0-d4c5e96f15b0
              - img [ref=e153]
              - generic [ref=e164]:
                - paragraph [ref=e165]: Untitled Quilt
                - generic [ref=e166]:
                  - generic [ref=e167]: 1h ago
                  - generic [ref=e168]: imperial
            - link "Untitled Quilt 1h ago imperial" [ref=e169] [cursor=pointer]:
              - /url: /studio/b9212996-c409-4aa8-911d-ee9aa728bb00
              - img [ref=e171]
              - generic [ref=e182]:
                - paragraph [ref=e183]: Untitled Quilt
                - generic [ref=e184]:
                  - generic [ref=e185]: 1h ago
                  - generic [ref=e186]: imperial
  - generic "Notifications"
  - generic [ref=e191] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e192]:
      - img [ref=e193]
    - generic [ref=e196]:
      - button "Open issues overlay" [ref=e197]:
        - generic [ref=e198]:
          - generic [ref=e199]: "0"
          - generic [ref=e200]: "1"
        - generic [ref=e201]: Issue
      - button "Collapse issues badge" [ref=e202]:
        - img [ref=e203]
  - alert [ref=e205]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Dashboard Access', () => {
  5   |   test('dashboard redirects unauthenticated users', async ({ page }) => {
  6   |     await page.goto('/dashboard');
> 7   |     await page.waitForURL(/signin/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
```