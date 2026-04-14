# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authenticated User Flows >> Session Management >> session timeout redirects to login
- Location: tests/e2e/auth.spec.ts:361:9

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /auth\/signin|signin/
Received string:  "http://localhost:3000/dashboard"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://localhost:3000/dashboard"

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
      - generic [ref=e19]:
        - generic [ref=e21]:
          - heading "Dashboard" [level=1] [ref=e22]
          - paragraph [ref=e23]: Good evening, there
        - generic [ref=e24]:
          - heading "Quick Actions" [level=2] [ref=e25]
          - generic [ref=e26]:
            - button "New Design Start a fresh project from scratch or a template" [ref=e27]:
              - generic [ref=e29]:
                - paragraph [ref=e30]: New Design
                - paragraph [ref=e31]: Start a fresh project from scratch or a template
            - link "Photo to Design Extract a pattern from a photo of a quilt" [ref=e32] [cursor=pointer]:
              - /url: /photo-to-design
              - generic [ref=e34]:
                - paragraph [ref=e35]: Photo to Design
                - paragraph [ref=e36]: Extract a pattern from a photo of a quilt
            - button "Continue Latest No projects yet" [disabled] [ref=e37]:
              - generic [ref=e39]:
                - paragraph [ref=e40]: Continue Latest
                - paragraph [ref=e41]: No projects yet
        - generic [ref=e42]:
          - heading "Navigate" [level=2] [ref=e43]
          - generic [ref=e44]:
            - link "Projects Manage your designs" [ref=e45] [cursor=pointer]:
              - /url: /projects
              - generic [ref=e48]:
                - paragraph [ref=e49]: Projects
                - paragraph [ref=e50]: Manage your designs
            - link "Fabric Library Browse fabrics" [ref=e51] [cursor=pointer]:
              - /url: /fabrics
              - generic [ref=e54]:
                - paragraph [ref=e55]: Fabric Library
                - paragraph [ref=e56]: Browse fabrics
            - button "Mobile Uploads Process uploads 0" [ref=e57]:
              - generic [ref=e59]:
                - generic [ref=e60]:
                  - paragraph [ref=e61]: Mobile Uploads
                  - paragraph [ref=e62]: Process uploads
                - generic [ref=e63]: "0"
            - link "Settings Account preferences" [ref=e64] [cursor=pointer]:
              - /url: /settings
              - generic [ref=e67]:
                - paragraph [ref=e68]: Settings
                - paragraph [ref=e69]: Account preferences
  - generic "Notifications"
  - generic [ref=e74] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e75]:
      - img [ref=e76]
    - generic [ref=e79]:
      - button "Open issues overlay" [ref=e80]:
        - generic [ref=e81]:
          - generic [ref=e82]: "0"
          - generic [ref=e83]: "1"
        - generic [ref=e84]: Issue
      - button "Collapse issues badge" [ref=e85]:
        - img [ref=e86]
  - alert [ref=e88]
