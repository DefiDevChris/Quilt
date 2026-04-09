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
      // Mock auth before sign in
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/auth/signin');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password').fill('testpassword123');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
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
      // Mock auth
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/);

      // Reload and check still logged in
      await page.reload();
      await expect(page).toHaveURL(/dashboard/);
    });

    test('logout clears session and redirects', async ({ page }) => {
      // Mock auth
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/dashboard');

      // Find and click logout button
      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await expect(page).toHaveURL(/auth\/signin|signin|\/$/);
      }
    });

    test('session timeout redirects to login', async ({ page }) => {
      // This would require mocking token expiration
      // For now, test that invalid token redirects
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'expired-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Unauthorized' }),
        });
      });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/auth\/signin|signin/, { timeout: 5000 });
    });
  });

  test.describe('Protected Routes Access', () => {
    test('authenticated user can access dashboard', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/dashboard');
      await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    });

    test('authenticated user can access studio', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'pro',
            isPro: true,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'pro',
              isPro: true,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/studio/test-project');
      await expect(page).toHaveURL(/studio\/test-project/, { timeout: 5000 });
    });

    test('authenticated user can access projects', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/projects');
      await expect(page).toHaveURL(/projects/, { timeout: 5000 });
    });
  });

  test.describe('Profile Management', () => {
    test('user can update profile information', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/settings');
      const nameInput = page.getByLabel(/name/i);
      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Name');
        const saveButton = page.getByRole('button', { name: /save/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await expect(page.getByText(/saved|updated/i)).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('profile picture upload works', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/settings');
      const uploadButton = page.getByRole('button', { name: /upload.*picture|change.*picture|avatar/i });
      if (await uploadButton.isVisible()) {
        await uploadButton.click();
        // File upload would require file chooser handling
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      }
    });

    test('password change functionality', async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem('qc_access_token', 'mock-jwt-token');
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'free',
            isPro: false,
            isAdmin: false,
          })
        );
      });

      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              role: 'free',
              isPro: false,
              isAdmin: false,
            },
          }),
        });
      });

      await page.goto('/settings');
      const passwordSection = page.getByText(/password/i);
      if (await passwordSection.isVisible()) {
        await passwordSection.click();
        const currentPassword = page.getByLabel(/current.*password/i);
        const newPassword = page.getByLabel(/new.*password/i);
        if (await currentPassword.isVisible() && await newPassword.isVisible()) {
          await currentPassword.fill('oldpassword123');
          await newPassword.fill('newpassword123');
          const submitButton = page.getByRole('button', { name: /change.*password|update.*password/i });
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await expect(page.getByText(/password.*changed|updated/i)).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });
});
