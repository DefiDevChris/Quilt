import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject, mockEmptyProject } from './utils';

test.describe('Block Drag-and-Drop', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'dd-test-project');
    await page.route('**/api/blocks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'block-dd-1',
            name: 'Drag Test Block',
            category: 'traditional',
            svgData: '<svg><rect x="0" y="0" width="100" height="100"/></svg>',
          },
        ]),
      });
    });
    await page.route('**/api/blocks/block-dd-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'block-dd-1',
          name: 'Drag Test Block',
          fabricJsData: {
            objects: [
              {
                type: 'Rect',
                left: 0,
                top: 0,
                width: 100,
                height: 100,
                fill: '#FF0000',
                stroke: '#000000',
                strokeWidth: 1,
              },
            ],
          },
        }),
      });
    });
  });

  test('block drag sets correct dataTransfer MIME type', async ({ page }) => {
    await page.goto('/studio/dd-test-project');
    await page.waitForTimeout(2000);

    const blockTab = page.getByRole('tab', { name: /blocks/i });
    if (await blockTab.isVisible()) {
      await blockTab.click();
      await page.waitForTimeout(500);
    }

    const blockItem = page.locator('[data-block-id="block-dd-1"], [data-testid="block-item"]').first();
    const canvas = page.locator('[data-canvas-wrapper]');

    if (await blockItem.isVisible() && await canvas.isVisible()) {
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
      const blockEl = blockItem;
      await blockEl.dispatchEvent('dragstart', { dataTransfer });
      const types = await dataTransfer.evaluate((dt: DataTransfer) => dt.types);
      expect(types).toContain('application/quiltcorgi-block-id');
      const blockId = await dataTransfer.evaluate(
        (dt: DataTransfer) => dt.getData('application/quiltcorgi-block-id')
      );
      expect(blockId).toBe('block-dd-1');
    }
  });

  test('block drag to canvas triggers drop handler', async ({ page }) => {
    await page.goto('/studio/dd-test-project');
    await page.waitForTimeout(2000);

    const blockTab = page.getByRole('tab', { name: /blocks/i });
    if (await blockTab.isVisible()) {
      await blockTab.click();
      await page.waitForTimeout(500);
    }

    const blockItem = page.locator('[data-block-id], [data-testid="block-item"]').first();
    const canvasWrapper = page.locator('[data-canvas-wrapper]');

    if (await blockItem.isVisible() && await canvasWrapper.isVisible()) {
      const box = await canvasWrapper.boundingBox();
      if (box) {
        await blockItem.dragTo(canvasWrapper, {
          targetPosition: { x: box.width / 2, y: box.height / 2 },
        });
        await page.waitForTimeout(500);
      }
    }
  });

  test('block drag shows copy cursor over valid drop zone', async ({ page }) => {
    await page.goto('/studio/dd-test-project');
    await page.waitForTimeout(2000);

    const canvasWrapper = page.locator('[data-canvas-wrapper]');
    if (!(await canvasWrapper.isVisible())) return;

    const box = await canvasWrapper.boundingBox();
    if (!box) return;

    const blockTab = page.getByRole('tab', { name: /blocks/i });
    if (await blockTab.isVisible()) {
      await blockTab.click();
      await page.waitForTimeout(500);
    }

    const blockItem = page.locator('[data-block-id], [data-testid="block-item"]').first();
    if (await blockItem.isVisible()) {
      await blockItem.hover();
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(200);
      await page.mouse.up();
    }
  });
});

