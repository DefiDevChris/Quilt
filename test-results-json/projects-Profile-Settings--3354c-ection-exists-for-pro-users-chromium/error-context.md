# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: projects.spec.ts >> Profile & Settings >> billing section exists for pro users
- Location: tests/e2e/projects.spec.ts:334:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/billing|subscription|pro/i)
Expected: visible
Error: strict mode violation: getByText(/billing|subscription|pro/i) resolved to 2 elements:
    1) <p class="text-dim text-[18px] leading-[28px] font-normal">Manage your profile, billing, and account.</p> aka getByText('Manage your profile, billing')
    2) <p class="text-[16px] leading-[24px] text-[var(--color-text-dim)] max-w-xl">This will permanently remove all your projects, f…</p> aka getByText('This will permanently remove')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/billing|subscription|pro/i)

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
  236 |   });
  237 | 
  238 |   test('project renaming works', async ({ page }) => {
  239 |     await page.goto('/projects');
  240 |     const actionMenu = page.locator('[aria-label*="actions"], button:has(svg)').first();
  241 |     if (await actionMenu.isVisible()) {
  242 |       await actionMenu.click();
  243 |       const renameButton = page.getByRole('menuitem', { name: /rename/i }).or(page.getByText(/rename/i));
  244 |       if (await renameButton.isVisible()) {
  245 |         await renameButton.click();
  246 |         const nameInput = page.getByLabel(/new.*name|project.*name|name/i);
  247 |         if (await nameInput.isVisible()) {
  248 |           await nameInput.fill('Renamed Project');
  249 |           await nameInput.press('Enter');
  250 |           await expect(page.getByText(/renamed|updated|success/i)).toBeVisible();
  251 |         }
  252 |       }
  253 |     }
  254 |   });
  255 | 
  256 |   test('project deletion works', async ({ page }) => {
  257 |     await page.route('**/api/projects/test-project-delete', async (route) => {
  258 |       if (route.request().method() === 'DELETE') {
  259 |         await route.fulfill({
  260 |           status: 200,
  261 |           body: JSON.stringify({ success: true }),
  262 |         });
  263 |       } else {
  264 |         await route.fulfill({
  265 |           status: 200,
  266 |           body: JSON.stringify({ id: 'test-project-delete', name: 'Delete Me' }),
  267 |         });
  268 |       }
  269 |     });
  270 |     await page.goto('/projects');
  271 |     const actionMenu = page.locator('[aria-label*="actions"], button:has(svg)').first();
  272 |     if (await actionMenu.isVisible()) {
  273 |       await actionMenu.click();
  274 |       const deleteButton = page.getByRole('menuitem', { name: /delete/i }).or(page.getByText(/delete/i));
  275 |       if (await deleteButton.isVisible()) {
  276 |         await deleteButton.click();
  277 |         const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
  278 |         if (await confirmButton.isVisible()) {
  279 |           await confirmButton.click();
  280 |           await expect(page.getByText(/deleted|success/i)).toBeVisible();
  281 |         }
  282 |       }
  283 |     }
  284 |   });
  285 | 
  286 |   test('bulk project selection works', async ({ page }) => {
  287 |     await page.goto('/projects');
  288 |     const checkboxes = page.getByRole('checkbox');
  289 |     if ((await checkboxes.count()) > 1) {
  290 |       await checkboxes.first().check();
  291 |       await expect(page.getByText(/selected|bulk.*actions/i).first()).toBeVisible();
  292 |     }
  293 |   });
  294 | });
  295 | 
  296 | test.describe('Profile & Settings', () => {
  297 |   test.beforeEach(async ({ page }) => {
  298 |     await mockAuth(page, 'pro');
  299 |   });
  300 | 
  301 |   test('profile link navigates to profile page', async ({ page }) => {
  302 |     await page.goto('/dashboard');
  303 |     const profileLink = page.getByRole('link', { name: /profile/i }).first();
  304 |     if (await profileLink.isVisible()) {
  305 |       await profileLink.click();
  306 |       await expect(page).toHaveURL('/profile');
  307 |     }
  308 |   });
  309 | 
  310 |   test('settings link navigates to settings page', async ({ page }) => {
  311 |     await page.goto('/dashboard');
  312 |     const settingsLink = page.getByRole('link', { name: /settings/i }).first();
  313 |     if (await settingsLink.isVisible()) {
  314 |       await settingsLink.click();
  315 |       await expect(page).toHaveURL('/settings');
  316 |     }
  317 |   });
  318 | 
  319 |   test('settings page loads', async ({ page }) => {
  320 |     await page.goto('/settings');
  321 |     await expect(page.getByText(/settings|profile|account/i)).toBeVisible();
  322 |   });
  323 | 
  324 |   test('delete account section exists', async ({ page }) => {
  325 |     await page.goto('/settings');
  326 |     await expect(page.getByText(/delete account|danger zone/i)).toBeVisible();
  327 |   });
  328 | 
  329 |   test('profile page loads', async ({ page }) => {
  330 |     await page.goto('/profile');
  331 |     await expect(page.getByText(/profile|my profile/i)).toBeVisible();
  332 |   });
  333 | 
  334 |   test('billing section exists for pro users', async ({ page }) => {
  335 |     await page.goto('/profile');
> 336 |     await expect(page.getByText(/billing|subscription|pro/i)).toBeVisible();
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  337 |   });
  338 | });
  339 | 
```