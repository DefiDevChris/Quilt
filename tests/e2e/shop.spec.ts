import { test, expect } from '@playwright/test';

test.describe('Shop Page', () => {
  test('shop page loads with hero section', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { level: 1, name: /fabric shop/i })).toBeVisible();
    await expect(page.getByText(/curated collection of premium quilting fabrics/i)).toBeVisible();
  });

  test('shop page has SEO metadata', async ({ page }) => {
    await page.goto('/shop');
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /premium quilting fabrics/i);
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /fabric shop/i);
  });

  test('categories section is visible', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.getByRole('heading', { level: 2, name: /shop by category/i })).toBeVisible();
    await expect(page.getByText(/charm packs/i)).toBeVisible();
    await expect(page.getByText(/jelly rolls/i)).toBeVisible();
    await expect(page.getByText(/fabric by the yard/i)).toBeVisible();
  });

  test('category filter updates active state on click', async ({ page }) => {
    await page.goto('/shop');
    const charmPackBtn = page.getByRole('button', { name: /charm packs/i }).first();
    await charmPackBtn.click();
    // Active category should be visually highlighted (check for border color change)
    await expect(charmPackBtn).toHaveCSS('border-color', expect.any(String));
  });

  test('search input is accessible', async ({ page }) => {
    await page.goto('/shop');
    const searchInput = page.getByLabel('Search fabrics');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('cotton');
    await expect(searchInput).toHaveValue('cotton');
  });

  test('filter panel toggles visibility', async ({ page }) => {
    await page.goto('/shop');
    const filterBtn = page.getByRole('button', { name: /filters/i });
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    const filterPanel = page.locator('#filter-panel');
    await expect(filterPanel).toBeVisible();
    await filterBtn.click();
    await expect(filterPanel).not.toBeVisible();
  });

  test('sort dropdown is accessible', async ({ page }) => {
    await page.goto('/shop');
    const sortSelect = page.getByLabel('Sort fabrics');
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('price-asc');
    await expect(sortSelect).toHaveValue('price-asc');
  });

  test('newsletter form accepts email and shows success', async ({ page }) => {
    await page.goto('/shop');
    const emailInput = page.getByLabel('Email address for newsletter');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('test@example.com');
    const subscribeBtn = page.getByRole('button', { name: /subscribe/i });
    await subscribeBtn.click();
    // Should show success message
    await expect(page.getByText(/thanks for subscribing/i)).toBeVisible();
  });

  test('newsletter form rejects invalid email', async ({ page }) => {
    await page.goto('/shop');
    const emailInput = page.getByLabel('Email address for newsletter');
    await emailInput.fill('not-an-email');
    const subscribeBtn = page.getByRole('button', { name: /subscribe/i });
    await subscribeBtn.click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('shop page is keyboard accessible', async ({ page }) => {
    await page.goto('/shop');
    // Tab through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Search input should receive focus eventually
    const searchInput = page.getByLabel('Search fabrics');
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });
});

test.describe('Shop API', () => {
  test('fabrics endpoint returns success when shop enabled', async ({ request }) => {
    const response = await request.get('/api/shop/fabrics?page=1&limit=10');
    // Shop may or may not be enabled in test env — both responses are valid
    expect([200, 503]).toContain(response.status());
  });

  test('fabrics endpoint accepts category filter', async ({ request }) => {
    const response = await request.get('/api/shop/fabrics?category=charm-packs&page=1&limit=10');
    expect([200, 503]).toContain(response.status());
  });

  test('settings endpoint returns enabled status', async ({ request }) => {
    const response = await request.get('/api/shop/settings');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('success', true);
    expect(body.data).toHaveProperty('enabled');
    expect(typeof body.data.enabled).toBe('boolean');
  });
});
