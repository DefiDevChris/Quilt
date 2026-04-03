import { test, expect } from '@playwright/test';

test.describe('Billing Page', () => {
  test.skip('billing page loads for authenticated users', async ({ page }) => {
    // Requires auth setup
    await page.goto('/profile');
    await expect(page.getByText(/billing/i)).toBeVisible();
  });

  test.skip('free tier shows upgrade options', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/profile');
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test.skip('pro tier shows subscription details', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    await expect(page.getByText(/subscription/i)).toBeVisible();
  });
});

test.describe('Subscription Management', () => {
  test.skip('can view subscription status', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    await expect(page.getByText(/active|inactive/i)).toBeVisible();
  });

  test.skip('can view billing history', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    const historyButton = page.getByRole('button', { name: /billing history/i });
    await historyButton.click();
    await expect(page.getByText(/invoice/i)).toBeVisible();
  });

  test.skip('can update payment method', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    const updateButton = page.getByRole('button', { name: /update payment/i });
    await updateButton.click();
    await expect(page.getByText(/card/i)).toBeVisible();
  });

  test.skip('can cancel subscription', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/profile');
    const cancelButton = page.getByRole('button', { name: /cancel subscription/i });
    await cancelButton.click();
    await expect(page.getByText(/confirm/i)).toBeVisible();
  });
});

test.describe('Upgrade Flow', () => {
  test.skip('upgrade button opens checkout', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/profile');
    const upgradeButton = page.getByRole('button', { name: /upgrade to pro/i });
    await upgradeButton.click();
    
    // Should redirect to Stripe checkout
    await page.waitForURL(/checkout\.stripe\.com/);
  });

  test.skip('monthly plan option is available', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/profile');
    await expect(page.getByText(/\$8.*month/i)).toBeVisible();
  });

  test.skip('annual plan option is available', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/profile');
    await expect(page.getByText(/\$60.*year/i)).toBeVisible();
  });
});

test.describe('Pro Feature Gates', () => {
  test.skip('free users see upgrade prompt for pro features', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    
    // Try to access pro feature
    const fppButton = page.getByRole('button', { name: /fpp/i });
    await fppButton.click();
    
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test.skip('upgrade prompt has direct link to billing', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    
    const fppButton = page.getByRole('button', { name: /fpp/i });
    await fppButton.click();
    
    const upgradeLink = page.getByRole('link', { name: /upgrade/i });
    await expect(upgradeLink).toHaveAttribute('href', /profile|billing/);
  });
});

test.describe('Stripe Integration', () => {
  test('Stripe webhook endpoint exists', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: {}
    });
    // Should return 400 for missing signature, not 404
    expect(response.status()).toBe(400);
  });

  test.skip('successful payment updates user role', async ({ page }) => {
    // Requires auth setup and Stripe test mode
    // This would be tested with Stripe test webhooks
  });

  test.skip('failed payment shows error message', async ({ page }) => {
    // Requires auth setup and Stripe test mode
    // This would be tested with Stripe test webhooks
  });
});

test.describe('Subscription Limits', () => {
  test.skip('free tier has project limit', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/projects');
    await expect(page.getByText(/project limit/i)).toBeVisible();
  });

  test.skip('free tier has block limit', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    await expect(page.getByText(/20 blocks/i)).toBeVisible();
  });

  test.skip('free tier has fabric limit', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/10 fabrics/i)).toBeVisible();
  });

  test.skip('free tier cannot save projects', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const saveButton = page.getByRole('button', { name: /save/i });
    await saveButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test.skip('free tier cannot export', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });
});
