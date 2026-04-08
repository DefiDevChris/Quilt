import { test, expect } from '@playwright/test';
import { authenticatedTest, clearSession } from './utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any session state before each test
    await page.goto('/');
    await page.evaluate(() => {
      // Clear cookies and localStorage
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      localStorage.clear();
    });
  });

  test.describe('Sign In Page', () => {
    test('sign in page renders correctly', async ({ page }) => {
      await page.goto('/auth/signin');

      // Check heading
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome back');

      // Check form fields exist
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();

      // Check submit button
      await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

      // Check for logo/navigation
      await expect(page.getByRole('link', { name: /quiltcorgi/i })).toBeVisible();
    });

    test('form validation works', async ({ page }) => {
      await page.goto('/auth/signin');

      // Try submitting empty form
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should show validation errors
      await expect(page.getByText(/email.*required|required/i).first()).toBeVisible();
    });

    test('shows error with invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.getByLabel('Email').fill('invalid@test.com');
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for error message
      await expect(page.getByText(/invalid credentials|failed|incorrect/i)).toBeVisible({
        timeout: 10000,
      });
    });

    test('has link to sign up page', async ({ page }) => {
      await page.goto('/auth/signin');

      const signUpLink = page.getByRole('link', { name: 'Sign up' });
      await expect(signUpLink).toBeVisible();
      await expect(signUpLink).toHaveAttribute('href', '/auth/signup');
    });

    test('has link to forgot password', async ({ page }) => {
      await page.goto('/auth/signin');

      const forgotPasswordLink = page.getByRole('link', { name: 'Forgot password?' });
      await expect(forgotPasswordLink).toBeVisible();
      await expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password');
    });

    test('password visibility toggle works', async ({ page }) => {
      await page.goto('/auth/signin');

      const passwordInput = page.getByLabel('Password');

      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle button
      await page.getByLabel('Show password').click();

      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');

      // Toggle back
      await page.getByLabel('Hide password').click();
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('successful sign in redirects to dashboard', async ({ page }) => {
      // This test would need actual test credentials or mocked auth
      // For now, we'll test the form submission flow
      test.skip(true, 'Requires test authentication setup');
    });
  });

  test.describe('Sign Up Page', () => {
    test('sign up page renders correctly', async ({ page }) => {
      await page.goto('/auth/signup');

      // Check heading
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Create your account');

      // Check form fields exist
      await expect(page.getByLabel('Name')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();

      // Check submit button
      await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();

      // Check terms/conditions if present
      const termsCheckbox = page.getByLabel(/terms|conditions|agree/i);
      if (await termsCheckbox.isVisible()) {
        await expect(termsCheckbox).toBeVisible();
      }
    });

    test('has link to sign in page', async ({ page }) => {
      await page.goto('/auth/signup');

      const signInLink = page.getByRole('link', { name: 'Sign in' });
      await expect(signInLink).toBeVisible();
      await expect(signInLink).toHaveAttribute('href', '/auth/signin');
    });

    test('validates required fields', async ({ page }) => {
      await page.goto('/auth/signup');

      // Try submitting empty form
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should show validation errors for required fields
      await expect(page.getByText(/name.*required|required.*name/i).first()).toBeVisible();
      await expect(page.getByText(/email.*required|required.*email/i).first()).toBeVisible();
    });

    test('validates password requirements', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('short');
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should show error about password length
      await expect(page.getByText(/at least 8 characters|password.*length/i)).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
      await page.goto('/auth/signup');

      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('invalid-email');
      await page.getByLabel('Password').fill('validpassword123');
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should show error about email format
      await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();
    });

    test('password confirmation validation', async ({ page }) => {
      await page.goto('/auth/signup');

      const confirmPasswordInput = page.getByLabel(/confirm.*password|repeat.*password/i);
      if (await confirmPasswordInput.isVisible()) {
        await page.getByLabel('Name').fill('Test User');
        await page.getByLabel('Email').fill('test@example.com');
        await page.getByLabel('Password').fill('validpassword123');
        await confirmPasswordInput.fill('differentpassword');
        await page.getByRole('button', { name: 'Create Account' }).click();

        // Should show password mismatch error
        await expect(page.getByText(/password.*match|match.*password/i)).toBeVisible();
      }
    });
  });

  test.describe('Forgot Password', () => {
    test('forgot password page loads', async ({ page }) => {
      await page.goto('/auth/forgot-password');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
    });
  });

  test.describe('Protected Routes Redirect', () => {
    test('dashboard redirects unauthenticated users to sign in', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForURL(/auth\/signin|signin/);
      expect(page.url()).toContain('signin');
    });

    test('studio redirects unauthenticated users to sign in', async ({ page }) => {
      await page.goto('/studio/test-project');
      await page.waitForURL(/auth\/signin|signin/);
      expect(page.url()).toContain('signin');
    });

    test('projects page redirects unauthenticated users', async ({ page }) => {
      await page.goto('/projects');
      await page.waitForURL(/auth\/signin|signin/);
    });

    test('settings page redirects unauthenticated users', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForURL(/auth\/signin|signin/);
    });
  });
});

test.describe('Navigation and Links', () => {
  test('landing page has navigation links to auth', async ({ page }) => {
    await page.goto('/');

    // Check main CTA links to signup
    const ctaLink = page.getByRole('link', { name: /start designing free|get started/i }).first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  });

  test('logo returns to home from auth pages', async ({ page }) => {
    await page.goto('/auth/signin');

    // Find and click the logo link
    const logoLink = page.getByRole('link', { name: /quiltcorgi.*back to home|logo/i }).first();
    await logoLink.click();

    await expect(page).toHaveURL('/');
  });
});

test.describe('Authenticated User Flows', () => {
  test.describe('Session Management', () => {
    test('authenticated user stays logged in', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('logout clears session and redirects', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('session timeout redirects to login', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });
  });

  test.describe('Protected Routes Access', () => {
    test('authenticated user can access dashboard', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('authenticated user can access studio', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('authenticated user can access projects', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });
  });

  test.describe('Profile Management', () => {
    test('user can update profile information', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('profile picture upload works', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });

    test('password change functionality', async ({ page }) => {
      test.skip(true, 'Requires test authentication setup');
    });
  });
});
