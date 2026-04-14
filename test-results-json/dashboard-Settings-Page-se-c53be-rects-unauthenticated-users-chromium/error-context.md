# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Settings Page >> settings page redirects unauthenticated users
- Location: tests/e2e/dashboard.spec.ts:104:7

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
      - generic [ref=e21]:
        - generic [ref=e24]:
          - paragraph [ref=e27]: Account
          - heading "Settings" [level=1] [ref=e28]
          - paragraph [ref=e29]: Manage your profile, billing, and account.
        - generic [ref=e31]:
          - generic [ref=e32]:
            - generic [ref=e33]:
              - paragraph [ref=e34]: Your Profile
              - generic [ref=e35]:
                - generic [ref=e37] [cursor=pointer]:
                  - generic [ref=e39]: "?"
                  - img [ref=e41]
                - generic [ref=e43]:
                  - paragraph [ref=e44]: Profile Photo
                  - paragraph [ref=e45]: Click to update your photo
              - generic [ref=e46]:
                - generic [ref=e47]:
                  - generic [ref=e48]: Display Name
                  - textbox "Your name" [ref=e49]
                - generic [ref=e50]:
                  - generic [ref=e51]: Location
                  - textbox "City, Region" [ref=e52]
              - generic [ref=e53]:
                - generic [ref=e54]:
                  - generic [ref=e55]: About You
                  - generic [ref=e56]: 0/500
                - textbox "Tell the community about your quilting journey..." [ref=e57]
            - generic [ref=e58]:
              - paragraph [ref=e59]: Visibility
              - generic [ref=e60]:
                - button "Open Studio Share designs with the community and collaborate on ideas." [ref=e61]:
                  - generic [ref=e62]: Open Studio
                  - generic [ref=e63]: Share designs with the community and collaborate on ideas.
                - button "Private Workshop Keep your designs private. Focus on personal projects." [ref=e64]:
                  - generic [ref=e65]: Private Workshop
                  - generic [ref=e66]: Keep your designs private. Focus on personal projects.
            - generic [ref=e67]:
              - paragraph [ref=e68]: Connections
              - generic [ref=e69]:
                - generic [ref=e70]:
                  - generic [ref=e71]: Website
                  - textbox "https://..." [ref=e72]
                - generic [ref=e73]:
                  - generic [ref=e74]: Instagram
                  - textbox "@handle" [ref=e75]
                - generic [ref=e76]:
                  - generic [ref=e77]: YouTube
                  - textbox "Channel" [ref=e78]
                - generic [ref=e79]:
                  - generic [ref=e80]: TikTok
                  - textbox "@handle" [ref=e81]
                - generic [ref=e83]:
                  - generic [ref=e84]: Public Email
                  - textbox "connect@example.com" [ref=e85]
            - button "Save Profile" [ref=e87]
          - separator [ref=e88]
          - generic [ref=e89]:
            - generic [ref=e90]:
              - paragraph [ref=e91]: Studio Access
              - heading "Licensing & Plans" [level=2] [ref=e92]
            - generic [ref=e93]:
              - generic [ref=e94]:
                - generic [ref=e95]:
                  - paragraph [ref=e96]: Current Membership
                  - generic [ref=e98]: Pro Member
                - button "Manage Subscription" [ref=e100]
              - generic [ref=e101]:
                - generic [ref=e102]:
                  - paragraph [ref=e103]: Next Billing Cycle
                  - paragraph [ref=e104]: Invalid Date
                - generic [ref=e105]: active
            - generic [ref=e106]:
              - generic [ref=e107]:
                - generic [ref=e108]:
                  - paragraph [ref=e109]: Free Plan
                  - heading "Standard Access" [level=4] [ref=e110]
                - list [ref=e111]:
                  - listitem [ref=e112]: Design Studio with core tools
                  - listitem [ref=e114]: 20 essential layout blocks
                  - listitem [ref=e116]: 10 curated fabric swatches
                  - listitem [ref=e118]: Community thread access
                  - listitem [ref=e120]: Local project storage
                  - listitem [ref=e122]:
                    - generic [ref=e124]: Unlimited projects
                  - listitem [ref=e125]:
                    - generic [ref=e127]: High-resolution exports
                  - listitem [ref=e128]:
                    - generic [ref=e130]: Full 2,700+ fabric library
              - generic [ref=e131]:
                - generic [ref=e132]:
                  - paragraph [ref=e133]: Pro Plan
                  - heading "Pro Collective" [level=4] [ref=e134]
                - list [ref=e135]:
                  - listitem [ref=e136]: "Everything in Free, plus:"
                  - listitem [ref=e137]: Unlimited project storage
                  - listitem [ref=e139]: Complete 50-block library + custom blocks
                  - listitem [ref=e141]: Full 2,700+ fabric library + custom uploads
                  - listitem [ref=e143]: SVG, PDF, & high-resolution PNG exports
                  - listitem [ref=e145]: Photo-to-Design pipeline
                  - listitem [ref=e147]: Print-ready 1:1 scale PDF patterns
                  - listitem [ref=e149]: Server-side project sync
          - separator [ref=e151]
          - generic [ref=e152]:
            - generic [ref=e155]:
              - paragraph [ref=e156]: Account Settings
              - heading "Delete Account" [level=2] [ref=e157]
            - generic [ref=e159]:
              - img [ref=e161]
              - generic [ref=e164]:
                - generic [ref=e165]:
                  - heading "Request Account Deletion" [level=3] [ref=e166]
                  - paragraph [ref=e167]: This will permanently remove all your projects, fabric archives, community designs, and profile data. This action cannot be undone.
                - button "Request Account Deletion" [ref=e168]:
                  - img [ref=e169]
                  - text: Request Account Deletion
  - generic "Notifications"
  - generic [ref=e176] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e177]:
      - img [ref=e178]
    - generic [ref=e181]:
      - button "Open issues overlay" [ref=e182]:
        - generic [ref=e183]:
          - generic [ref=e184]: "0"
          - generic [ref=e185]: "1"
        - generic [ref=e186]: Issue
      - button "Collapse issues badge" [ref=e187]:
        - img [ref=e188]
  - alert [ref=e190]
```

# Test source

```ts
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
  98  |       await expect(page.getByRole('button', { name: /new project|new design/i })).toBeVisible();
  99  |     });
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Settings Page', () => {
  104 |   test('settings page redirects unauthenticated users', async ({ page }) => {
  105 |     await page.goto('/settings');
> 106 |     await page.waitForURL(/signin/);
      |                ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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