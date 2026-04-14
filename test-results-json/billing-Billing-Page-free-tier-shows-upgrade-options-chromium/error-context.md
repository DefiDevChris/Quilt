# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing.spec.ts >> Billing Page >> free tier shows upgrade options
- Location: tests/e2e/billing.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/upgrade to pro|upgrade/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/upgrade to pro|upgrade/i)

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
  2   | import { mockAuth, mockCanvas, mockProject } from './utils';
  3   | 
  4   | test.describe('Billing Page', () => {
  5   |   test('billing page loads for authenticated users', async ({ page }) => {
  6   |     await mockAuth(page, 'free');
  7   |     await page.goto('/profile');
  8   |     await expect(page.getByText(/billing|subscription|upgrade/i)).toBeVisible();
  9   |   });
  10  | 
  11  |   test('free tier shows upgrade options', async ({ page }) => {
  12  |     await mockAuth(page, 'free');
  13  |     await page.goto('/profile');
> 14  |     await expect(page.getByText(/upgrade to pro|upgrade/i)).toBeVisible();
      |                                                             ^ Error: expect(locator).toBeVisible() failed
  15  |   });
  16  | 
  17  |   test('pro tier shows subscription details', async ({ page }) => {
  18  |     await mockAuth(page, 'pro');
  19  |     await page.goto('/profile');
  20  |     await expect(page.getByText(/subscription|pro|active/i)).toBeVisible();
  21  |   });
  22  | });
  23  | 
  24  | test.describe('Subscription Management', () => {
  25  |   test.beforeEach(async ({ page }) => {
  26  |     await mockAuth(page, 'pro');
  27  |     await page.route('**/api/stripe/subscription', async (route) => {
  28  |       await route.fulfill({
  29  |         status: 200,
  30  |         contentType: 'application/json',
  31  |         body: JSON.stringify({
  32  |           status: 'active',
  33  |           plan: 'pro',
  34  |           currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  35  |         }),
  36  |       });
  37  |     });
  38  |   });
  39  | 
  40  |   test('can view subscription status', async ({ page }) => {
  41  |     await page.goto('/profile');
  42  |     await expect(page.getByText(/active|subscription|pro/i)).toBeVisible();
  43  |   });
  44  | 
  45  |   test('can view billing history', async ({ page }) => {
  46  |     await page.goto('/profile');
  47  |     const historyButton = page.getByRole('button', { name: /billing history|history/i });
  48  |     if (await historyButton.isVisible()) {
  49  |       await historyButton.click();
  50  |       await expect(page.getByText(/invoice|payment|billing/i)).toBeVisible();
  51  |     }
  52  |   });
  53  | 
  54  |   test('can update payment method', async ({ page }) => {
  55  |     await page.goto('/profile');
  56  |     const updateButton = page.getByRole('button', { name: /update payment|payment method/i });
  57  |     if (await updateButton.isVisible()) {
  58  |       await updateButton.click();
  59  |       await expect(page.getByText(/card|payment|stripe/i)).toBeVisible();
  60  |     }
  61  |   });
  62  | 
  63  |   test('can cancel subscription', async ({ page }) => {
  64  |     await page.goto('/profile');
  65  |     const cancelButton = page.getByRole('button', { name: /cancel subscription|cancel/i });
  66  |     if (await cancelButton.isVisible()) {
  67  |       await cancelButton.click();
  68  |       await expect(page.getByText(/confirm|cancel/i)).toBeVisible();
  69  |     }
  70  |   });
  71  | });
  72  | 
  73  | test.describe('Upgrade Flow', () => {
  74  |   test.beforeEach(async ({ page }) => {
  75  |     await mockAuth(page, 'free');
  76  |     await page.route('**/api/stripe/checkout', async (route) => {
  77  |       await route.fulfill({
  78  |         status: 200,
  79  |         contentType: 'application/json',
  80  |         body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
  81  |       });
  82  |     });
  83  |   });
  84  | 
  85  |   test('upgrade button opens checkout', async ({ page }) => {
  86  |     await page.goto('/profile');
  87  |     const upgradeButton = page.getByRole('button', { name: /upgrade to pro|upgrade/i });
  88  |     if (await upgradeButton.isVisible()) {
  89  |       await upgradeButton.click();
  90  |     }
  91  |   });
  92  | 
  93  |   test('monthly plan option is available', async ({ page }) => {
  94  |     await page.goto('/profile');
  95  |     await expect(page.getByText(/month|monthly|\$/i)).toBeVisible();
  96  |   });
  97  | 
  98  |   test('annual plan option is available', async ({ page }) => {
  99  |     await page.goto('/profile');
  100 |     await expect(page.getByText(/year|annual|\$/i)).toBeVisible();
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Pro Feature Gates', () => {
  105 |   test('free users see upgrade prompt for pro features', async ({ page }) => {
  106 |     await mockAuth(page, 'free');
  107 |     await mockCanvas(page);
  108 |     await mockProject(page, 'test-project-1');
  109 |     await page.goto('/studio/test-project-1');
  110 |     await page.waitForTimeout(2000);
  111 | 
  112 |     // Try to access pro feature - export is typically pro
  113 |     const exportButton = page.getByRole('button', { name: /export/i });
  114 |     if (await exportButton.isVisible()) {
```