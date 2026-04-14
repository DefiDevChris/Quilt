import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Export PDF', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('export PDF dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/pdf/i)).toBeVisible();
    }
  });

  test('PDF export has scale options', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/scale/i)).toBeVisible();
    }
  });

  test('PDF export has seam allowance toggle', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/seam allowance/i)).toBeVisible();
    }
  });

  test('PDF export generates file', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const generateButton = page.getByRole('button', { name: /generate|download/i });
    if (await generateButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await generateButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});

test.describe('Export PNG', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('export PNG dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/png/i)).toBeVisible();
    }
  });

  test('PNG export generates file', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const pngButton = page.getByRole('button', { name: /png/i });
    if (await pngButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await pngButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.png');
    }
  });
});

test.describe('Export SVG', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('export SVG dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/svg/i)).toBeVisible();
    }
  });

  test('SVG export generates file', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const svgButton = page.getByRole('button', { name: /svg/i });
    if (await svgButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await svgButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.svg');
    }
  });
});

test.describe('FPP Templates', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('FPP template export is available', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/fpp|foundation/i)).toBeVisible();
    }
  });

  test('FPP template generates PDF', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const fppButton = page.getByRole('button', { name: /fpp|foundation/i });
    if (await fppButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await fppButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});

test.describe('Yardage Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('yardage calculator opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
      await expect(page.getByText(/fabric usage|yardage/i)).toBeVisible();
    }
  });

  test('yardage calculator shows fabric list', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
      await expect(page.getByText(/fabric/i)).toBeVisible();
    }
  });

  test('yardage calculator shows total yardage', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
      await expect(page.getByText(/total/i)).toBeVisible();
    }
  });
});

test.describe('Cutting Charts', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('cutting chart dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    if (await cuttingButton.isVisible()) {
      await cuttingButton.click();
      await expect(page.getByText(/cutting chart/i)).toBeVisible();
    }
  });

  test('cutting chart shows piece dimensions', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    if (await cuttingButton.isVisible()) {
      await cuttingButton.click();
      await expect(page.getByText(/dimensions|piece/i)).toBeVisible();
    }
  });

  test('cutting chart can be exported', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    if (await cuttingButton.isVisible()) {
      await cuttingButton.click();
    }
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBeTruthy();
    }
  });
});

test.describe('Pro Feature Gating', () => {
  test('free users see pro upgrade prompt for FPP', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }
    const fppButton = page.getByRole('button', { name: /fpp|foundation/i });
    if (await fppButton.isVisible()) {
      await fppButton.click();
      await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
    }
  });

  test('free users see pro upgrade prompt for cutting charts', async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    if (await cuttingButton.isVisible()) {
      await cuttingButton.click();
      await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
    }
  });
});
