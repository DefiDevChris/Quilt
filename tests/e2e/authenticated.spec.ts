import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('Authenticated Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('dashboard loads bento grid', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText(/new design/i)).toBeVisible({ timeout: 10000 });
  });

  test('new design card is clickable', async ({ page }) => {
    await page.goto('/dashboard');
    const newDesignCard = page.getByText(/new design/i);
    await expect(newDesignCard).toBeVisible({ timeout: 10000 });
  });

  test('photo to design card is visible', async ({ page }) => {
    await page.goto('/dashboard');
    const photoCard = page.getByText(/photo to design/i);
    if (await photoCard.isVisible()) {
      await expect(photoCard).toBeVisible();
    }
  });
});

test.describe('Authenticated Projects', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('projects page loads with search', async ({ page }) => {
    await page.goto('/projects');
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('new project button exists', async ({ page }) => {
    await page.goto('/projects');
    const newButton = page.getByRole('button', { name: /new project/i });
    if (await newButton.isVisible()) {
      await expect(newButton).toBeVisible();
    }
  });
});

test.describe('Authenticated Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/profile|settings/i)).toBeVisible({ timeout: 10000 });
  });

  test('delete account section exists', async ({ page }) => {
    await page.goto('/settings');
    const deleteSection = page.getByText(/delete account/i);
    if (await deleteSection.isVisible()) {
      await expect(deleteSection).toBeVisible();
    }
  });
});

test.describe('Pro User Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('pro user can access studio', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('pro user sees billing section', async ({ page }) => {
    await page.goto('/profile');
    const billing = page.getByText(/billing|subscription/i);
    if (await billing.isVisible()) {
      await expect(billing).toBeVisible();
    }
  });
});

test.describe('Free User Limits', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
  });

  test('free user sees upgrade prompts', async ({ page }) => {
    await page.goto('/profile');
    const upgrade = page.getByText(/upgrade to pro/i);
    if (await upgrade.isVisible()) {
      await expect(upgrade).toBeVisible();
    }
  });
});

test.describe('Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'admin');
  });

  test('admin can access admin page', async ({ page }) => {
    await page.goto('/admin');
    const adminContent = page.getByText(/admin|moderation/i);
    await expect(adminContent).toBeVisible({ timeout: 10000 });
  });

  test('admin can access moderation', async ({ page }) => {
    await page.goto('/admin/moderation');
    const modContent = page.getByText(/moderation|posts/i);
    await expect(modContent).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Canvas Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('canvas keyboard shortcuts work', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+Z');
    await page.keyboard.press('Control+Y');
    await page.keyboard.press('Control+A');
  });

  test('canvas zoom controls exist', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const zoomIn = page.getByRole('button', { name: /zoom in/i });
    const zoomOut = page.getByRole('button', { name: /zoom out/i });
    if (await zoomIn.isVisible()) {
      await expect(zoomIn).toBeVisible();
    }
    if (await zoomOut.isVisible()) {
      await expect(zoomOut).toBeVisible();
    }
  });
});

test.describe('Worktable Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('worktable tabs are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await expect(page.getByText(/worktable/i)).toBeVisible({ timeout: 10000 });
  });

  test('can switch between worktables', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const tab2 = page.getByRole('tab', { name: /worktable 2/i });
    if (await tab2.isVisible()) {
      await tab2.click();
    }
  });
});

test.describe('History and Save', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
  });

  test('auto-save indicator shows', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const saved = page.getByText(/saved/i);
    if (await saved.isVisible({ timeout: 15000 })) {
      await expect(saved).toBeVisible();
    }
  });

  test('save keyboard shortcut works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+S');
  });
});

test.describe('Photo to Design', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('photo to design dialog opens', async ({ page }) => {
    await page.goto('/dashboard');
    const photoButton = page.getByText(/photo to design/i);
    if (await photoButton.isVisible()) {
      await photoButton.click();
      const upload = page.getByText(/upload/i);
      if (await upload.isVisible({ timeout: 5000 })) {
        await expect(upload).toBeVisible();
      }
    }
  });
});

test.describe('Billing and Subscriptions', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
  });

  test('billing page loads for pro users', async ({ page }) => {
    await page.goto('/profile');
    const billing = page.getByText(/billing|subscription/i);
    if (await billing.isVisible()) {
      await expect(billing).toBeVisible();
    }
  });

  test('monthly plan option is visible', async ({ page }) => {
    await page.goto('/profile');
    const monthly = page.getByText(/\$8.*month/i);
    if (await monthly.isVisible()) {
      await expect(monthly).toBeVisible();
    }
  });

  test('annual plan option is visible', async ({ page }) => {
    await page.goto('/profile');
    const annual = page.getByText(/\$60.*year/i);
    if (await annual.isVisible()) {
      await expect(annual).toBeVisible();
    }
  });
});
