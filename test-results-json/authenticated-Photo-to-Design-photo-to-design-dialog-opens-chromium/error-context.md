# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authenticated.spec.ts >> Photo to Design >> photo to design dialog opens
- Location: tests/e2e/authenticated.spec.ts:194:7

# Error details

```
Error: locator.isVisible: Error: strict mode violation: getByText(/upload/i) resolved to 2 elements:
    1) <p class="font-semibold text-sm mb-0.5">Mobile Uploads</p> aka getByRole('button', { name: 'Mobile Uploads Process uploads' })
    2) <p class="text-xs line-clamp-2">Process uploads</p> aka getByRole('button', { name: 'Mobile Uploads Process uploads' })

Call log:
    - checking visibility of getByText(/upload/i)

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
            - link "Photo to Design Extract a pattern from a photo of a quilt" [active] [ref=e32] [cursor=pointer]:
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
  157 |   });
  158 | 
  159 |   test('can switch between worktables', async ({ page }) => {
  160 |     await page.goto('/studio/test-project-1');
  161 |     const tab2 = page.getByRole('tab', { name: /worktable 2/i });
  162 |     if (await tab2.isVisible()) {
  163 |       await tab2.click();
  164 |     }
  165 |   });
  166 | });
  167 | 
  168 | test.describe('History and Save', () => {
  169 |   test.beforeEach(async ({ page }) => {
  170 |     await mockAuth(page, 'pro');
  171 |     await mockCanvas(page);
  172 |   });
  173 | 
  174 |   test('auto-save indicator shows', async ({ page }) => {
  175 |     await page.goto('/studio/test-project-1');
  176 |     const saved = page.getByText(/saved/i);
  177 |     if (await saved.isVisible({ timeout: 15000 })) {
  178 |       await expect(saved).toBeVisible();
  179 |     }
  180 |   });
  181 | 
  182 |   test('save keyboard shortcut works', async ({ page }) => {
  183 |     await page.goto('/studio/test-project-1');
  184 |     await page.waitForTimeout(2000);
  185 |     await page.keyboard.press('Control+S');
  186 |   });
  187 | });
  188 | 
  189 | test.describe('Photo to Design', () => {
  190 |   test.beforeEach(async ({ page }) => {
  191 |     await mockAuth(page, 'pro');
  192 |   });
  193 | 
  194 |   test('photo to design dialog opens', async ({ page }) => {
  195 |     await page.goto('/dashboard');
  196 |     const photoButton = page.getByText(/photo to design/i);
  197 |     if (await photoButton.isVisible()) {
  198 |       await photoButton.click();
  199 |       const upload = page.getByText(/upload/i);
> 200 |       if (await upload.isVisible({ timeout: 5000 })) {
      |                        ^ Error: locator.isVisible: Error: strict mode violation: getByText(/upload/i) resolved to 2 elements:
  201 |         await expect(upload).toBeVisible();
  202 |       }
  203 |     }
  204 |   });
  205 | });
  206 | 
  207 | test.describe('Billing and Subscriptions', () => {
  208 |   test.beforeEach(async ({ page }) => {
  209 |     await mockAuth(page, 'pro');
  210 |   });
  211 | 
  212 |   test('billing page loads for pro users', async ({ page }) => {
  213 |     await page.goto('/profile');
  214 |     const billing = page.getByText(/billing|subscription/i);
  215 |     if (await billing.isVisible()) {
  216 |       await expect(billing).toBeVisible();
  217 |     }
  218 |   });
  219 | 
  220 |   test('monthly plan option is visible', async ({ page }) => {
  221 |     await page.goto('/profile');
  222 |     const monthly = page.getByText(/\$8.*month/i);
  223 |     if (await monthly.isVisible()) {
  224 |       await expect(monthly).toBeVisible();
  225 |     }
  226 |   });
  227 | 
  228 |   test('annual plan option is visible', async ({ page }) => {
  229 |     await page.goto('/profile');
  230 |     const annual = page.getByText(/\$60.*year/i);
  231 |     if (await annual.isVisible()) {
  232 |       await expect(annual).toBeVisible();
  233 |     }
  234 |   });
  235 | });
  236 | 
```