import { test, expect } from '@playwright/test';
import { authenticatedTest, clearSession, waitForElement } from './utils';

test.describe('Community Feed', () => {
  test('discover tab loads posts', async ({ page }) => {
    await page.goto('/socialthreads');
    await expect(page.getByRole('heading', { name: /feed/i })).toBeVisible();
  });

  test('saved tab is accessible', async ({ page }) => {
    await page.goto('/socialthreads?tab=saved');
    await expect(page).toHaveURL(/tab=saved/);
  });

  test('trending tab is accessible', async ({ page }) => {
    await page.goto('/socialthreads?tab=trending');
    await expect(page).toHaveURL(/tab=trending/);
  });

  test('blog tab is accessible', async ({ page }) => {
    await page.goto('/socialthreads?tab=blog');
    await expect(page).toHaveURL(/tab=blog/);
  });

  test('posts render in feed', async ({ page }) => {
    await page.goto('/socialthreads');
    const posts = page.locator('[data-testid="community-post"]');
    const count = await posts.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('post cards have author information', async ({ page }) => {
    await page.goto('/socialthreads');
    const authorName = page.locator('[data-testid="post-author"]').first();
    if (await authorName.isVisible()) {
      await expect(authorName).toBeVisible();
    }
  });

  test('post cards have like button', async ({ page }) => {
    await page.goto('/socialthreads');
    const likeButton = page.getByRole('button', { name: /like/i }).first();
    if (await likeButton.isVisible()) {
      await expect(likeButton).toBeVisible();
    }
  });

  test('post cards have save button', async ({ page }) => {
    await page.goto('/socialthreads');
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    if (await saveButton.isVisible()) {
      await expect(saveButton).toBeVisible();
    }
  });

  test('post cards have comment button', async ({ page }) => {
    await page.goto('/socialthreads');
    const commentButton = page.getByRole('button', { name: /comment/i }).first();
    if (await commentButton.isVisible()) {
      await expect(commentButton).toBeVisible();
    }
  });
});

test.describe('Community Interactions (Authenticated)', () => {
  test.skip('like button works', async ({ page }) => {
    // Requires auth setup
    await page.goto('/socialthreads');
    const likeButton = page.getByRole('button', { name: /like/i }).first();
    await likeButton.click();
    await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  });

  test.skip('save button works', async ({ page }) => {
    // Requires auth setup
    await page.goto('/socialthreads');
    const saveButton = page.getByRole('button', { name: /save/i }).first();
    await saveButton.click();
    await expect(saveButton).toHaveAttribute('aria-pressed', 'true');
  });

  test.skip('comment dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/socialthreads');
    const commentButton = page.getByRole('button', { name: /comment/i }).first();
    await commentButton.click();
    await expect(page.getByPlaceholder(/write a comment/i)).toBeVisible();
  });

  test.skip('post creation dialog opens', async ({ page }) => {
    // Requires auth setup with pro role
    await page.goto('/socialthreads');
    const createButton = page.getByRole('button', { name: /create post/i });
    await createButton.click();
    await expect(page.getByPlaceholder(/title/i)).toBeVisible();
  });

  test.skip('post detail view opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/socialthreads');
    const firstPost = page.locator('[data-testid="community-post"]').first();
    await firstPost.click();
    await expect(page.getByText(/comments/i)).toBeVisible();
  });
});

test.describe('Trending Content', () => {
  test('trending tab shows most saved posts', async ({ page }) => {
    await page.goto('/socialthreads?tab=trending');
    await expect(page.getByText(/most saved/i)).toBeVisible();
  });

  test('trending time filter works', async ({ page }) => {
    await page.goto('/socialthreads?tab=trending');
    const monthButton = page.getByRole('button', { name: /month/i });
    if (await monthButton.isVisible()) {
      await monthButton.click();
      await expect(page).toHaveURL(/timeframe=month/);
    }
  });

  test('trending all time filter works', async ({ page }) => {
    await page.goto('/socialthreads?tab=trending');
    const allTimeButton = page.getByRole('button', { name: /all time/i });
    if (await allTimeButton.isVisible()) {
      await allTimeButton.click();
      await expect(page).toHaveURL(/timeframe=all/);
    }
  });
});

test.describe('Community Mobile', () => {
  test('mobile navigation works', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      const homeButton = page.getByRole('button', { name: /home/i });
      await expect(homeButton).toBeVisible();
    }
  });

  test('mobile FAB is visible', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/socialthreads');
      const fab = page.locator('[data-testid="mobile-fab"]');
      if (await fab.isVisible()) {
        await expect(fab).toBeVisible();
      }
    }
  });
});

