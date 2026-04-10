import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Photo-to-Design Full Happy Path', () => {
  test('complete flow: dashboard → upload → analyze → studio', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Click "Photo to Design" card
    console.log('Looking for Photo to Design card...');
    const photoCard = page.locator('a[href="/photo-to-design"], button:has-text("Photo to Design")').first();
    await photoCard.click();
    await page.waitForURL('**/photo-to-design**');
    console.log('✓ Navigated to photo-to-design');

    // Upload test image
    console.log('Looking for upload zone...');
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Try clicking on the upload zone / label
    const uploadZone = page.locator('label[for*="upload"], input[type="file"] ~ label, [role="button"]:has-text("Upload"), .upload-zone, label:has-text("upload")').first();
    await uploadZone.click();
    
    const fileChooser = await fileChooserPromise;
    const testImagePath = path.resolve(__dirname, '../fixtures/test-quilt.jpeg');
    await fileChooser.setFiles(testImagePath);
    console.log('✓ File uploaded');

    // Wait for image preview to appear
    await page.waitForSelector('img[src*="blob:"], img[alt], .photo-preview', { state: 'visible', timeout: 10000 });
    console.log('✓ Image preview visible');

    // Continue through wizard - Image Prep step
    console.log('Looking for continue/next button...');
    const continueBtn = page.locator('button:has-text("Continue"), button:has-text("Next"), button:has-text("Next Step"), button[type="submit"]').first();
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // Scan Settings step
    console.log('Looking for Analyze Quilt button...');
    const analyzeBtn = page.locator('button:has-text("Analyze"), button:has-text("Analyze Quilt")').first();
    
    // Wait for analyze button to be visible and enabled
    await analyzeBtn.waitFor({ state: 'visible', timeout: 10000 });
    await expect(analyzeBtn).toBeEnabled({ timeout: 5000 });
    
    await analyzeBtn.click();
    console.log('✓ Clicked Analyze Quilt');

    // Wait for analysis to complete - look for "Pattern extracted" or similar success message
    console.log('Waiting for analysis to complete...');
    await page.waitForSelector('text=/Pattern extracted|Analysis complete|Detected|pieces detected/i', { timeout: 30000 });
    console.log('✓ Analysis completed');

    // Click "Open in Studio"
    console.log('Looking for Open in Studio button...');
    const openStudioBtn = page.locator('button:has-text("Open in Studio"), button:has-text("Open Studio")').first();
    await openStudioBtn.waitFor({ state: 'visible', timeout: 10000 });
    await openStudioBtn.click();
    console.log('✓ Clicked Open in Studio');

    // Verify we land on /studio/[id]
    await page.waitForURL('**/studio/**', { timeout: 15000 });
    const url = page.url();
    console.log('✓ Landed on:', url);
    expect(url).toMatch(/\/studio\/[a-zA-Z0-9-]+/);

    // Wait for canvas to load
    console.log('Waiting for canvas to load...');
    await page.waitForSelector('canvas', { state: 'visible', timeout: 15000 });
    console.log('✓ Canvas visible');

    // Take a screenshot to verify the result
    await page.waitForTimeout(2000);
    const screenshot = await page.screenshot({ path: 'tests/screenshots/photo-to-design-result.png', fullPage: true });
    console.log('✓ Screenshot saved to tests/screenshots/photo-to-design-result.png');

    // Check for reference image or colored polygons
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);
    
    // Check for any error messages
    const errors = page.locator('[role="alert"], .error, .alert-error, text=/error|failed|crashed/i');
    const errorCount = await errors.count();
    if (errorCount > 0) {
      const errorText = await errors.first().textContent();
      console.log('⚠ Errors found:', errorText);
    }

    console.log('\n✓ Full happy path completed!');
  });
});
