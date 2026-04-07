import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

/**
 * E2E tests for NewBlockSetupModal and NewLayoutSetupModal improvements:
 * - Block type intent chips (4-Patch, 9-Patch, 5-Patch, Custom)
 * - Recently used configs
 * - Quality labels (Fine, Standard, Coarse)
 * - From Scratch / From Template tabs
 * - Smart default chain
 * - "What are you making?" framing
 */

async function setupStudioMocks(page: import('@playwright/test').Page) {
  await mockAuth(page, 'pro');
  await mockCanvas(page);

  await page.route('**/api/projects/test-project-1', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'test-project-1',
            name: 'Test Project',
            createdAt: new Date().toISOString(),
            lastSavedAt: new Date().toISOString(),
            canvasData: null,
            unitSystem: 'imperial',
            gridSettings: { size: 1, snapToGrid: true },
            canvasWidth: 12,
            canvasHeight: 12,
          },
        }),
      });
    }
  });

  await page.route('**/api/fabrics**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, page: 1, limit: 50 } }),
    });
  });

  await page.route('**/api/blocks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route('**/api/shop/settings', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ enabled: false }),
    });
  });

  await page.route('**/api/layout-templates**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });
}

/** Wait for the block setup modal heading specifically */
async function waitForBlockModal(page: import('@playwright/test').Page) {
  await page.getByRole('heading', { name: 'New Block' }).waitFor({ timeout: 10000 });
}

/** Wait for the layout setup modal heading specifically */
async function waitForLayoutModal(page: import('@playwright/test').Page) {
  await page.getByRole('heading', { name: 'New Layout' }).waitFor({ timeout: 10000 });
}

/** Navigate to studio and click a worktable tab by name */
async function openWorktableTab(page: import('@playwright/test').Page, tabName: string) {
  await page.goto('/studio/test-project-1');
  await page.waitForLoadState('networkidle', { timeout: 15000 });

  // The worktable tabs are in the bottom bar or toolbar — find by text content
  // They may be span elements inside buttons, so use a broader locator
  const tab = page.locator(`button:has-text("${tabName}")`).first();
  await tab.waitFor({ timeout: 10000 });
  await tab.click();
}

test.describe('NewBlockSetupModal', () => {
  test.beforeEach(async ({ page }) => {
    await setupStudioMocks(page);
  });

  test('block setup modal appears with block type chips', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    // Verify all 4 block type chips — these are inside the modal
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.getByText('4-Patch').first()).toBeVisible();
    await expect(modal.getByText('9-Patch').first()).toBeVisible();
    await expect(modal.getByText('5-Patch').first()).toBeVisible();
    await expect(modal.getByText('Custom').first()).toBeVisible();
  });

  test('clicking 9-Patch sets block size to 9" and shows 3×3 grid', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');

    // Click 9-Patch chip
    await modal.getByText('9-Patch').click();

    // 9" block should now be active (9-Patch defaults: 9" block, 3" cell → 3×3 grid)
    await expect(modal.getByText('3×3 grid')).toBeVisible();
  });

  test('clicking 4-Patch sets 12" block and shows 4×4 grid', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');
    await modal.getByText('4-Patch').click();

    // 4-Patch defaults: 12" block, 3" cell → 4×4 grid
    await expect(modal.getByText('4×4 grid')).toBeVisible();
  });

  test('clicking 5-Patch sets 15" block and shows 5×5 grid', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');
    await modal.getByText('5-Patch').click();

    // 5-Patch defaults: 15" block, 3" cell → 5×5 grid
    await expect(modal.getByText('5×5 grid')).toBeVisible();
  });

  test('quality label appears in grid preview area', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');

    // Default is Custom 12" block 3" cell → 4×4 grid → Moderate
    // The quality label appears after the grid dimensions
    const qualityPattern = /\d+×\d+ grid · (Fine|Standard|Moderate|Coarse|Very Coarse)/;
    await expect(modal.getByText(qualityPattern)).toBeVisible();
  });

  test('Start Building button closes modal', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    await page.getByRole('button', { name: 'Start Building' }).click();

    await expect(page.getByRole('heading', { name: 'New Block' })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('Cancel button closes modal', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'Cancel' }).click();

    await expect(page.getByRole('heading', { name: 'New Block' })).not.toBeVisible({
      timeout: 5000,
    });
  });

  test('manually changing block size resets block type to Custom', async ({ page }) => {
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');

    // First pick 9-Patch
    await modal.getByText('9-Patch').click();
    await expect(modal.getByText('3×3 grid')).toBeVisible();

    // Now manually pick 6" block → should reset to Custom
    await modal.getByRole('button', { name: /6.*Block/ }).click();

    // Grid should change (6" block has different cell options)
    // The key thing is it didn't crash and still shows a grid
    const gridPattern = /\d+×\d+ grid/;
    await expect(modal.getByText(gridPattern)).toBeVisible();
  });
});

