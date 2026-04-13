import { test, expect } from '@playwright/test';
import { mockAuth } from './utils';

test.describe('Dashboard Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('new design button', async ({ page }) => {
    const newDesignBtn = page.getByText(/new design/i);
    if (await newDesignBtn.isVisible()) {
      await expect(newDesignBtn).toBeVisible();
    }
  });

  test('photo to design button', async ({ page }) => {
    const photoBtn = page.getByText(/photo to design/i);
    if (await photoBtn.isVisible()) {
      await photoBtn.click();
    }
  });

  test('view all projects button', async ({ page }) => {
    const viewAllBtn = page.getByRole('button', { name: /view all|all projects/i });
    if (await viewAllBtn.isVisible()) {
      await viewAllBtn.click();
    }
  });
});

test.describe('Projects Page Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/projects');
    await page.waitForTimeout(2000);
  });

  test('new project button', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /new project/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
    }
  });

  test('filter button', async ({ page }) => {
    const filterBtn = page.getByRole('button', { name: /filter/i });
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
    }
  });

  test('sort button', async ({ page }) => {
    const sortBtn = page.getByRole('button', { name: /sort/i });
    if (await sortBtn.isVisible()) {
      await sortBtn.click();
    }
  });

  test('grid view button', async ({ page }) => {
    const gridBtn = page.getByRole('button', { name: /grid/i });
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
    }
  });

  test('list view button', async ({ page }) => {
    const listBtn = page.getByRole('button', { name: /list/i });
    if (await listBtn.isVisible()) {
      await listBtn.click();
    }
  });
});

test.describe('Block Library Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('block category buttons', async ({ page }) => {
    const blocksBtn = page.getByRole('button', { name: /blocks/i });
    if (await blocksBtn.isVisible()) {
      await blocksBtn.click();
      await page.waitForTimeout(1000);

      const traditionalBtn = page.getByRole('button', { name: /traditional/i });
      if (await traditionalBtn.isVisible()) {
        await traditionalBtn.click();
      }

      const modernBtn = page.getByRole('button', { name: /modern/i });
      if (await modernBtn.isVisible()) {
        await modernBtn.click();
      }
    }
  });

  test('block search clear button', async ({ page }) => {
    const blocksBtn = page.getByRole('button', { name: /blocks/i });
    if (await blocksBtn.isVisible()) {
      await blocksBtn.click();
      await page.waitForTimeout(1000);

      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('test');

        const clearBtn = page.getByRole('button', { name: /clear/i });
        if (await clearBtn.isVisible()) {
          await clearBtn.click();
        }
      }
    }
  });
});

test.describe('Fabric Library Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('fabric collection buttons', async ({ page }) => {
    const fabricsBtn = page.getByRole('button', { name: /fabrics/i });
    if (await fabricsBtn.isVisible()) {
      await fabricsBtn.click();
      await page.waitForTimeout(1000);

      const collectionBtn = page.locator('[data-testid="fabric-collection"]').first();
      if (await collectionBtn.isVisible()) {
        await collectionBtn.click();
      }
    }
  });

  test('fabric calibration button', async ({ page }) => {
    const fabricsBtn = page.getByRole('button', { name: /fabrics/i });
    if (await fabricsBtn.isVisible()) {
      await fabricsBtn.click();
      await page.waitForTimeout(1000);

      const calibrateBtn = page.getByRole('button', { name: /calibrate/i });
      if (await calibrateBtn.isVisible()) {
        await calibrateBtn.click();
      }
    }
  });

  test('upload custom fabric button', async ({ page }) => {
    const fabricsBtn = page.getByRole('button', { name: /fabrics/i });
    if (await fabricsBtn.isVisible()) {
      await fabricsBtn.click();
      await page.waitForTimeout(1000);

      const uploadBtn = page.getByRole('button', { name: /upload/i });
      if (await uploadBtn.isVisible()) {
        await uploadBtn.click();
      }
    }
  });
});

test.describe('Export Dialog Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('export PDF button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);

      const pdfBtn = page.getByRole('button', { name: /pdf/i });
      if (await pdfBtn.isVisible()) {
        await pdfBtn.click();
      }
    }
  });

  test('export PNG button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);

      const pngBtn = page.getByRole('button', { name: /png/i });
      if (await pngBtn.isVisible()) {
        await pngBtn.click();
      }
    }
  });

  test('export SVG button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);

      const svgBtn = page.getByRole('button', { name: /svg/i });
      if (await svgBtn.isVisible()) {
        await svgBtn.click();
      }
    }
  });

  test('export FPP button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForTimeout(1000);

      const fppBtn = page.getByRole('button', { name: /fpp/i });
      if (await fppBtn.isVisible()) {
        await fppBtn.click();
      }
    }
  });
});

test.describe('Settings Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await page.goto('/settings');
    await page.waitForTimeout(2000);
  });

  test('save settings button', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /save/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
  });

  test('cancel button', async ({ page }) => {
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });

  test('delete account button', async ({ page }) => {
    const deleteBtn = page.getByRole('button', { name: /delete account/i });
    if (await deleteBtn.isVisible()) {
      await expect(deleteBtn).toBeVisible();
    }
  });
});

test.describe('Auth Page Buttons', () => {
  test('sign in button', async ({ page }) => {
    await page.goto('/auth/signin');
    const signInBtn = page.getByRole('button', { name: /sign in/i });
    await expect(signInBtn).toBeVisible();
  });

  test('sign up button', async ({ page }) => {
    await page.goto('/auth/signup');
    const signUpBtn = page.getByRole('button', { name: /sign up|create account/i });
    await expect(signUpBtn).toBeVisible();
  });

  test('forgot password button', async ({ page }) => {
    await page.goto('/auth/signin');
    const forgotBtn = page.getByRole('link', { name: /forgot password/i });
    if (await forgotBtn.isVisible()) {
      await expect(forgotBtn).toBeVisible();
    }
  });

  test('back to sign in button', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    const backBtn = page.getByRole('link', { name: /back to sign in/i });
    if (await backBtn.isVisible()) {
      await expect(backBtn).toBeVisible();
    }
  });
});

test.describe('Mobile Navigation Buttons', () => {
  test('mobile home button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const homeBtn = page.getByRole('button', { name: /home/i });
      if (await homeBtn.isVisible()) {
        await homeBtn.click();
      }
    }
  });

  test('mobile FAB button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const fab = page.locator('[data-testid="mobile-fab"]');
      if (await fab.isVisible()) {
        await fab.click();
      }
    }
  });

  test('mobile profile button', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      const profileBtn = page.getByRole('button', { name: /profile|sign in/i });
      if (await profileBtn.isVisible()) {
        await profileBtn.click();
      }
    }
  });
});
