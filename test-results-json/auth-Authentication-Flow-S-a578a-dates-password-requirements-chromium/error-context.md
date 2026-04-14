# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> Sign Up Page >> validates password requirements
- Location: tests/e2e/auth.spec.ts:179:9

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Password') resolved to 2 elements:
    1) <input value="" required="" id="password" minlength="8" type="password" autocomplete="new-password" placeholder="At least 8 characters" class="w-full bg-default border-b border-default focus:border-primary rounded-lg px-3 py-2.5 text-base text-default placeholder:text-dim outline-none transition-colors duration-150 pr-10"/> aka getByRole('textbox', { name: 'Password' })
    2) <button type="button" aria-label="Show password" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-dim hover:text-default transition-colors duration-150">…</button> aka getByRole('button', { name: 'Show password' })

Call log:
  - waiting for getByLabel('Password')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - heading "Create your account" [level=1] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Name
          - textbox "Name" [ref=e17]:
            - /placeholder: Your name
            - text: Test User
        - generic [ref=e18]:
          - generic [ref=e19]: Email
          - textbox "Email" [active] [ref=e20]:
            - /placeholder: you@example.com
            - text: test@example.com
        - generic [ref=e21]:
          - generic [ref=e23]: Password
          - generic [ref=e24]:
            - textbox "Password" [ref=e25]:
              - /placeholder: At least 8 characters
            - button "Show password" [ref=e26]:
              - img [ref=e27]
          - paragraph [ref=e30]: Must include uppercase, lowercase, and numbers
        - button "Create Account" [ref=e31]
      - paragraph [ref=e32]:
        - text: Already have an account?
        - link "Sign in" [ref=e33] [cursor=pointer]:
          - /url: /auth/signin
  - generic "Notifications"
  - generic [ref=e38] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e39]:
      - img [ref=e40]
    - generic [ref=e43]:
      - button "Open issues overlay" [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: "0"
          - generic [ref=e47]: "1"
        - generic [ref=e48]: Issue
      - button "Collapse issues badge" [ref=e49]:
        - img [ref=e50]
  - alert [ref=e52]
```

# Test source

```ts
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
  129 |       await page.getByLabel('Email').fill('test@example.com');
  130 |       await page.getByLabel('Password').fill('testpassword123');
  131 |       await page.getByRole('button', { name: 'Sign In' }).click();
  132 | 
  133 |       // Should redirect to dashboard
  134 |       await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  135 |     });
  136 |   });
  137 | 
  138 |   test.describe('Sign Up Page', () => {
  139 |     test('sign up page renders correctly', async ({ page }) => {
  140 |       await page.goto('/auth/signup');
  141 | 
  142 |       // Check heading
  143 |       await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');
  144 | 
  145 |       // Check form fields exist
  146 |       await expect(page.getByLabel('Name')).toBeVisible();
  147 |       await expect(page.getByLabel('Email')).toBeVisible();
  148 |       await expect(page.getByLabel('Password')).toBeVisible();
  149 | 
  150 |       // Check submit button
  151 |       await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  152 | 
  153 |       // Check terms/conditions if present
  154 |       const termsCheckbox = page.getByLabel(/terms|conditions|agree/i);
  155 |       if (await termsCheckbox.isVisible()) {
  156 |         await expect(termsCheckbox).toBeVisible();
  157 |       }
  158 |     });
  159 | 
  160 |     test('has link to sign in page', async ({ page }) => {
  161 |       await page.goto('/auth/signup');
  162 | 
  163 |       const signInLink = page.getByRole('link', { name: 'Sign in' });
  164 |       await expect(signInLink).toBeVisible();
  165 |       await expect(signInLink).toHaveAttribute('href', '/auth/signin');
  166 |     });
  167 | 
  168 |     test('validates required fields', async ({ page }) => {
  169 |       await page.goto('/auth/signup');
  170 | 
  171 |       // Try submitting empty form
  172 |       await page.getByRole('button', { name: 'Create Account' }).click();
  173 | 
  174 |       // Should show validation errors for required fields
  175 |       await expect(page.getByText(/name.*required|required.*name/i).first()).toBeVisible();
  176 |       await expect(page.getByText(/email.*required|required.*email/i).first()).toBeVisible();
  177 |     });
  178 | 
  179 |     test('validates password requirements', async ({ page }) => {
  180 |       await page.goto('/auth/signup');
  181 | 
  182 |       await page.getByLabel('Name').fill('Test User');
  183 |       await page.getByLabel('Email').fill('test@example.com');
> 184 |       await page.getByLabel('Password').fill('short');
      |                                         ^ Error: locator.fill: Error: strict mode violation: getByLabel('Password') resolved to 2 elements:
  185 |       await page.getByRole('button', { name: 'Create Account' }).click();
  186 | 
  187 |       // Should show error about password length
  188 |       await expect(page.getByText(/at least 8 characters|password.*length/i)).toBeVisible();
  189 |     });
  190 | 
  191 |     test('validates email format', async ({ page }) => {
  192 |       await page.goto('/auth/signup');
  193 | 
  194 |       await page.getByLabel('Name').fill('Test User');
  195 |       await page.getByLabel('Email').fill('invalid-email');
  196 |       await page.getByLabel('Password').fill('validpassword123');
  197 |       await page.getByRole('button', { name: 'Create Account' }).click();
  198 | 
  199 |       // Should show error about email format
  200 |       await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
  201 |     });
  202 | 
  203 |     test('password confirmation validation', async ({ page }) => {
  204 |       await page.goto('/auth/signup');
  205 | 
  206 |       const confirmPasswordInput = page.getByLabel(/confirm.*password|repeat.*password/i);
  207 |       if (await confirmPasswordInput.isVisible()) {
  208 |         await page.getByLabel('Name').fill('Test User');
  209 |         await page.getByLabel('Email').fill('test@example.com');
  210 |         await page.getByLabel('Password').fill('validpassword123');
  211 |         await confirmPasswordInput.fill('differentpassword');
  212 |         await page.getByRole('button', { name: 'Create Account' }).click();
  213 | 
  214 |         // Should show password mismatch error
  215 |         await expect(page.getByText(/password.*match|match.*password/i)).toBeVisible();
  216 |       }
  217 |     });
  218 |   });
  219 | 
  220 |   test.describe('Forgot Password', () => {
  221 |     test('forgot password page loads', async ({ page }) => {
  222 |       await page.goto('/auth/forgot-password');
  223 | 
  224 |       await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  225 |       await expect(page.getByLabel('Email')).toBeVisible();
  226 |     });
  227 |   });
  228 | 
  229 |   test.describe('Protected Routes Redirect', () => {
  230 |     test('dashboard redirects unauthenticated users to sign in', async ({ page }) => {
  231 |       await page.goto('/dashboard');
  232 |       await page.waitForURL(/auth\/signin|signin/);
  233 |       expect(page.url()).toContain('signin');
  234 |     });
  235 | 
  236 |     test('studio redirects unauthenticated users to sign in', async ({ page }) => {
  237 |       await page.goto('/studio/test-project');
  238 |       await page.waitForURL(/auth\/signin|signin/);
  239 |       expect(page.url()).toContain('signin');
  240 |     });
  241 | 
  242 |     test('projects page redirects unauthenticated users', async ({ page }) => {
  243 |       await page.goto('/projects');
  244 |       await page.waitForURL(/auth\/signin|signin/);
  245 |     });
  246 | 
  247 |     test('settings page redirects unauthenticated users', async ({ page }) => {
  248 |       await page.goto('/settings');
  249 |       await page.waitForURL(/auth\/signin|signin/);
  250 |     });
  251 |   });
  252 | });
  253 | 
  254 | test.describe('Navigation and Links', () => {
  255 |   test('landing page has navigation links to auth', async ({ page }) => {
  256 |     await page.goto('/');
  257 | 
  258 |     // Check main CTA links to signup
  259 |     const ctaLink = page.getByRole('link', { name: /start designing free|get started/i }).first();
  260 |     await expect(ctaLink).toBeVisible();
  261 |     await expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  262 |   });
  263 | 
  264 |   test('logo returns to home from auth pages', async ({ page }) => {
  265 |     await page.goto('/auth/signin');
  266 | 
  267 |     // Find and click the logo link
  268 |     const logoLink = page.getByRole('link', { name: /quiltcorgi.*back to home|logo/i }).first();
  269 |     await logoLink.click();
  270 | 
  271 |     await expect(page).toHaveURL('/');
  272 |   });
  273 | });
  274 | 
  275 | test.describe('Authenticated User Flows', () => {
  276 |   test.describe('Session Management', () => {
  277 |     test('authenticated user stays logged in', async ({ page }) => {
  278 |       // Mock auth
  279 |       await page.addInitScript(() => {
  280 |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  281 |         localStorage.setItem(
  282 |           'user',
  283 |           JSON.stringify({
  284 |             id: 'test-user-123',
```