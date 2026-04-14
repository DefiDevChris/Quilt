# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Authenticated Settings >> settings page loads
- Location: tests/e2e/authenticated.spec.ts:54:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/profile|settings/i)
Expected: visible
Error: strict mode violation: getByText(/profile|settings/i) resolved to 4 elements:
    1) <h1 class="text-default text-[40px] leading-[52px] font-normal">Settings</h1> aka getByRole('heading', { name: 'Settings' })
    2) <p class="text-dim text-[18px] leading-[28px] font-normal">Manage your profile, billing, and account.</p> aka getByText('Manage your profile, billing')
    3) <p class="text-[14px] leading-[20px] mb-1">Account Settings</p> aka getByText('Account Settings')
    4) <p class="text-[16px] leading-[24px] text-[var(--color-text-dim)] max-w-xl">This will permanently remove all your projects, f…</p> aka getByText('This will permanently remove')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/profile|settings/i)

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
  1   | import { test, expect } from '@playwright/test';
  2   | import { mockAuth, mockCanvas } from './utils';
  3   | 
  4   | test.describe('Authenticated Dashboard', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await mockAuth(page, 'pro');
  7   |   });
  8   | 
  9   |   test('dashboard loads bento grid', async ({ page }) => {
  10  |     await page.goto('/dashboard');
  11  |     await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
  12  |   });
  13  | 
  14  |   test('new design card is clickable', async ({ page }) => {
  15  |     await page.goto('/dashboard');
  16  |     const newDesignCard = page.getByText(/new design/i);
  17  |     await expect(newDesignCard).toBeVisible({ timeout: 10000 });
  18  |   });
  19  | 
  20  |   test('photo to design card is visible', async ({ page }) => {
  21  |     await page.goto('/dashboard');
  22  |     const photoCard = page.getByText(/photo to design/i);
  23  |     if (await photoCard.isVisible()) {
  24  |       await expect(photoCard).toBeVisible();
  25  |     }
  26  |   });
  27  | });
  28  | 
  29  | test.describe('Authenticated Projects', () => {
  30  |   test.beforeEach(async ({ page }) => {
  31  |     await mockAuth(page, 'pro');
  32  |   });
  33  | 
  34  |   test('projects page loads with search', async ({ page }) => {
  35  |     await page.goto('/projects');
  36  |     const searchInput = page.getByPlaceholder(/search/i);
  37  |     await expect(searchInput).toBeVisible({ timeout: 10000 });
  38  |   });
  39  | 
  40  |   test('new project button exists', async ({ page }) => {
  41  |     await page.goto('/projects');
  42  |     const newButton = page.getByRole('button', { name: /new project/i });
  43  |     if (await newButton.isVisible()) {
  44  |       await expect(newButton).toBeVisible();
  45  |     }
  46  |   });
  47  | });
  48  | 
  49  | test.describe('Authenticated Settings', () => {
  50  |   test.beforeEach(async ({ page }) => {
  51  |     await mockAuth(page, 'pro');
  52  |   });
  53  | 
  54  |   test('settings page loads', async ({ page }) => {
  55  |     await page.goto('/settings');
> 56  |     await expect(page.getByText(/profile|settings/i)).toBeVisible({ timeout: 10000 });
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  57  |   });
  58  | 
  59  |   test('delete account section exists', async ({ page }) => {
  60  |     await page.goto('/settings');
  61  |     const deleteSection = page.getByText(/delete account/i);
  62  |     if (await deleteSection.isVisible()) {
  63  |       await expect(deleteSection).toBeVisible();
  64  |     }
  65  |   });
  66  | });
  67  | 
  68  | test.describe('Pro User Features', () => {
  69  |   test.beforeEach(async ({ page }) => {
  70  |     await mockAuth(page, 'pro');
  71  |     await mockCanvas(page);
  72  |   });
  73  | 
  74  |   test('pro user can access studio', async ({ page }) => {
  75  |     await page.goto('/studio/test-project-1');
  76  |     const canvas = page.locator('canvas');
  77  |     await expect(canvas).toBeVisible({ timeout: 10000 });
  78  |   });
  79  | 
  80  |   test('pro user sees billing section', async ({ page }) => {
  81  |     await page.goto('/profile');
  82  |     const billing = page.getByText(/billing|subscription/i);
  83  |     if (await billing.isVisible()) {
  84  |       await expect(billing).toBeVisible();
  85  |     }
  86  |   });
  87  | });
  88  | 
  89  | test.describe('Free User Limits', () => {
  90  |   test.beforeEach(async ({ page }) => {
  91  |     await mockAuth(page, 'free');
  92  |   });
  93  | 
  94  |   test('free user sees upgrade prompts', async ({ page }) => {
  95  |     await page.goto('/profile');
  96  |     const upgrade = page.getByText(/upgrade to pro/i);
  97  |     if (await upgrade.isVisible()) {
  98  |       await expect(upgrade).toBeVisible();
  99  |     }
  100 |   });
  101 | });
  102 | 
  103 | test.describe('Admin Features', () => {
  104 |   test.beforeEach(async ({ page }) => {
  105 |     await mockAuth(page, 'admin');
  106 |   });
  107 | 
  108 |   test('admin can access admin page', async ({ page }) => {
  109 |     await page.goto('/admin');
  110 |     const adminContent = page.getByText(/admin|moderation/i);
  111 |     await expect(adminContent).toBeVisible({ timeout: 10000 });
  112 |   });
  113 | 
  114 |   test('admin can access moderation', async ({ page }) => {
  115 |     await page.goto('/admin/moderation');
  116 |     const modContent = page.getByText(/moderation|posts/i);
  117 |     await expect(modContent).toBeVisible({ timeout: 10000 });
  118 |   });
  119 | });
  120 | 
  121 | test.describe('Canvas Operations', () => {
  122 |   test.beforeEach(async ({ page }) => {
  123 |     await mockAuth(page, 'pro');
  124 |     await mockCanvas(page);
  125 |   });
  126 | 
  127 |   test('canvas keyboard shortcuts work', async ({ page }) => {
  128 |     await page.goto('/studio/test-project-1');
  129 |     await page.waitForTimeout(2000);
  130 |     await page.keyboard.press('Control+Z');
  131 |     await page.keyboard.press('Control+Y');
  132 |     await page.keyboard.press('Control+A');
  133 |   });
  134 | 
  135 |   test('canvas zoom controls exist', async ({ page }) => {
  136 |     await page.goto('/studio/test-project-1');
  137 |     const zoomIn = page.getByRole('button', { name: /zoom in/i });
  138 |     const zoomOut = page.getByRole('button', { name: /zoom out/i });
  139 |     if (await zoomIn.isVisible()) {
  140 |       await expect(zoomIn).toBeVisible();
  141 |     }
  142 |     if (await zoomOut.isVisible()) {
  143 |       await expect(zoomOut).toBeVisible();
  144 |     }
  145 |   });
  146 | });
  147 | 
  148 | test.describe('Worktable Operations', () => {
  149 |   test.beforeEach(async ({ page }) => {
  150 |     await mockAuth(page, 'pro');
  151 |     await mockCanvas(page);
  152 |   });
  153 | 
  154 |   test('worktable tabs are visible', async ({ page }) => {
  155 |     await page.goto('/studio/test-project-1');
  156 |     await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
```