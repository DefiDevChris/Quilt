# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> Sign In Page >> sign in page renders correctly
- Location: tests/e2e/auth.spec.ts:20:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel('Password')
Expected: visible
Error: strict mode violation: getByLabel('Password') resolved to 2 elements:
    1) <input value="" required="" id="password" minlength="8" type="password" placeholder="Your password" autocomplete="current-password" class="w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2.5 text-base text-default placeholder:text-dim outline-none transition-colors duration-150 pr-10"/> aka getByRole('textbox', { name: 'Password' })
    2) <button type="button" aria-label="Show password" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-default transition-colors duration-150">…</button> aka getByRole('button', { name: 'Show password' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel('Password')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e3]:
    - generic [ref=e6]:
      - img "QuiltCorgi Mascot" [ref=e8]
      - generic [ref=e9]:
        - link "QuiltCorgi — Back to home" [ref=e10] [cursor=pointer]:
          - /url: /
          - img "QuiltCorgi — Back to home" [ref=e11]
        - generic [ref=e12]: QuiltCorgi
        - heading "Welcome back" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Email
          - textbox "Email" [ref=e17]:
            - /placeholder: you@example.com
        - generic [ref=e18]:
          - generic [ref=e19]:
            - generic [ref=e20]: Password
            - link "Forgot password?" [ref=e21] [cursor=pointer]:
              - /url: /auth/forgot-password
          - generic [ref=e22]:
            - textbox "Password" [ref=e23]:
              - /placeholder: Your password
            - button "Show password" [ref=e24]:
              - img [ref=e25]
        - button "Sign In" [ref=e28]
      - paragraph [ref=e29]:
        - text: Don't have an account?
        - link "Sign up" [ref=e30] [cursor=pointer]:
          - /url: /auth/signup
  - generic "Notifications"
  - generic [ref=e35] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e36]:
      - img [ref=e37]
    - generic [ref=e40]:
      - button "Open issues overlay" [ref=e41]:
        - generic [ref=e42]:
          - generic [ref=e43]: "0"
          - generic [ref=e44]: "1"
        - generic [ref=e45]: Issue
      - button "Collapse issues badge" [ref=e46]:
        - img [ref=e47]
  - alert [ref=e49]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { authenticatedTest, clearSession } from './utils';
  3   | 
  4   | test.describe('Authentication Flow', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     // Clear any session state before each test
  7   |     await page.goto('/');
  8   |     await page.evaluate(() => {
  9   |       // Clear cookies and localStorage
  10  |       document.cookie.split(';').forEach((c) => {
  11  |         document.cookie = c
  12  |           .replace(/^ +/, '')
  13  |           .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  14  |       });
  15  |       localStorage.clear();
  16  |     });
  17  |   });
  18  | 
  19  |   test.describe('Sign In Page', () => {
  20  |     test('sign in page renders correctly', async ({ page }) => {
  21  |       await page.goto('/auth/signin');
  22  | 
  23  |       // Check heading
  24  |       await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');
  25  | 
  26  |       // Check form fields exist
  27  |       await expect(page.getByLabel('Email')).toBeVisible();
> 28  |       await expect(page.getByLabel('Password')).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  29  | 
  30  |       // Check submit button
  31  |       await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  32  | 
  33  |       // Check for logo/navigation
  34  |       await expect(page.getByRole('link', { name: /quiltcorgi/i })).toBeVisible();
  35  |     });
  36  | 
  37  |     test('form validation works', async ({ page }) => {
  38  |       await page.goto('/auth/signin');
  39  | 
  40  |       // Try submitting empty form
  41  |       await page.getByRole('button', { name: 'Sign In' }).click();
  42  | 
  43  |       // Should show validation errors
  44  |       await expect(page.getByText(/email.*required|required/i).first()).toBeVisible();
  45  |     });
  46  | 
  47  |     test('shows error with invalid credentials', async ({ page }) => {
  48  |       await page.goto('/auth/signin');
  49  | 
  50  |       await page.getByLabel('Email').fill('invalid@test.com');
  51  |       await page.getByLabel('Password').fill('wrongpassword');
  52  |       await page.getByRole('button', { name: 'Sign In' }).click();
  53  | 
  54  |       // Wait for error message
  55  |       await expect(page.getByText(/invalid credentials|failed|incorrect/i)).toBeVisible({
  56  |         timeout: 10000,
  57  |       });
  58  |     });
  59  | 
  60  |     test('has link to sign up page', async ({ page }) => {
  61  |       await page.goto('/auth/signin');
  62  | 
  63  |       const signUpLink = page.getByRole('link', { name: 'Sign up' });
  64  |       await expect(signUpLink).toBeVisible();
  65  |       await expect(signUpLink).toHaveAttribute('href', '/auth/signup');
  66  |     });
  67  | 
  68  |     test('has link to forgot password', async ({ page }) => {
  69  |       await page.goto('/auth/signin');
  70  | 
  71  |       const forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
  72  |       await expect(forgotPasswordLink).toBeVisible();
  73  |       await expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
  74  |     });
  75  | 
  76  |     test('password visibility toggle works', async ({ page }) => {
  77  |       await page.goto('/auth/signin');
  78  | 
  79  |       const passwordInput = page.getByLabel('Password');
  80  | 
  81  |       // Initially password should be hidden
  82  |       await expect(passwordInput).toHaveAttribute('type', 'password');
  83  | 
  84  |       // Click toggle button
  85  |       await page.getByLabel('Show password').click();
  86  | 
  87  |       // Password should now be visible
  88  |       await expect(passwordInput).toHaveAttribute('type', 'text');
  89  | 
  90  |       // Toggle back
  91  |       await page.getByLabel('Hide password').click();
  92  |       await expect(passwordInput).toHaveAttribute('type', 'password');
  93  |     });
  94  | 
  95  |     test('successful sign in redirects to dashboard', async ({ page }) => {
  96  |       // Mock auth before sign in
  97  |       await page.addInitScript(() => {
  98  |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  99  |         localStorage.setItem(
  100 |           'user',
  101 |           JSON.stringify({
  102 |             id: 'test-user-123',
  103 |             email: 'test@example.com',
  104 |             name: 'Test User',
  105 |             role: 'free',
  106 |             isPro: false,
  107 |             isAdmin: false,
  108 |           })
  109 |         );
  110 |       });
  111 | 
  112 |       await page.route('**/api/auth/session', async (route) => {
  113 |         await route.fulfill({
  114 |           status: 200,
  115 |           contentType: 'application/json',
  116 |           body: JSON.stringify({
  117 |             user: {
  118 |               id: 'test-user-123',
  119 |               email: 'test@example.com',
  120 |               role: 'free',
  121 |               isPro: false,
  122 |               isAdmin: false,
  123 |             },
  124 |           }),
  125 |         });
  126 |       });
  127 | 
  128 |       await page.goto('/auth/signin');
```