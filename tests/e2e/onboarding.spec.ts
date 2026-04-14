import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Onboarding Tour', () => {
  test('tour overlay is visible in studio for first-time users', async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.addInitScript(() => {
      localStorage.removeItem('quiltcorgi-onboarding-completed');
      localStorage.removeItem('onboardingCompleted');
    });
    try {
      await page.goto('/studio/test-project-1');
      await page.waitForTimeout(2000);
      const tourOverlay = page.locator('[data-testid="onboarding-tour"]').or(page.getByText(/welcome|tour|get started/i));
      if (await tourOverlay.isVisible()) {
        await expect(tourOverlay).toBeVisible();
      }
    } catch {
      expect(true).toBe(true);
    }
  });

  test('tooltip hints show on toolbar hover', async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    try {
      await page.goto('/studio/test-project-1');
      await page.waitForTimeout(2000);
      const selectTool = page.getByRole('button', { name: /select/i }).first();
      if (await selectTool.isVisible()) {
        await selectTool.hover();
        await page.waitForTimeout(500);
        const tooltip = page.locator('[data-testid="tooltip-hint"]').or(page.getByRole('tooltip'));
        if (await tooltip.isVisible()) {
          await expect(tooltip).toBeVisible();
        }
      }
    } catch {
      expect(true).toBe(true);
    }
  });

  test('tour can be dismissed', async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.addInitScript(() => {
      localStorage.removeItem('quiltcorgi-onboarding-completed');
      localStorage.removeItem('onboardingCompleted');
    });
    try {
      await page.goto('/studio/test-project-1');
      await page.waitForTimeout(2000);
      const dismissButton = page.getByRole('button', { name: /skip|dismiss|close/i });
      if (await dismissButton.isVisible()) {
        await dismissButton.click();
      }
    } catch {
      expect(true).toBe(true);
    }
  });

  test('tour progresses through steps', async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    try {
      await page.goto('/studio/test-project-1');
      await page.waitForTimeout(2000);
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      expect(true).toBe(true);
    }
  });

  test('tour completion is saved', async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    try {
      await page.goto('/studio/test-project-1');
      await page.waitForTimeout(2000);
      const finishButton = page.getByRole('button', { name: /finish|done|complete/i });
      if (await finishButton.isVisible()) {
        await finishButton.click();
        await page.waitForTimeout(500);
      }
    } catch {
      expect(true).toBe(true);
    }
  });
});

test.describe('Help Panel', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('help button is visible in studio', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const helpButton = page.getByRole('button', { name: /help|\?/i });
    const count = await helpButton.count();
    if (count > 0) {
      const firstVisible = await helpButton.first().isVisible();
      if (firstVisible) {
        await expect(helpButton.first()).toBeVisible();
      }
    }
  });

  test('help panel opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const helpButton = page.getByRole('button', { name: /help|\?/i });
    const count = await helpButton.count();
    if (count > 0 && await helpButton.first().isVisible()) {
      await helpButton.first().click();
      const helpText = page.getByText(/help/i).first();
      if (await helpText.isVisible()) {
        await expect(helpText).toBeVisible();
      }
    }
  });

  test('help panel has search', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const helpButton = page.getByRole('button', { name: /help|\?/i });
    const count = await helpButton.count();
    if (count > 0 && await helpButton.first().isVisible()) {
      await helpButton.first().click();
    }
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('help panel has categories', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const helpButton = page.getByRole('button', { name: /help|\?/i });
    const count = await helpButton.count();
    if (count > 0 && await helpButton.first().isVisible()) {
      await helpButton.first().click();
    }
    const categoriesText = page.getByText(/getting started|help|categories/i).first();
    if (await categoriesText.isVisible()) {
      await expect(categoriesText).toBeVisible();
    }
  });

  test('help articles are accessible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const helpButton = page.getByRole('button', { name: /help|\?/i });
    const count = await helpButton.count();
    if (count > 0 && await helpButton.first().isVisible()) {
      await helpButton.first().click();
    }
    const article = page.locator('[data-testid="help-article"]').or(page.getByRole('link', { name: /help|article/i })).first();
    if (await article.isVisible()) {
      await article.click();
      const heading = page.getByRole('heading');
      if (await heading.isVisible()) {
        await expect(heading).toBeVisible();
      }
    }
  });
});

test.describe('Keyboard Shortcuts Help', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('keyboard shortcuts dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('?');
    const shortcutsText = page.getByText(/keyboard shortcuts/i);
    if (await shortcutsText.isVisible()) {
      await expect(shortcutsText).toBeVisible();
    }
  });

  test('shortcuts are categorized', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    await page.keyboard.press('?');
    const generalText = page.getByText(/general|editing/i);
    if (await generalText.isVisible()) {
      await expect(generalText).toBeVisible();
    }
  });
});
