# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Projects Page >> projects page redirects unauthenticated users
- Location: tests/e2e/dashboard.spec.ts:60:7

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
      - generic [ref=e19]:
        - generic:
          - img "QuiltCorgi Mascot"
        - generic [ref=e20]:
          - generic [ref=e22]:
            - generic [ref=e23]:
              - paragraph [ref=e26]: Archive
              - heading "Project Library" [level=1] [ref=e27]
              - paragraph [ref=e28]: 22 curated designs
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
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e41] [cursor=pointer]:
              - /url: /studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49
              - generic [ref=e44]: U
              - generic [ref=e45]:
                - heading "Untitled Quilt" [level=3] [ref=e46]
                - generic [ref=e47]:
                  - img [ref=e48]
                  - generic [ref=e50]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e51] [cursor=pointer]:
              - /url: /studio/ec2e575f-9017-4925-99f6-0e708b78181e
              - generic [ref=e54]: U
              - generic [ref=e55]:
                - heading "Untitled Quilt" [level=3] [ref=e56]
                - generic [ref=e57]:
                  - img [ref=e58]
                  - generic [ref=e60]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e61] [cursor=pointer]:
              - /url: /studio/d3ebd90c-1fb8-4d99-9648-52f3cbda1728
              - generic [ref=e64]: U
              - generic [ref=e65]:
                - heading "Untitled Quilt" [level=3] [ref=e66]
                - generic [ref=e67]:
                  - img [ref=e68]
                  - generic [ref=e70]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e71] [cursor=pointer]:
              - /url: /studio/a6a95723-92dc-4218-9bd8-4bf805666efd
              - generic [ref=e74]: U
              - generic [ref=e75]:
                - heading "Untitled Quilt" [level=3] [ref=e76]
                - generic [ref=e77]:
                  - img [ref=e78]
                  - generic [ref=e80]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e81] [cursor=pointer]:
              - /url: /studio/4e670f16-f587-42eb-8ab0-d4c5e96f15b0
              - generic [ref=e84]: U
              - generic [ref=e85]:
                - heading "Untitled Quilt" [level=3] [ref=e86]
                - generic [ref=e87]:
                  - img [ref=e88]
                  - generic [ref=e90]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e91] [cursor=pointer]:
              - /url: /studio/b9212996-c409-4aa8-911d-ee9aa728bb00
              - generic [ref=e94]: U
              - generic [ref=e95]:
                - heading "Untitled Quilt" [level=3] [ref=e96]
                - generic [ref=e97]:
                  - img [ref=e98]
                  - generic [ref=e100]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e101] [cursor=pointer]:
              - /url: /studio/f64599ce-b607-400f-8a45-aa960c907bc2
              - generic [ref=e104]: U
              - generic [ref=e105]:
                - heading "Untitled Quilt" [level=3] [ref=e106]
                - generic [ref=e107]:
                  - img [ref=e108]
                  - generic [ref=e110]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e111] [cursor=pointer]:
              - /url: /studio/2da2b07c-b6fe-40d0-b545-7676a11ec618
              - generic [ref=e114]: U
              - generic [ref=e115]:
                - heading "Untitled Quilt" [level=3] [ref=e116]
                - generic [ref=e117]:
                  - img [ref=e118]
                  - generic [ref=e120]: Updated Apr 13, 2026
            - link "U Untitled Quilt Updated Apr 13, 2026" [ref=e121] [cursor=pointer]:
              - /url: /studio/322206a7-f1f5-4299-9f5c-992c1a13a9b1
              - generic [ref=e124]: U
              - generic [ref=e125]:
                - heading "Untitled Quilt" [level=3] [ref=e126]
                - generic [ref=e127]:
                  - img [ref=e128]
                  - generic [ref=e130]: Updated Apr 13, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e131] [cursor=pointer]:
              - /url: /studio/b2933476-b34d-4d78-b8d5-62595fbe2915
              - generic [ref=e134]: P
              - generic [ref=e135]:
                - heading "Photo Pattern" [level=3] [ref=e136]
                - generic [ref=e137]:
                  - img [ref=e138]
                  - generic [ref=e140]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e141] [cursor=pointer]:
              - /url: /studio/a65acc2c-6ba6-4e30-8bbc-5e5a38d01e0e
              - generic [ref=e144]: P
              - generic [ref=e145]:
                - heading "Photo Pattern" [level=3] [ref=e146]
                - generic [ref=e147]:
                  - img [ref=e148]
                  - generic [ref=e150]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e151] [cursor=pointer]:
              - /url: /studio/c6dd8009-0e12-405e-bf44-fe535b482b2f
              - generic [ref=e154]: P
              - generic [ref=e155]:
                - heading "Photo Pattern" [level=3] [ref=e156]
                - generic [ref=e157]:
                  - img [ref=e158]
                  - generic [ref=e160]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e161] [cursor=pointer]:
              - /url: /studio/72b32cab-7ee5-4712-8154-a5e3489e1ccc
              - generic [ref=e164]: P
              - generic [ref=e165]:
                - heading "Photo Pattern" [level=3] [ref=e166]
                - generic [ref=e167]:
                  - img [ref=e168]
                  - generic [ref=e170]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e171] [cursor=pointer]:
              - /url: /studio/af940753-3b8e-4be0-beaf-0d8a78ecbdcb
              - generic [ref=e174]: P
              - generic [ref=e175]:
                - heading "Photo Pattern" [level=3] [ref=e176]
                - generic [ref=e177]:
                  - img [ref=e178]
                  - generic [ref=e180]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e181] [cursor=pointer]:
              - /url: /studio/086001bd-b85d-48ea-83e4-fa8ad899acd7
              - generic [ref=e184]: P
              - generic [ref=e185]:
                - heading "Photo Pattern" [level=3] [ref=e186]
                - generic [ref=e187]:
                  - img [ref=e188]
                  - generic [ref=e190]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 11, 2026" [ref=e191] [cursor=pointer]:
              - /url: /studio/6d248ce1-39ea-44d6-b4db-09e4c5c59915
              - generic [ref=e194]: P
              - generic [ref=e195]:
                - heading "Photo Pattern" [level=3] [ref=e196]
                - generic [ref=e197]:
                  - img [ref=e198]
                  - generic [ref=e200]: Updated Apr 11, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e201] [cursor=pointer]:
              - /url: /studio/e3e442f7-4792-4df7-970e-741ec86198e8
              - generic [ref=e204]: P
              - generic [ref=e205]:
                - heading "Photo Pattern" [level=3] [ref=e206]
                - generic [ref=e207]:
                  - img [ref=e208]
                  - generic [ref=e210]: Updated Apr 10, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e211] [cursor=pointer]:
              - /url: /studio/504484fa-efd8-4fa9-801b-02abea1a85f4
              - generic [ref=e214]: P
              - generic [ref=e215]:
                - heading "Photo Pattern" [level=3] [ref=e216]
                - generic [ref=e217]:
                  - img [ref=e218]
                  - generic [ref=e220]: Updated Apr 10, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e221] [cursor=pointer]:
              - /url: /studio/9d971696-9d60-4b65-8072-58d4ab8b8427
              - generic [ref=e224]: P
              - generic [ref=e225]:
                - heading "Photo Pattern" [level=3] [ref=e226]
                - generic [ref=e227]:
                  - img [ref=e228]
                  - generic [ref=e230]: Updated Apr 10, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e231] [cursor=pointer]:
              - /url: /studio/4418bd31-dd14-4f15-8331-30221c44bfb8
              - generic [ref=e234]: P
              - generic [ref=e235]:
                - heading "Photo Pattern" [level=3] [ref=e236]
                - generic [ref=e237]:
                  - img [ref=e238]
                  - generic [ref=e240]: Updated Apr 10, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e241] [cursor=pointer]:
              - /url: /studio/bed132cf-99a2-4160-98c6-44001cd9d042
              - generic [ref=e244]: P
              - generic [ref=e245]:
                - heading "Photo Pattern" [level=3] [ref=e246]
                - generic [ref=e247]:
                  - img [ref=e248]
                  - generic [ref=e250]: Updated Apr 10, 2026
            - link "P Photo Pattern Updated Apr 10, 2026" [ref=e251] [cursor=pointer]:
              - /url: /studio/fff44c3f-d190-4287-b057-9ab2b32e70e3
              - generic [ref=e254]: P
              - generic [ref=e255]:
                - heading "Photo Pattern" [level=3] [ref=e256]
                - generic [ref=e257]:
                  - img [ref=e258]
                  - generic [ref=e260]: Updated Apr 10, 2026
  - generic "Notifications"
  - generic [ref=e265] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e266]:
      - img [ref=e267]
    - generic [ref=e270]:
      - button "Open issues overlay" [ref=e271]:
        - generic [ref=e272]:
          - generic [ref=e273]: "0"
          - generic [ref=e274]: "1"
        - generic [ref=e275]: Issue
      - button "Collapse issues badge" [ref=e276]:
        - img [ref=e277]
  - alert [ref=e279]
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
> 62  |     await page.waitForURL(/signin/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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