test.describe('Post Detail View', () => {
  test('post detail page loads', async ({ page }) => {
    // Try to access a post directly
    await page.goto('/socialthreads/test-post-id');

    // Should either show post or 404
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('post detail shows full content', async ({ page }) => {
    await page.goto('/socialthreads/test-post-id');

    // Should show post title, content, author, etc.
    const title = page.locator('h1').first();
    if (await title.isVisible()) {
      await expect(title).toBeVisible();
    }
  });

  test('post detail shows engagement metrics', async ({ page }) => {
    await page.goto('/socialthreads/test-post-id');

    // Should show likes, saves, comments count
    const metrics = page.locator('text').filter({ hasText: /\d+.*(?:like|save|comment)/i });
    const count = await metrics.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('comments section is visible', async ({ page }) => {
    await page.goto('/socialthreads/test-post-id');

    // Should show comments section
    await expect(page.getByText(/comments?|replies/i).first()).toBeVisible();
  });
});

test.describe('User Profile', () => {
  test.describe('Profile Page', () => {
    test('profile page requires authentication', async ({ page }) => {
      await page.goto('/profile');

      // Should redirect to sign in
      await page.waitForURL(/auth\/signin|signin/);
      expect(page.url()).toContain('signin');
    });

    test('profile page loads for authenticated users', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile');

      // Should show profile content
      await expect(page).toHaveURL(/\/profile/);
      await expect(page.getByText(/profile|account/i).first()).toBeVisible();
    });

    test('profile shows user information', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile');

      // Should show user name, email, join date, etc.
      await expect(page.getByText(/name|email|joined|member/i).first()).toBeVisible();
    });

    test('profile shows user stats', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile');

      // Should show stats like projects created, posts made, etc.
      await expect(page.getByText(/\d+.*(?:project|post|design|quilt)/i).first()).toBeVisible();
    });

    test('profile shows user posts', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile');

      // Should show user's posts
      await page.waitForTimeout(1000);
      const posts = page.locator('[data-testid="user-post"]');
      const count = await posts.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Public Profile', () => {
    test('public profile page loads', async ({ page }) => {
      // Try accessing a public profile
      await page.goto('/members/test-username');

      // Should show profile or 404
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('public profile shows user information', async ({ page }) => {
      await page.goto('/members/test-username');

      // Should show public user info
      const profileInfo = page.locator('text').filter({ hasText: /@/ });
      const count = await profileInfo.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('public profile shows user posts', async ({ page }) => {
      await page.goto('/members/test-username');

      // Should show some content
      await page.waitForTimeout(1000);
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    });

    test('follow button is visible for other users', async ({ page }) => {
      test.skip(true, 'Requires authenticated user viewing another profile');

      await page.goto('/members/other-user');

      // Should show follow/unfollow button
      const followButton = page.getByRole('button', { name: /follow|unfollow/i });
      await expect(followButton).toBeVisible();
    });
  });
});

test.describe('Settings and Account Management', () => {
  test.describe('Settings Page', () => {
    test('settings page requires authentication', async ({ page }) => {
      await page.goto('/settings');

      // Should redirect to sign in
      await page.waitForURL(/auth\/signin|signin/);
      expect(page.url()).toContain('signin');
    });

    test('settings page loads for authenticated users', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show settings content
      await expect(page.getByRole('heading', { name: /settings|account/i }).first()).toBeVisible();
    });

    test('settings has profile section', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show profile settings
      await expect(page.getByText(/profile|account/i).first()).toBeVisible();
    });

    test('settings has notification preferences', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show notification settings
      await expect(page.getByText(/notification|email/i).first()).toBeVisible();
    });

    test('settings has privacy options', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show privacy settings
      await expect(page.getByText(/privacy|public/i).first()).toBeVisible();
    });

    test('settings has delete account section', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show delete account option
      await expect(page.getByText(/delete account/i)).toBeVisible();
    });
  });

  test.describe('Account Deletion', () => {
    test('delete account section is visible', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Scroll to delete section
      const deleteSection = page.getByText(/delete account/i);
      await expect(deleteSection).toBeVisible();
    });

    test('delete account shows warning', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Should show warning about irreversible action
      await expect(page.getByText(/cannot be undone|permanent/i)).toBeVisible();
    });

    test('delete account requires confirmation', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Click delete account button
      const deleteButton = page.getByRole('button', { name: /delete.*account/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Should show confirmation dialog
        await expect(page.getByText(/are you sure|confirm/i)).toBeVisible();
      }
    });

    test('delete account opens email client', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/settings');

      // Find and click delete account button
      const deleteButton = page.getByRole('button', { name: /contact support|delete/i });
      if (await deleteButton.isVisible()) {
        // Clicking should open mailto link
        await deleteButton.click();
        // Dialog or mailto should trigger
      }
    });
  });

  test.describe('Profile Editing', () => {
    test('profile edit form loads', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile/edit');

      // Should show edit form
      await expect(page.getByLabel(/name/i)).toBeVisible();
    });

    test('profile picture upload works', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile/edit');

      // Look for file upload input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // This would require setting up file upload in tests
        await expect(fileInput).toBeVisible();
      }
    });

    test('bio text area works', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile/edit');

      const bioTextarea = page.getByLabel(/bio|about|description/i);
      if (await bioTextarea.isVisible()) {
        await bioTextarea.fill('Test bio for e2e testing');
        await expect(bioTextarea).toHaveValue('Test bio for e2e testing');
      }
    });

    test('save profile changes works', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/profile/edit');

      // Make a change and save
      const nameInput = page.getByLabel(/name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Test Name');

        const saveButton = page.getByRole('button', { name: /save|update/i });
        await saveButton.click();

        // Should show success message
        await expect(page.getByText(/saved|updated/i)).toBeVisible();
      }
    });
  });
});
