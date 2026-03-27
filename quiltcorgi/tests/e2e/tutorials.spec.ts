import { test, expect } from '@playwright/test';

test.describe('Tutorial Section', () => {
  test('tutorial hub page loads with all tutorials', async ({ page }) => {
    await page.goto('/tutorials');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Tutorials'
    );
    // Should have tutorial cards
    const cards = page.locator('[data-testid="tutorial-card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('difficulty filter works', async ({ page }) => {
    await page.goto('/tutorials');

    // Click beginner filter
    const beginnerChip = page.getByRole('button', { name: /beginner/i });
    await beginnerChip.click();

    // All visible cards should be beginner
    const badges = page.locator('[data-difficulty="beginner"]');
    await expect(badges.first()).toBeVisible();
  });

  test('individual tutorial page renders', async ({ page }) => {
    await page.goto('/tutorials/getting-started');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Getting Started'
    );
    // Should have difficulty badge
    await expect(page.getByText(/beginner/i).first()).toBeVisible();
    // Should have estimated time
    await expect(page.getByText(/min/i).first()).toBeVisible();
  });

  test('tutorial page has proper SEO meta tags', async ({ page }) => {
    await page.goto('/tutorials/getting-started');
    const title = await page.title();
    expect(title).toContain('Getting Started');

    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      'content',
      /quilt/i
    );
  });

  test('tutorial page has HowTo schema', async ({ page }) => {
    await page.goto('/tutorials/getting-started');
    const schemaScript = page.locator(
      'script[type="application/ld+json"]'
    );
    const content = await schemaScript.first().textContent();
    expect(content).toContain('HowTo');
  });

  test('tutorial navigation exists', async ({ page }) => {
    await page.goto('/tutorials/getting-started');
    // Should have a "Try it now" or studio link
    const studioLink = page.getByRole('link', { name: /try it|studio/i });
    await expect(studioLink.first()).toBeVisible();
  });
});
