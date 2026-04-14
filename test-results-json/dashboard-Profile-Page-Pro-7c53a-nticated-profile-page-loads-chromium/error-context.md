# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Profile Page >> Profile Page (Authenticated) >> profile page loads
- Location: tests/e2e/dashboard.spec.ts:139:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/profile|my profile/i)
Expected: visible
Error: strict mode violation: getByText(/profile|my profile/i) resolved to 2 elements:
    1) <p class="text-dim text-[18px] leading-[28px] font-normal">Manage your profile, billing, and account.</p> aka getByText('Manage your profile, billing')
    2) <p class="text-[16px] leading-[24px] text-[var(--color-text-dim)] max-w-xl">This will permanently remove all your projects, f…</p> aka getByText('This will permanently remove')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/profile|my profile/i)

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
      - generic [ref=e20]:
        - generic [ref=e23]:
          - paragraph [ref=e26]: Account
          - heading "Settings" [level=1] [ref=e27]
          - paragraph [ref=e28]: Manage your profile, billing, and account.
        - generic [ref=e30]:
          - paragraph [ref=e32]: Signed out
          - separator [ref=e33]
          - separator [ref=e34]
          - generic [ref=e35]:
            - generic [ref=e38]:
              - paragraph [ref=e39]: Account Settings
              - heading "Delete Account" [level=2] [ref=e40]
            - generic [ref=e42]:
              - img [ref=e44]
              - generic [ref=e47]:
                - generic [ref=e48]:
                  - heading "Request Account Deletion" [level=3] [ref=e49]
                  - paragraph [ref=e50]: This will permanently remove all your projects, fabric archives, community designs, and profile data. This action cannot be undone.
                - button "Request Account Deletion" [ref=e51]:
                  - img [ref=e52]
                  - text: Request Account Deletion
  - generic "Notifications"
  - generic [ref=e59] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e60]:
      - img [ref=e61]
    - generic [ref=e64]:
      - button "Open issues overlay" [ref=e65]:
        - generic [ref=e66]:
          - generic [ref=e67]: "0"
          - generic [ref=e68]: "1"
        - generic [ref=e69]: Issue
      - button "Collapse issues badge" [ref=e70]:
        - img [ref=e71]
  - alert [ref=e73]
```

# Test source

```ts
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
> 141 |       await expect(page.getByText(/profile|my profile/i)).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
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