import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Photo-to-Design Grid Engine', () => {
  test('should merge patches correctly with union-find (not 1:1 cell-to-patch)', async ({ page }) => {
    // Load the test image
    const imagePath = path.join(process.cwd(), 'public', 'test-fairgrounds.jpg');
    const imageBuffer = fs.readFileSync(imagePath);

    // Navigate to the photo-to-design page
    await page.goto('/photo-to-design');

    // Wait for the upload step to be visible
    await expect(page.getByText('Upload a quilt photo')).toBeVisible();

    // Upload the test image via the file input
    await page.setInputFiles('input[type="file"]', {
      name: 'test-fairgrounds.jpg',
      mimeType: 'image/jpeg',
      buffer: imageBuffer,
    });

    // Wait for perspective/crop step to appear
    await expect(page.getByText('Drag the four corner handles')).toBeVisible({ timeout: 10000 });

    // Skip perspective correction
    await page.getByRole('button', { name: 'Skip' }).click();

    // Wait for grid/calibrate step to appear
    await expect(page.getByText('Calibrate')).toBeVisible({ timeout: 5000 });

    // Set cells to 32 via the slider using click-and-drag
    // The slider for cells is the first input[type="range"]
    const cellsSlider = page.locator('input[type="range"]').first();
    // Get slider bounding box to calculate drag position
    const box = await cellsSlider.boundingBox();
    if (!box) throw new Error('Slider not found');

    // Drag from left (min) to right (~80% for value 32 out of 40 max)
    const targetRatio = (32 - 3) / (40 - 3); // slider range is 3-40
    const targetX = box.x + box.width * targetRatio;
    const targetY = box.y + box.height / 2;

    await page.mouse.move(box.x + 2, targetY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();

    // Wait for the cell count to update (the badge shows "N × N · Wpx")
    await expect(page.locator('text=/\\d+ × \\d+/')).toBeVisible({ timeout: 3000 });

    // Click Scan to run the engine
    await page.getByRole('button', { name: 'Scan' }).click();

    // Wait for the review step — look for the "Results" heading
    await expect(page.getByText('Results')).toBeVisible({ timeout: 15000 });

    // Wait for processing to complete (the processing overlay should disappear)
    await expect(page.locator('.bg-\\[var\\(--color-bg\\)\\]\\/70')).not.toBeVisible({ timeout: 15000 });

    // Get the patch count from the results panel
    // The "Patches" stat: the number is the first div, "Patches" is the second
    const patchesNumber = await page.locator('text=Patches').locator('xpath=..').locator('div').first().textContent();
    const patchCount = parseInt(patchesNumber?.trim() ?? '0', 10);

    console.log(`Patch count: ${patchCount}`);

    // The key assertion: patches should be well below the broken ~790 count
    // Target range: 200-300, but allow 150-500 for image variations
    expect(patchCount).toBeGreaterThan(100);
    expect(patchCount).toBeLessThan(600);

    // Verify the SVG overlay rendered with path elements
    const svgPaths = page.locator('svg path');
    await expect(svgPaths).toHaveCount(patchCount);

    // Verify processing completed in reasonable time
    const processingTimeText = await page.locator('text=ms').locator('xpath=..').locator('div').first().textContent();
    const processingTime = parseInt(processingTimeText?.trim() ?? '0', 10);
    console.log(`Processing time: ${processingTime}ms`);
    expect(processingTime).toBeLessThan(200);

    // Verify the palette has a reasonable number of colors
    const fabricsText = await page.locator('text=Fabrics').locator('xpath=..').locator('div').first().textContent();
    const fabricCount = parseInt(fabricsText?.trim() ?? '0', 10);
    expect(fabricCount).toBeGreaterThanOrEqual(3);
    expect(fabricCount).toBeLessThanOrEqual(20);

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'test-results/grid-engine-patches.png', fullPage: false });
  });

  test('should handle rescan without errors', async ({ page }) => {
    const imagePath = path.join(process.cwd(), 'public', 'test-fairgrounds.jpg');
    const imageBuffer = fs.readFileSync(imagePath);

    await page.goto('/photo-to-design');
    await expect(page.getByText('Upload a quilt photo')).toBeVisible();

    await page.setInputFiles('input[type="file"]', {
      name: 'test-fairgrounds.jpg',
      mimeType: 'image/jpeg',
      buffer: imageBuffer,
    });

    await expect(page.getByText('Drag the four corner handles')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Skip' }).click();
    await expect(page.getByText('Calibrate')).toBeVisible({ timeout: 5000 });

    // Set cells to 16 for a quick scan
    const cellsSlider = page.locator('input[type="range"]').first();
    const box = await cellsSlider.boundingBox();
    if (!box) throw new Error('Slider not found');
    const targetRatio = (16 - 3) / (40 - 3);
    const targetX = box.x + box.width * targetRatio;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(box.x + 2, targetY);
    await page.mouse.down();
    await page.mouse.move(targetX, targetY);
    await page.mouse.up();

    await page.getByRole('button', { name: 'Scan' }).click();
    await expect(page.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.bg-\\[var\\(--color-bg\\)\\]\\/70')).not.toBeVisible({ timeout: 15000 });

    // Click Rescan
    await page.getByRole('button', { name: 'Rescan' }).click();

    // Should see results again after rescan
    await expect(page.getByText('Results')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.bg-\\[var\\(--color-bg\\)\\]\\/70')).not.toBeVisible({ timeout: 15000 });
  });
});
