import { Page } from '@playwright/test';

export async function mockCanvas(page: Page) {
  await page.addInitScript(() => {
    // Mock Fabric.js canvas
    (window as any).fabric = {
      Canvas: class {
        constructor() {}
        add() {}
        remove() {}
        renderAll() {}
        getObjects() { return []; }
        setWidth() {}
        setHeight() {}
        dispose() {}
        toJSON() { return {}; }
        loadFromJSON() {}
      },
      Rect: class {},
      Circle: class {},
      Polygon: class {},
      Line: class {},
      Text: class {},
      Group: class {}
    };
  });
}

export async function mockProject(page: Page, projectId: string = 'test-project-id') {
  await page.route(`**/api/projects/${projectId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: projectId,
        name: 'Test Project',
        canvasData: { objects: [] },
        worktables: [
          { id: 'wt-1', name: 'Worktable 1', canvasData: { objects: [] } }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    });
  });

  await page.route(`**/api/projects/${projectId}`, async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    } else {
      await route.continue();
    }
  });
}
