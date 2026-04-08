import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('Studio Toolbar Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('select tool button', async ({ page }) => {
    const selectBtn = page.getByRole('button', { name: /select/i });
    if (await selectBtn.isVisible()) {
      await selectBtn.click();
      await expect(selectBtn).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('rectangle tool button', async ({ page }) => {
    const rectBtn = page.getByRole('button', { name: /rectangle/i });
    if (await rectBtn.isVisible()) {
      await rectBtn.click();
    }
  });

  test('circle tool button', async ({ page }) => {
    const circleBtn = page.getByRole('button', { name: /circle/i });
    if (await circleBtn.isVisible()) {
      await circleBtn.click();
    }
  });

  test('polygon tool button', async ({ page }) => {
    const polygonBtn = page.getByRole('button', { name: /polygon/i });
    if (await polygonBtn.isVisible()) {
      await polygonBtn.click();
    }
  });

  test('line tool button', async ({ page }) => {
    const lineBtn = page.getByRole('button', { name: /line/i });
    if (await lineBtn.isVisible()) {
      await lineBtn.click();
    }
  });

  test('text tool button', async ({ page }) => {
    const textBtn = page.getByRole('button', { name: /text/i });
    if (await textBtn.isVisible()) {
      await textBtn.click();
    }
  });

  test('pen tool button', async ({ page }) => {
    const penBtn = page.getByRole('button', { name: /pen|draw/i });
    if (await penBtn.isVisible()) {
      await penBtn.click();
    }
  });

  test('eraser tool button', async ({ page }) => {
    const eraserBtn = page.getByRole('button', { name: /eraser/i });
    if (await eraserBtn.isVisible()) {
      await eraserBtn.click();
    }
  });
});

test.describe('Studio Action Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('undo button', async ({ page }) => {
    const undoBtn = page.getByRole('button', { name: /undo/i });
    if (await undoBtn.isVisible()) {
      await undoBtn.click();
    }
  });

  test('redo button', async ({ page }) => {
    const redoBtn = page.getByRole('button', { name: /redo/i });
    if (await redoBtn.isVisible()) {
      await redoBtn.click();
    }
  });

  test('save button', async ({ page }) => {
    const saveBtn = page.getByRole('button', { name: /save/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }
  });

  test('export button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /export/i });
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
    }
  });

  test('blocks button', async ({ page }) => {
    const blocksBtn = page.getByRole('button', { name: /blocks/i });
    if (await blocksBtn.isVisible()) {
      await blocksBtn.click();
    }
  });

  test('fabrics button', async ({ page }) => {
    const fabricsBtn = page.getByRole('button', { name: /fabrics/i });
    if (await fabricsBtn.isVisible()) {
      await fabricsBtn.click();
    }
  });

  test('history button', async ({ page }) => {
    const historyBtn = page.getByRole('button', { name: /history/i });
    if (await historyBtn.isVisible()) {
      await historyBtn.click();
    }
  });

  test.skip('reference image button — removed from toolbar', async ({ page }) => {
    const refBtn = page.getByRole('button', { name: /reference/i });
    if (await refBtn.isVisible()) {
      await refBtn.click();
    }
  });

  test('yardage button', async ({ page }) => {
    const yardageBtn = page.getByRole('button', { name: /yardage/i });
    if (await yardageBtn.isVisible()) {
      await yardageBtn.click();
    }
  });

  test.skip('grid toggle button — removed from toolbar', async ({ page }) => {
    const gridBtn = page.getByRole('button', { name: /grid/i });
    if (await gridBtn.isVisible()) {
      await gridBtn.click();
    }
  });

  test.skip('snap toggle button — removed from toolbar', async ({ page }) => {
    const snapBtn = page.getByRole('button', { name: /snap/i });
    if (await snapBtn.isVisible()) {
      await snapBtn.click();
    }
  });

  test('guides toggle button', async ({ page }) => {
    const guidesBtn = page.getByRole('button', { name: /guides/i });
    if (await guidesBtn.isVisible()) {
      await guidesBtn.click();
    }
  });
});

