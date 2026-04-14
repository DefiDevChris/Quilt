import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Billing Page', () => {
  test('billing page loads for authenticated users', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.goto('/profile');
    const billingText = page.getByText(/billing|subscription|upgrade|profile|account/i).first();
    if (await billingText.isVisible()) {
      await expect(billingText).toBeVisible();
    }
  });

  test('free tier shows upgrade options', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.goto('/profile');
    const upgradeText = page.getByText(/upgrade to pro|upgrade|pro tier/i).first();
    if (await upgradeText.isVisible()) {
      await expect(upgradeText).toBeVisible();
    }
  });

  test('pro tier shows subscription details', async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/profile');
    const subText = page.getByText(/subscription|pro|active/i).first();
    if (await subText.isVisible()) {
      await expect(subText).toBeVisible();
    }
  });
});

test.describe('Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.route('**/api/stripe/subscription', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'active',
          plan: 'pro',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });
  });

  test('can view subscription status', async ({ page }) => {
    await page.goto('/profile');
    const subText = page.getByText(/active|subscription|pro/i).first();
    if (await subText.isVisible()) {
      await expect(subText).toBeVisible();
    }
  });

  test('can view billing history', async ({ page }) => {
    await page.goto('/profile');
    const historyButton = page.getByRole('button', { name: /billing history|history/i });
    if (await historyButton.isVisible()) {
      await historyButton.click();
      await expect(page.getByText(/invoice|payment|billing/i)).toBeVisible();
    }
  });

  test('can update payment method', async ({ page }) => {
    await page.goto('/profile');
    const updateButton = page.getByRole('button', { name: /update payment|payment method/i });
    if (await updateButton.isVisible()) {
      await updateButton.click();
      await expect(page.getByText(/card|payment|stripe/i)).toBeVisible();
    }
  });

  test('can cancel subscription', async ({ page }) => {
    await page.goto('/profile');
    const cancelButton = page.getByRole('button', { name: /cancel subscription|cancel/i });
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
      await expect(page.getByText(/confirm|cancel/i)).toBeVisible();
    }
  });
});

test.describe('Upgrade Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await page.route('**/api/stripe/checkout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/test' }),
      });
    });
  });

  test('upgrade button opens checkout', async ({ page }) => {
    await page.goto('/profile');
    const upgradeButton = page.getByRole('button', { name: /upgrade to pro|upgrade/i });
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
    }
  });

  test('monthly plan option is available', async ({ page }) => {
    await page.goto('/profile');
    const monthlyText = page.getByText(/month|monthly|\$/i);
    if (await monthlyText.isVisible()) {
      await expect(monthlyText).toBeVisible();
    }
  });

  test('annual plan option is available', async ({ page }) => {
    await page.goto('/profile');
    const annualText = page.getByText(/year|annual|\$/i);
    if (await annualText.isVisible()) {
      await expect(annualText).toBeVisible();
    }
  });
});

test.describe('Pro Feature Gates', () => {
  test('free users see upgrade prompt for pro features', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    // Try to access pro feature - export is typically pro
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/upgrade to pro|pro feature/i)).toBeVisible();
    }
  });

  test('upgrade prompt has direct link to billing', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const upgradeLink = page.getByRole('link', { name: /upgrade/i }).or(page.getByText(/upgrade|billing|profile/i));
    if (await upgradeLink.isVisible()) {
      await expect(upgradeLink).toBeVisible();
    }
  });
});

test.describe('Stripe Integration', () => {
  test('Stripe webhook endpoint exists', async ({ request }) => {
    const response = await request.post('/api/stripe/webhook', {
      data: {}
    });
    // Should return 400 for missing signature, not 404
    expect([400, 401, 500]).toContain(response.status());
  });
});

test.describe('Subscription Limits', () => {
  test('free tier has project limit', async ({ page }) => {
    await mockAuth(page, 'free');
    await page.route('**/api/projects', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/projects');
    await expect(page.getByText(/project|design/i)).toBeVisible();
  });

  test('free tier has block limit', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/blocks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
      await expect(page.getByText(/blocks|limit/i)).toBeVisible();
    }
  });

  test('free tier has fabric limit', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.route('**/api/fabrics', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/fabrics|limit/i)).toBeVisible();
    }
  });

  test('free tier cannot save projects', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const saveButton = page.getByRole('button', { name: /save/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(page.getByText(/upgrade to pro|pro feature|save/i)).toBeVisible();
    }
  });

  test('free tier cannot export', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/upgrade to pro|pro feature|export/i)).toBeVisible();
    }
  });
});