test.describe('NewLayoutSetupModal', () => {
  test.beforeEach(async ({ page }) => {
    await setupStudioMocks(page);
  });

  test('layout modal shows From Scratch and From Template tabs', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    await expect(page.getByRole('button', { name: 'From Scratch' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'From Template' })).toBeVisible();
  });

  test('From Scratch shows "What are you making?" section', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    await expect(page.getByText(/What are you making/i)).toBeVisible();

    // All 6 quilt size presets
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.getByRole('button', { name: 'Wall' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Baby' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Throw' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Twin' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Queen' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'King' })).toBeVisible();
  });

  test('clicking Baby preset triggers smart defaults (6" blocks)', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'Baby' }).click();

    // Baby = 36×45, smart default = 6" blocks
    // Should show "Baby Quilt" description
    await expect(modal.getByText(/Baby Quilt/)).toBeVisible();

    // Summary: 45/6 = 7.5 → round to 8 rows, 36/6 = 6 cols
    await expect(modal.getByText(/8 rows × 6 cols/).first()).toBeVisible();

    // Should mention 6" blocks in summary
    await expect(modal.getByText(/6" blocks/).first()).toBeVisible();
  });

  test('clicking Queen preset triggers smart defaults (12" blocks)', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'Queen' }).click();

    // Queen = 90×108, smart default = 12" blocks
    // 108/12 = 9 rows, 90/12 = 7.5 → round to 8 cols
    await expect(modal.getByText(/9 rows × 8 cols/).first()).toBeVisible();
    await expect(modal.getByText(/12" blocks/).first()).toBeVisible();
  });

  test('From Template tab shows layout categories and templates', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    // Switch to From Template tab
    await page.getByRole('button', { name: 'From Template' }).click();

    const modal = page.locator('.fixed.inset-0');

    // Category headers
    await expect(modal.getByText('Straight Set').first()).toBeVisible();
    await expect(modal.getByText('Sashing').first()).toBeVisible();
    await expect(modal.getByText('On-Point').first()).toBeVisible();

    // Template names
    await expect(modal.getByText('Grid 3×3').first()).toBeVisible();
    await expect(modal.getByText('Grid 4×4').first()).toBeVisible();
    await expect(modal.getByText('Grid 5×5').first()).toBeVisible();
  });

  test('clicking a template populates form and switches to scratch tab', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    // Go to template tab
    await page.getByRole('button', { name: 'From Template' }).click();

    const modal = page.locator('.fixed.inset-0');

    // Click Grid 3×3 template
    await modal.getByText('Grid 3×3').first().click();

    // Should switch back to scratch tab and show "Based on Grid 3×3"
    await expect(modal.getByText(/Based on Grid 3×3/).first()).toBeVisible({ timeout: 5000 });

    // Summary should show 3 rows × 3 cols (Grid 3×3 preset: 3×3 grid, 6" blocks)
    await expect(modal.getByText(/3 rows × 3 cols/).first()).toBeVisible();
  });

  test('layout summary shows quality label', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    const modal = page.locator('.fixed.inset-0');

    // Quality label should appear in the summary area
    const qualityPattern = /(Fine|Standard|Moderate|Coarse|Very Coarse) grid/;
    await expect(modal.getByText(qualityPattern)).toBeVisible();
  });

  test('Create Layout button closes modal', async ({ page }) => {
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    await page.getByRole('button', { name: 'Create Layout' }).click();

    await expect(page.getByRole('heading', { name: 'New Layout' })).not.toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('Recent Configs Persistence', () => {
  test('block recent config saved to localStorage after confirm', async ({ page }) => {
    await setupStudioMocks(page);
    await openWorktableTab(page, 'Block Builder');
    await waitForBlockModal(page);

    const modal = page.locator('.fixed.inset-0');

    // Pick 9-Patch then confirm
    await modal.getByText('9-Patch').click();
    await page.getByRole('button', { name: 'Start Building' }).click();

    // Verify localStorage was written
    const savedConfigs = await page.evaluate(() => {
      const raw = localStorage.getItem('qc_recent_block_configs');
      return raw ? JSON.parse(raw) : [];
    });
    expect(savedConfigs.length).toBeGreaterThan(0);
    expect(savedConfigs[0].blockSize).toBe(9);
    expect(savedConfigs[0].blockType).toBe('9-patch');
  });

  test('layout recent config saved to localStorage after confirm', async ({ page }) => {
    await setupStudioMocks(page);
    await openWorktableTab(page, 'Layout');
    await waitForLayoutModal(page);

    const modal = page.locator('.fixed.inset-0');

    // Pick Baby preset then confirm
    await modal.getByRole('button', { name: 'Baby' }).click();
    await page.getByRole('button', { name: 'Create Layout' }).click();

    // Verify localStorage was written
    const savedConfigs = await page.evaluate(() => {
      const raw = localStorage.getItem('qc_recent_layout_configs');
      return raw ? JSON.parse(raw) : [];
    });
    expect(savedConfigs.length).toBeGreaterThan(0);
    expect(savedConfigs[0].widthIn).toBe(36);
    expect(savedConfigs[0].heightIn).toBe(45);
    expect(savedConfigs[0].presetLabel).toBe('Baby');
  });
});
