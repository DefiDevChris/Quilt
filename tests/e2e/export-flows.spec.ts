import { test, expect } from '@playwright/test';

test.describe('Export PDF', () => {
  test.skip('export PDF dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/pdf/i)).toBeVisible();
  });

  test.skip('PDF export has scale options', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/scale/i)).toBeVisible();
  });

  test.skip('PDF export has seam allowance toggle', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/seam allowance/i)).toBeVisible();
  });

  test.skip('PDF export generates file', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    
    const downloadPromise = page.waitForEvent('download');
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Export PNG', () => {
  test.skip('export PNG dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/png/i)).toBeVisible();
  });

  test.skip('PNG export generates file', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    
    const downloadPromise = page.waitForEvent('download');
    const pngButton = page.getByRole('button', { name: /png/i });
    await pngButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.png');
  });
});

test.describe('Export SVG', () => {
  test.skip('export SVG dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/svg/i)).toBeVisible();
  });

  test.skip('SVG export generates file', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    
    const downloadPromise = page.waitForEvent('download');
    const svgButton = page.getByRole('button', { name: /svg/i });
    await svgButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.svg');
  });
});

test.describe('FPP Templates', () => {
  test.skip('FPP template export is available', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/fpp/i)).toBeVisible();
  });

  test.skip('FPP template generates PDF', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    
    const downloadPromise = page.waitForEvent('download');
    const fppButton = page.getByRole('button', { name: /fpp/i });
    await fppButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Yardage Calculator', () => {
  test.skip('yardage calculator opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    await yardageButton.click();
    await expect(page.getByText(/fabric usage/i)).toBeVisible();
  });

  test.skip('yardage calculator shows fabric list', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    await yardageButton.click();
    await expect(page.getByText(/fabric/i)).toBeVisible();
  });

  test.skip('yardage calculator shows total yardage', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    await yardageButton.click();
    await expect(page.getByText(/total/i)).toBeVisible();
  });
});

test.describe('Cutting Charts', () => {
  test.skip('cutting chart dialog opens', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    await cuttingButton.click();
    await expect(page.getByText(/cutting chart/i)).toBeVisible();
  });

  test.skip('cutting chart shows piece dimensions', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    await cuttingButton.click();
    await expect(page.getByText(/dimensions/i)).toBeVisible();
  });

  test.skip('cutting chart can be exported', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/studio/test-project-id');
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    await cuttingButton.click();
    
    const downloadPromise = page.waitForEvent('download');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBeTruthy();
  });
});

test.describe('Pro Feature Gating', () => {
  test.skip('free users see pro upgrade prompt for FPP', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    const fppButton = page.getByRole('button', { name: /fpp/i });
    await fppButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });

  test.skip('free users see pro upgrade prompt for cutting charts', async ({ page }) => {
    // Requires auth setup with free role
    await page.goto('/studio/test-project-id');
    const cuttingButton = page.getByRole('button', { name: /cutting/i });
    await cuttingButton.click();
    await expect(page.getByText(/upgrade to pro/i)).toBeVisible();
  });
});