test.describe('Zoom and View Controls', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('zoom in button', async ({ page }) => {
    const zoomInBtn = page.getByRole('button', { name: /zoom in/i });
    if (await zoomInBtn.isVisible()) {
      await zoomInBtn.click();
    }
  });

  test('zoom out button', async ({ page }) => {
    const zoomOutBtn = page.getByRole('button', { name: /zoom out/i });
    if (await zoomOutBtn.isVisible()) {
      await zoomOutBtn.click();
    }
  });

  test('fit to screen button', async ({ page }) => {
    const fitBtn = page.getByRole('button', { name: /fit|reset/i });
    if (await fitBtn.isVisible()) {
      await fitBtn.click();
    }
  });

  test('100% zoom button', async ({ page }) => {
    const zoom100Btn = page.getByRole('button', { name: /100%/i });
    if (await zoom100Btn.isVisible()) {
      await zoom100Btn.click();
    }
  });
});

test.describe('Group and Alignment Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('group button', async ({ page }) => {
    const groupBtn = page.getByRole('button', { name: /group/i });
    if (await groupBtn.isVisible()) {
      await groupBtn.click();
    }
  });

  test('ungroup button', async ({ page }) => {
    const ungroupBtn = page.getByRole('button', { name: /ungroup/i });
    if (await ungroupBtn.isVisible()) {
      await ungroupBtn.click();
    }
  });

  test('align left button', async ({ page }) => {
    const alignLeftBtn = page.getByRole('button', { name: /align left/i });
    if (await alignLeftBtn.isVisible()) {
      await alignLeftBtn.click();
    }
  });

  test('align center button', async ({ page }) => {
    const alignCenterBtn = page.getByRole('button', { name: /align center/i });
    if (await alignCenterBtn.isVisible()) {
      await alignCenterBtn.click();
    }
  });

  test('align right button', async ({ page }) => {
    const alignRightBtn = page.getByRole('button', { name: /align right/i });
    if (await alignRightBtn.isVisible()) {
      await alignRightBtn.click();
    }
  });

  test('align top button', async ({ page }) => {
    const alignTopBtn = page.getByRole('button', { name: /align top/i });
    if (await alignTopBtn.isVisible()) {
      await alignTopBtn.click();
    }
  });

  test('align middle button', async ({ page }) => {
    const alignMiddleBtn = page.getByRole('button', { name: /align middle/i });
    if (await alignMiddleBtn.isVisible()) {
      await alignMiddleBtn.click();
    }
  });

  test('align bottom button', async ({ page }) => {
    const alignBottomBtn = page.getByRole('button', { name: /align bottom/i });
    if (await alignBottomBtn.isVisible()) {
      await alignBottomBtn.click();
    }
  });

  test('distribute horizontally button', async ({ page }) => {
    const distHBtn = page.getByRole('button', { name: /distribute.*horizontal/i });
    if (await distHBtn.isVisible()) {
      await distHBtn.click();
    }
  });

  test('distribute vertically button', async ({ page }) => {
    const distVBtn = page.getByRole('button', { name: /distribute.*vertical/i });
    if (await distVBtn.isVisible()) {
      await distVBtn.click();
    }
  });
});

test.describe('Layer Control Buttons', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
  });

  test('bring to front button', async ({ page }) => {
    const frontBtn = page.getByRole('button', { name: /bring to front/i });
    if (await frontBtn.isVisible()) {
      await frontBtn.click();
    }
  });

  test('bring forward button', async ({ page }) => {
    const forwardBtn = page.getByRole('button', { name: /bring forward/i });
    if (await forwardBtn.isVisible()) {
      await forwardBtn.click();
    }
  });

  test('send backward button', async ({ page }) => {
    const backwardBtn = page.getByRole('button', { name: /send backward/i });
    if (await backwardBtn.isVisible()) {
      await backwardBtn.click();
    }
  });

  test('send to back button', async ({ page }) => {
    const backBtn = page.getByRole('button', { name: /send to back/i });
    if (await backBtn.isVisible()) {
      await backBtn.click();
    }
  });
});