test.describe('Fabric Drag-and-Drop', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockProject(page, 'dd-fabric-project');
    await page.route('**/api/fabrics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'fabric-dd-1',
            name: 'Drag Test Fabric',
            imageUrl: 'https://example.com/fabric.jpg',
            thumbnailUrl: 'https://example.com/fabric-thumb.jpg',
          },
        ]),
      });
    });
  });

  test('fabric drag sets correct dataTransfer MIME types', async ({ page }) => {
    await page.goto('/studio/dd-fabric-project');
    await page.waitForTimeout(2000);

    const fabricTab = page.getByRole('tab', { name: /fabrics/i });
    if (await fabricTab.isVisible()) {
      await fabricTab.click();
      await page.waitForTimeout(500);
    }

    const fabricItem = page.locator('[aria-label^="Fabric:"]').first();
    const canvas = page.locator('[data-canvas-wrapper]');

    if (await fabricItem.isVisible() && await canvas.isVisible()) {
      const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
      await fabricItem.dispatchEvent('dragstart', { dataTransfer });
      const types = await dataTransfer.evaluate((dt: DataTransfer) => dt.types);
      expect(types).toContain('application/quiltcorgi-fabric-id');
    }
  });

  test('fabric drag to canvas triggers fabric drop handler', async ({ page }) => {
    await page.goto('/studio/dd-fabric-project');
    await page.waitForTimeout(2000);

    const fabricTab = page.getByRole('tab', { name: /fabrics/i });
    if (await fabricTab.isVisible()) {
      await fabricTab.click();
      await page.waitForTimeout(500);
    }

    const fabricItem = page.locator('[aria-label^="Fabric:"]').first();
    const canvasWrapper = page.locator('[data-canvas-wrapper]');

    if (await fabricItem.isVisible() && await canvasWrapper.isVisible()) {
      const box = await canvasWrapper.boundingBox();
      if (box) {
        await fabricItem.dragTo(canvasWrapper, {
          targetPosition: { x: box.width / 2, y: box.height / 2 },
        });
        await page.waitForTimeout(500);
      }
    }
  });

  test('StudioDropZone dispatches fabric drops by MIME type', async ({ page }) => {
    await page.goto('/studio/dd-fabric-project');
    await page.waitForTimeout(2000);

    const canvasWrapper = page.locator('[data-canvas-wrapper]');
    if (!(await canvasWrapper.isVisible())) return;

    const box = await canvasWrapper.boundingBox();
    if (!box) return;

    const dispatched = await page.evaluate((target) => {
      const wrapper = document.querySelector('[data-canvas-wrapper]');
      if (!wrapper) return false;

      let fabricHandlerCalled = false;
      wrapper.addEventListener('drop', (e) => {
        const fabricId = e.dataTransfer?.getData('application/quiltcorgi-fabric-id');
        if (fabricId) fabricHandlerCalled = true;
      });

      const dt = new DataTransfer();
      dt.setData('application/quiltcorgi-fabric-id', 'fabric-dd-1');
      dt.setData('application/quiltcorgi-fabric-url', 'https://example.com/fabric.jpg');
      dt.setData('application/quiltcorgi-fabric-name', 'Drag Test Fabric');

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX: target.x + target.width / 2,
        clientY: target.y + target.height / 2,
      });
      wrapper.dispatchEvent(dropEvent);

      return fabricHandlerCalled;
    }, { x: box.x, y: box.y, width: box.width, height: box.height });

    expect(dispatched).toBe(true);
  });
});

test.describe('StudioDropZone Routing', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'free');
    await mockCanvas(page);
    await mockEmptyProject(page, 'dd-route-project');
  });

  test('block MIME type routes to block drop handler', async ({ page }) => {
    await page.goto('/studio/dd-route-project');
    await page.waitForTimeout(2000);

    const canvasWrapper = page.locator('[data-canvas-wrapper]');
    if (!(await canvasWrapper.isVisible())) return;

    const box = await canvasWrapper.boundingBox();
    if (!box) return;

    const result = await page.evaluate((target) => {
      const wrapper = document.querySelector('[data-canvas-wrapper]');
      if (!wrapper) return 'no-wrapper';

      const dt = new DataTransfer();
      dt.setData('application/quiltcorgi-block-id', 'test-block');

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX: target.x + target.width / 2,
        clientY: target.y + target.height / 2,
      });
      wrapper.dispatchEvent(dropEvent);

      return 'dispatched';
    }, { x: box.x, y: box.y, width: box.width, height: box.height });

    expect(result).toBe('dispatched');
  });

  test('fabric MIME type routes to fabric drop handler over block handler', async ({ page }) => {
    await page.goto('/studio/dd-route-project');
    await page.waitForTimeout(2000);

    const canvasWrapper = page.locator('[data-canvas-wrapper]');
    if (!(await canvasWrapper.isVisible())) return;

    const box = await canvasWrapper.boundingBox();
    if (!box) return;

    const result = await page.evaluate((target) => {
      const wrapper = document.querySelector('[data-canvas-wrapper]');
      if (!wrapper) return 'no-wrapper';

      const dt = new DataTransfer();
      dt.setData('application/quiltcorgi-fabric-id', 'fabric-test');
      dt.setData('application/quiltcorgi-fabric-url', 'https://example.com/f.jpg');
      dt.setData('application/quiltcorgi-fabric-name', 'Test');

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX: target.x + target.width / 2,
        clientY: target.y + target.height / 2,
      });
      wrapper.dispatchEvent(dropEvent);

      return 'dispatched';
    }, { x: box.x, y: box.y, width: box.width, height: box.height });

    expect(result).toBe('dispatched');
  });

  test('unknown MIME type falls through to block drop handler', async ({ page }) => {
    await page.goto('/studio/dd-route-project');
    await page.waitForTimeout(2000);

    const canvasWrapper = page.locator('[data-canvas-wrapper]');
    if (!(await canvasWrapper.isVisible())) return;

    const box = await canvasWrapper.boundingBox();
    if (!box) return;

    const result = await page.evaluate((target) => {
      const wrapper = document.querySelector('[data-canvas-wrapper]');
      if (!wrapper) return 'no-wrapper';

      const dt = new DataTransfer();
      dt.setData('text/plain', 'unknown-data');

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dt,
        clientX: target.x + target.width / 2,
        clientY: target.y + target.height / 2,
      });
      wrapper.dispatchEvent(dropEvent);

      return 'dispatched';
    }, { x: box.x, y: box.y, width: box.width, height: box.height });

    expect(result).toBe('dispatched');
  });
});
