/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, Page, Locator, expect } from '@playwright/test';

export const authenticatedTest = base.extend<{
  authenticatedPage: Page;
  proPage: Page;
  adminPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await mockAuth(page, 'free');
    await page.goto('/');
    await use(page);
  },
  proPage: async ({ page }, use) => {
    await mockAuth(page, 'pro');
    await page.goto('/');
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await mockAuth(page, 'admin');
    await page.goto('/');
    await use(page);
  },
});

export async function mockAuth(page: Page, role: 'free' | 'pro' | 'admin' = 'pro') {
  await page.addInitScript((role) => {
    localStorage.setItem('qc_access_token', 'mock-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: role,
        isPro: role === 'pro' || role === 'admin',
        isAdmin: role === 'admin',
      })
    );
    document.cookie = 'qc_id_token=mock-token; path=/';
    document.cookie = 'qc_access_token=mock-token; path=/';
  }, role);

  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          role: role,
          isPro: role === 'pro' || role === 'admin',
          isAdmin: role === 'admin',
        },
      }),
    });
  });

  await page.route('**/api/projects**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-project-1', name: 'Test Project 1', createdAt: new Date().toISOString() },
        ]),
      });
    } else {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    }
  });
}

export async function mockCanvas(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as Window & { fabric: unknown }).fabric = {
      Canvas: class {
        constructor() {}
        add() {}
        remove() {}
        renderAll() {}
        getObjects() {
          return [];
        }
        setWidth() {}
        setHeight() {}
        dispose() {}
        toJSON() {
          return {};
        }
        loadFromJSON() {}
      },
      Rect: class {},
      Circle: class {},
      Polygon: class {},
      Line: class {},
      Text: class {},
      Group: class {},
    };
  });
}

export async function waitForElement(
  page: Page,
  selector: string,
  timeout = 5000
): Promise<Locator> {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

export async function waitForNetworkIdle(page: Page, timeout = 3000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function fillAndSubmit(
  page: Page,
  fields: { selector: string; value: string }[]
): Promise<void> {
  for (const field of fields) {
    await page.fill(field.selector, field.value);
  }
  const submitButton = page.locator('button[type="submit"]');
  if (await submitButton.isVisible()) {
    await submitButton.click();
  }
}

export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    localStorage.clear();
  });
}

export async function waitForDialog(page: Page): Promise<Locator> {
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible', timeout: 5000 });
  return dialog;
}

export async function clickOutside(page: Page): Promise<void> {
  await page.click('body', { position: { x: 0, y: 0 } });
}

export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return (await page.locator(selector).count()) > 0;
}

export async function getElementText(page: Page, selector: string): Promise<string | null> {
  const element = page.locator(selector);
  if ((await element.count()) === 0) return null;
  return await element.first().textContent();
}

export class PageHelper {
  constructor(protected page: Page) {}
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
  async clickButton(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }
  async fillInput(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }
  async getByText(text: string): Promise<Locator> {
    return this.page.getByText(text);
  }
}
