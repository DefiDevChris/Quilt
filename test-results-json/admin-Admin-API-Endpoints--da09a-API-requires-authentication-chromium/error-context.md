# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> Admin API Endpoints >> admin orders API requires authentication
- Location: tests/e2e/admin.spec.ts:146:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected value: 200
Received array: [401, 403]
```

# Test source

```ts
  48  |     await mockAuth(page, 'free');
  49  |     await page.goto('/admin/settings');
  50  |     await page.waitForURL(/signin|unauthorized|forbidden/);
  51  |     expect(page.url()).toMatch(/signin|unauthorized|forbidden/);
  52  |   });
  53  | });
  54  | 
  55  | test.describe('Admin Features (Admin Role)', () => {
  56  |   test.beforeEach(async ({ page }) => {
  57  |     await mockAuth(page, 'admin');
  58  |     await page.route('**/api/admin/**', async (route) => {
  59  |       await route.fulfill({
  60  |         status: 200,
  61  |         contentType: 'application/json',
  62  |         body: JSON.stringify({ success: true, data: [] }),
  63  |       });
  64  |     });
  65  |     await page.route('**/api/admin/blog/**', async (route) => {
  66  |       await route.fulfill({
  67  |         status: 200,
  68  |         contentType: 'application/json',
  69  |         body: JSON.stringify({ success: true, data: [] }),
  70  |       });
  71  |     });
  72  |   });
  73  | 
  74  |   test('admin dashboard loads', async ({ page }) => {
  75  |     await page.goto('/admin');
  76  |     await expect(page.getByText(/admin|dashboard/i)).toBeVisible();
  77  |   });
  78  | 
  79  |   test('moderation queue loads', async ({ page }) => {
  80  |     await page.goto('/admin');
  81  |     await expect(page.getByText(/moderation|queue|approve/i)).toBeVisible();
  82  |   });
  83  | 
  84  |   test('admin can approve posts', async ({ page }) => {
  85  |     await page.goto('/admin');
  86  |     const approveButton = page.getByRole('button', { name: /approve/i }).first();
  87  |     if (await approveButton.isVisible()) {
  88  |       await expect(approveButton).toBeVisible();
  89  |     }
  90  |   });
  91  | 
  92  |   test('admin can reject posts', async ({ page }) => {
  93  |     await page.goto('/admin');
  94  |     const rejectButton = page.getByRole('button', { name: /reject/i }).first();
  95  |     if (await rejectButton.isVisible()) {
  96  |       await expect(rejectButton).toBeVisible();
  97  |     }
  98  |   });
  99  | 
  100 |   test('admin can delete posts', async ({ page }) => {
  101 |     await page.goto('/admin');
  102 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  103 |     if (await deleteButton.isVisible()) {
  104 |       await expect(deleteButton).toBeVisible();
  105 |     }
  106 |   });
  107 | 
  108 |   test('admin can create blog posts', async ({ page }) => {
  109 |     await page.goto('/admin/blog');
  110 |     const createButton = page.getByRole('button', { name: /create post|new post|create/i });
  111 |     if (await createButton.isVisible()) {
  112 |       await expect(createButton).toBeVisible();
  113 |     }
  114 |   });
  115 | 
  116 |   test('admin can edit blog posts', async ({ page }) => {
  117 |     await page.goto('/admin/blog');
  118 |     const editButton = page.getByRole('button', { name: /edit/i }).first();
  119 |     if (await editButton.isVisible()) {
  120 |       await expect(editButton).toBeVisible();
  121 |     }
  122 |   });
  123 | 
  124 |   test('admin can delete blog posts', async ({ page }) => {
  125 |     await page.goto('/admin/blog');
  126 |     const deleteButton = page.getByRole('button', { name: /delete/i }).first();
  127 |     if (await deleteButton.isVisible()) {
  128 |       await expect(deleteButton).toBeVisible();
  129 |     }
  130 |   });
  131 | });
  132 | 
  133 | test.describe('Admin API Endpoints', () => {
  134 |   test('admin API requires authentication', async ({ request }) => {
  135 |     const response = await request.get('/api/admin/blocks');
  136 |     expect([401, 403]).toContain(response.status());
  137 |   });
  138 | 
  139 |   test('admin blog API requires authentication', async ({ request }) => {
  140 |     const response = await request.post('/api/admin/blog', {
  141 |       data: { title: 'Test', content: 'Test' }
  142 |     });
  143 |     expect([401, 403]).toContain(response.status());
  144 |   });
  145 | 
  146 |   test('admin orders API requires authentication', async ({ request }) => {
  147 |     const response = await request.get('/api/admin/orders');
> 148 |     expect([401, 403]).toContain(response.status());
      |                        ^ Error: expect(received).toContain(expected) // indexOf
  149 |   });
  150 | 
  151 |   test('admin fabrics API requires authentication', async ({ request }) => {
  152 |     const response = await request.get('/api/admin/fabrics');
  153 |     expect([401, 403]).toContain(response.status());
  154 |   });
  155 | 
  156 |   test('admin layouts API requires authentication', async ({ request }) => {
  157 |     const response = await request.get('/api/admin/layouts');
  158 |     expect([401, 403]).toContain(response.status());
  159 |   });
  160 | 
  161 |   test('admin settings API requires authentication', async ({ request }) => {
  162 |     const response = await request.get('/api/admin/settings');
  163 |     expect([401, 403]).toContain(response.status());
  164 |   });
  165 | });
  166 | 
```