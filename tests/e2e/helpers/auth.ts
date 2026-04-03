import { Page } from '@playwright/test';

export async function mockAuth(page: Page, role: 'free' | 'pro' | 'admin' = 'pro') {
  await page.addInitScript((role) => {
    // Mock localStorage
    localStorage.setItem('quiltcorgi-user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      role: role,
      createdAt: new Date().toISOString()
    }));

    // Mock cookies
    document.cookie = 'qc_id_token=mock-token; path=/';
    document.cookie = 'qc_access_token=mock-token; path=/';
    document.cookie = 'qc_refresh_token=mock-token; path=/';
  }, role);

  // Mock API responses
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          role: role,
          isPro: role === 'pro' || role === 'admin',
          isAdmin: role === 'admin'
        }
      })
    });
  });

  await page.route('**/api/projects**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
          { id: 'test-project-2', name: 'Test Project 2', createdAt: new Date().toISOString() }
        ])
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/blocks**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/api/fabrics**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
}

export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  });
}
