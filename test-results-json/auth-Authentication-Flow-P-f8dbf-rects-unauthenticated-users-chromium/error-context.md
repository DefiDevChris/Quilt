# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> Protected Routes Redirect >> settings page redirects unauthenticated users
- Location: tests/e2e/auth.spec.ts:247:9

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
  184 |       await page.getByLabel('Password').fill('short');
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
> 249 |       await page.waitForURL(/auth\/signin|signin/);
      |                  ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
  285 |             email: 'test@example.com',
  286 |             name: 'Test User',
  287 |             role: 'free',
  288 |             isPro: false,
  289 |             isAdmin: false,
  290 |           })
  291 |         );
  292 |       });
  293 | 
  294 |       await page.route('**/api/auth/session', async (route) => {
  295 |         await route.fulfill({
  296 |           status: 200,
  297 |           contentType: 'application/json',
  298 |           body: JSON.stringify({
  299 |             user: {
  300 |               id: 'test-user-123',
  301 |               email: 'test@example.com',
  302 |               role: 'free',
  303 |               isPro: false,
  304 |               isAdmin: false,
  305 |             },
  306 |           }),
  307 |         });
  308 |       });
  309 | 
  310 |       await page.goto('/dashboard');
  311 |       await expect(page).toHaveURL(/dashboard/);
  312 | 
  313 |       // Reload and check still logged in
  314 |       await page.reload();
  315 |       await expect(page).toHaveURL(/dashboard/);
  316 |     });
  317 | 
  318 |     test('logout clears session and redirects', async ({ page }) => {
  319 |       // Mock auth
  320 |       await page.addInitScript(() => {
  321 |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  322 |         localStorage.setItem(
  323 |           'user',
  324 |           JSON.stringify({
  325 |             id: 'test-user-123',
  326 |             email: 'test@example.com',
  327 |             name: 'Test User',
  328 |             role: 'free',
  329 |             isPro: false,
  330 |             isAdmin: false,
  331 |           })
  332 |         );
  333 |       });
  334 | 
  335 |       await page.route('**/api/auth/session', async (route) => {
  336 |         await route.fulfill({
  337 |           status: 200,
  338 |           contentType: 'application/json',
  339 |           body: JSON.stringify({
  340 |             user: {
  341 |               id: 'test-user-123',
  342 |               email: 'test@example.com',
  343 |               role: 'free',
  344 |               isPro: false,
  345 |               isAdmin: false,
  346 |             },
  347 |           }),
  348 |         });
  349 |       });
```