```

# Test source

```ts
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
  350 | 
  351 |       await page.goto('/dashboard');
  352 | 
  353 |       // Find and click logout button
  354 |       const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
  355 |       if (await logoutButton.isVisible()) {
  356 |         await logoutButton.click();
  357 |         await expect(page).toHaveURL(/auth\/signin|signin|\/$/);
  358 |       }
  359 |     });
  360 | 
  361 |     test('session timeout redirects to login', async ({ page }) => {
  362 |       // This would require mocking token expiration
  363 |       // For now, test that invalid token redirects
  364 |       await page.addInitScript(() => {
  365 |         localStorage.setItem('qc_access_token', 'expired-token');
  366 |         localStorage.setItem(
  367 |           'user',
  368 |           JSON.stringify({
  369 |             id: 'test-user-123',
  370 |             email: 'test@example.com',
  371 |             name: 'Test User',
  372 |             role: 'free',
  373 |             isPro: false,
  374 |             isAdmin: false,
  375 |           })
  376 |         );
  377 |       });
  378 | 
  379 |       await page.route('**/api/auth/session', async (route) => {
  380 |         await route.fulfill({
  381 |           status: 401,
  382 |           contentType: 'application/json',
  383 |           body: JSON.stringify({ error: 'Unauthorized' }),
  384 |         });
  385 |       });
  386 | 
  387 |       await page.goto('/dashboard');
> 388 |       await expect(page).toHaveURL(/auth\/signin|signin/, { timeout: 5000 });
      |                          ^ Error: expect(page).toHaveURL(expected) failed
  389 |     });
  390 |   });
  391 | 
  392 |   test.describe('Protected Routes Access', () => {
  393 |     test('authenticated user can access dashboard', async ({ page }) => {
  394 |       await page.addInitScript(() => {
  395 |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  396 |         localStorage.setItem(
  397 |           'user',
  398 |           JSON.stringify({
  399 |             id: 'test-user-123',
  400 |             email: 'test@example.com',
  401 |             name: 'Test User',
  402 |             role: 'free',
  403 |             isPro: false,
  404 |             isAdmin: false,
  405 |           })
  406 |         );
  407 |       });
  408 | 
  409 |       await page.route('**/api/auth/session', async (route) => {
  410 |         await route.fulfill({
  411 |           status: 200,
  412 |           contentType: 'application/json',
  413 |           body: JSON.stringify({
  414 |             user: {
  415 |               id: 'test-user-123',
  416 |               email: 'test@example.com',
  417 |               role: 'free',
  418 |               isPro: false,
  419 |               isAdmin: false,
  420 |             },
  421 |           }),
  422 |         });
  423 |       });
  424 | 
  425 |       await page.goto('/dashboard');
  426 |       await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  427 |     });
  428 | 
  429 |     test('authenticated user can access studio', async ({ page }) => {
  430 |       await page.addInitScript(() => {
  431 |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  432 |         localStorage.setItem(
  433 |           'user',
  434 |           JSON.stringify({
  435 |             id: 'test-user-123',
  436 |             email: 'test@example.com',
  437 |             name: 'Test User',
  438 |             role: 'pro',
  439 |             isPro: true,
  440 |             isAdmin: false,
  441 |           })
  442 |         );
  443 |       });
  444 | 
  445 |       await page.route('**/api/auth/session', async (route) => {
  446 |         await route.fulfill({
  447 |           status: 200,
  448 |           contentType: 'application/json',
  449 |           body: JSON.stringify({
  450 |             user: {
  451 |               id: 'test-user-123',
  452 |               email: 'test@example.com',
  453 |               role: 'pro',
  454 |               isPro: true,
  455 |               isAdmin: false,
  456 |             },
  457 |           }),
  458 |         });
  459 |       });
  460 | 
  461 |       await page.goto('/studio/test-project');
  462 |       await expect(page).toHaveURL(/studio\/test-project/, { timeout: 5000 });
  463 |     });
  464 | 
  465 |     test('authenticated user can access projects', async ({ page }) => {
  466 |       await page.addInitScript(() => {
  467 |         localStorage.setItem('qc_access_token', 'mock-jwt-token');
  468 |         localStorage.setItem(
  469 |           'user',
  470 |           JSON.stringify({
  471 |             id: 'test-user-123',
  472 |             email: 'test@example.com',
  473 |             name: 'Test User',
  474 |             role: 'free',
  475 |             isPro: false,
  476 |             isAdmin: false,
  477 |           })
  478 |         );
  479 |       });
  480 | 
  481 |       await page.route('**/api/auth/session', async (route) => {
  482 |         await route.fulfill({
  483 |           status: 200,
  484 |           contentType: 'application/json',
  485 |           body: JSON.stringify({
  486 |             user: {
  487 |               id: 'test-user-123',
  488 |               email: 'test@example.com',
```