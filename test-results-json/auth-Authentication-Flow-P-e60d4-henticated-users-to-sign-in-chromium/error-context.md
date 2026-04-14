# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication Flow >> Protected Routes Redirect >> dashboard redirects unauthenticated users to sign in
- Location: tests/e2e/auth.spec.ts:230:9

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
            - link "Untitled Quilt just now imperial" [ref=e79] [cursor=pointer]:
              - /url: /studio/60e2c44a-2ce0-44d9-8308-4b18c7196b49
              - img [ref=e81]
              - generic [ref=e92]:
                - paragraph [ref=e93]: Untitled Quilt
                - generic [ref=e94]:
                  - generic [ref=e95]: just now
                  - generic [ref=e96]: imperial
            - link "Untitled Quilt 5m ago imperial" [ref=e97] [cursor=pointer]:
              - /url: /studio/ec2e575f-9017-4925-99f6-0e708b78181e
              - img [ref=e99]
              - generic [ref=e110]:
                - paragraph [ref=e111]: Untitled Quilt
                - generic [ref=e112]:
                  - generic [ref=e113]: 5m ago
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
> 232 |       await page.waitForURL(/auth\/signin|signin/);
      |                  ^ Error: page.waitForURL: Test timeout of 30000ms exceeded.
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
```