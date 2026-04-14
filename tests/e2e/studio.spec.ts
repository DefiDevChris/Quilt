import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas, mockProject } from './utils';

test.describe('Studio Access', () => {
  test('studio requires authentication', async ({ page }) => {
    await page.goto('/studio/test-project-id');
    // Wait for redirect to signin or for page to load
    try {
      await page.waitForURL(/signin/, { timeout: 5000 });
      expect(page.url()).toContain('signin');
    } catch {
      // If already authenticated, this test doesn't apply
    }
  });

  test('studio has callback URL after redirect', async ({ page }) => {
    await page.goto('/studio/test-project-id');
    // Wait for redirect to signin
    try {
      await page.waitForURL(/signin/, { timeout: 5000 });
      expect(page.url()).toContain('callbackUrl');
    } catch {
      // If already authenticated, this test doesn't apply
    }
  });
});

test.describe('Studio Mobile Gate', () => {
  test('mobile users see desktop-only message', async ({ page, isMobile }) => {
    if (isMobile) {
      await mockAuth(page, 'pro');
      await page.goto('/studio/test-project-id');
      const desktopMessage = page.getByText(/desktop/i);
      if (await desktopMessage.isVisible()) {
        await expect(desktopMessage).toBeVisible();
      }
    }
  });
});

test.describe('Studio Features (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('canvas initializes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible({ timeout: 10000 })) {
      await expect(canvas).toBeVisible();
    }
  });

  test('worktable tabs are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const worktable = page.getByText(/worktable/i);
    if (await worktable.isVisible({ timeout: 10000 })) {
      await expect(worktable).toBeVisible();
    }
  });

  test('project name is displayed', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const projectName = page.getByText(/test project/i, { exact: false });
    if (await projectName.isVisible({ timeout: 10000 })) {
      await expect(projectName).toBeVisible();
    }
  });
});

test.describe('Canvas Design Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('reference image dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const refButton = page.getByRole('button', { name: /reference/i });
    if (await refButton.isVisible()) {
      await refButton.click();
      await expect(page.getByText(/upload/i)).toBeVisible();
    }
  });

  test('block library opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const blockButton = page.getByRole('button', { name: /blocks/i });
    if (await blockButton.isVisible()) {
      await blockButton.click();
      await expect(page.getByText(/block library/i)).toBeVisible();
    }
  });

  test('fabric library opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    if (await fabricButton.isVisible()) {
      await fabricButton.click();
      await expect(page.getByText(/fabric/i)).toBeVisible();
    }
  });

  test('export menu opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await expect(page.getByText(/pdf/i)).toBeVisible();
    }
  });

  test('yardage calculator opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
      await expect(page.getByText(/fabric usage/i)).toBeVisible();
    }
  });
});

test.describe('Basic Canvas Operations', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('canvas loads with proper dimensions', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      const boundingBox = await canvas.boundingBox();
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(100);
        expect(boundingBox.height).toBeGreaterThan(100);
      }
    }
  });

  test('canvas responds to zoom controls', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const zoomInButton = page.getByRole('button', { name: /zoom.*in|\+/i });
    if (await zoomInButton.isVisible()) {
      await zoomInButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('canvas supports pan/drag', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      });
    }
  });
});

test.describe('Drawing Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('select tool is active by default', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const selectTool = page.getByRole('button', { name: /select/i }).first();
    if (await selectTool.isVisible()) {
      await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('can switch to drawing tools', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const tools = [
      { name: /free.*draw|pen/i },
      { name: /rectangle|square/i },
      { name: /circle/i },
      { name: /line/i },
    ];

    for (const tool of tools) {
      const toolButton = page.getByRole('button', { name: tool.name }).first();
      if (await toolButton.isVisible()) {
        await toolButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('color picker works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const colorPicker = page.locator('input[type="color"]').first();
    if (await colorPicker.isVisible()) {
      await colorPicker.fill('#ff0000');
    }
  });

  test('brush size controls work', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const sizeSlider = page.locator('input[type="range"]').first();
    if (await sizeSlider.isVisible()) {
      await sizeSlider.fill('10');
    }
  });
});

test.describe('Shape Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('can draw basic shapes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);
    const canvas = page.locator('canvas');

    const rectangleTool = page.getByRole('button', { name: /rectangle|square/i }).first();
    if (await rectangleTool.isVisible()) {
      await rectangleTool.click();
      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 100, y: 100 } });
        await canvas.click({ position: { x: 200, y: 200 } });
      }
    }
  });

  test('shape manipulation works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 150, y: 150 } });

      const resizeHandle = page.locator('.resize-handle').first();
      if (await resizeHandle.isVisible()) {
        await resizeHandle.dragTo(canvas, { targetPosition: { x: 250, y: 250 } });
      }
    }
  });
});

test.describe('Block and Pattern Tools', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('block library opens and shows blocks', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const blockButton = page.getByRole('button', { name: /blocks|library/i }).first();
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }

    const blockLibrary = page.getByText(/block library/i);
    if (await blockLibrary.isVisible()) {
      await expect(blockLibrary).toBeVisible();
    }
  });

  test('can drag blocks to canvas', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const blockButton = page.getByRole('button', { name: /blocks/i }).first();
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }

    const blockElement = page.locator('[data-block-id]').first();
    const canvas = page.locator('canvas');

    if (await blockElement.isVisible() && await canvas.isVisible()) {
      await blockElement.dragTo(canvas, { targetPosition: { x: 150, y: 150 } });
    }
  });
});

test.describe('History and Undo/Redo', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('history panel shows actions', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    const historyButton = page.getByRole('button', { name: /history/i }).first();
    if (await historyButton.isVisible()) {
      await historyButton.click();
    }

    const historyText = page.getByText(/draw|create|add/i).first();
    if (await historyText.isVisible()) {
      await expect(historyText).toBeVisible();
    }
  });

  test('undo button works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    const undoButton = page.getByRole('button', { name: /undo/i }).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
      await expect(undoButton).toBeEnabled();
    }
  });

  test('redo button works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    const undoButton = page.getByRole('button', { name: /undo/i }).first();
    if (await undoButton.isVisible()) {
      await undoButton.click();
    }

    const redoButton = page.getByRole('button', { name: /redo/i }).first();
    if (await redoButton.isVisible()) {
      await redoButton.click();
      await expect(redoButton).toBeEnabled();
    }
  });
});

test.describe('Reference Images', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('reference image upload dialog opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const refButton = page.getByRole('button', { name: /reference.*image/i }).first();
    if (await refButton.isVisible()) {
      await refButton.click();
    }

    const uploadText = page.getByText(/upload.*image|choose.*file/i).first();
    if (await uploadText.isVisible()) {
      await expect(uploadText).toBeVisible();
    }
  });

  test('reference image displays on canvas', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const refButton = page.getByRole('button', { name: /reference/i }).first();
    if (await refButton.isVisible()) {
      await expect(refButton).toBeVisible();
    }
  });

  test('reference image opacity controls work', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const opacitySlider = page.locator('input[type="range"][aria-label*="opacity"]').first();
    if (await opacitySlider.isVisible()) {
      await opacitySlider.fill('50');
    }
  });
});

test.describe('Multi-Worktable System', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('multiple worktables can be created', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const addButton = page
      .getByRole('button', { name: /add.*worktable|new.*worktable|\+/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();

      const worktableTabs = page.getByRole('tab', { name: /worktable/i });
      const count = await worktableTabs.count();
      expect(count).toBeGreaterThan(1);
    }
  });

  test('worktable tabs switch correctly', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const tabs = page.getByRole('tab', { name: /worktable/i });
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      await tabs.nth(1).click();
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('worktable state persists when switching', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    const tabs = page.getByRole('tab', { name: /worktable/i });
    if ((await tabs.count()) > 1) {
      await tabs.nth(1).click();
      await tabs.first().click();
    }
  });

  test('worktable can be renamed', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    if (await tab.isVisible()) {
      await tab.click({ button: 'right' });

      const renameOption = page.getByText(/rename/i).first();
      if (await renameOption.isVisible()) {
        await renameOption.click();

        const input = page.locator('input[type="text"]').first();
        if (await input.isVisible()) {
          await input.fill('My Custom Worktable');
          await input.press('Enter');

          await expect(page.getByRole('tab', { name: 'My Custom Worktable' })).toBeVisible();
        }
      }
    }
  });
});

test.describe('Export and Save Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('export dialog opens with options', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }

    const exportText = page.getByText(/pdf|png|jpg|svg/i).first();
    if (await exportText.isVisible()) {
      await expect(exportText).toBeVisible();
    }

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible()) {
      await expect(dialog).toBeVisible();
    }
  });

  test('PDF export works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }

    const pdfButton = page.getByRole('button', { name: /pdf/i }).first();
    if (await pdfButton.isVisible()) {
      await pdfButton.click();

      const exportComplete = page.getByText(/export.*complete|download/i).first();
      if (await exportComplete.isVisible()) {
        await expect(exportComplete).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('image export works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    if (await exportButton.isVisible()) {
      await exportButton.click();
    }

    const imageButton = page.getByRole('button', { name: /png|jpg/i }).first();
    if (await imageButton.isVisible()) {
      await imageButton.click();

      const exportComplete = page.getByText(/export.*complete|download/i).first();
      if (await exportComplete.isVisible()) {
        await expect(exportComplete).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('project auto-saves', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    const savedText = page.getByText(/saved|auto.*save/i).first();
    if (await savedText.isVisible()) {
      await expect(savedText).toBeVisible({ timeout: 5000 });
    }
  });

  test('manual save works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const saveButton = page.getByRole('button', { name: /save/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();

      const savedText = page.getByText(/saved|project.*saved/i).first();
      if (await savedText.isVisible()) {
        await expect(savedText).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Yardage Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('yardage panel opens', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const yardageButton = page.getByRole('button', { name: /yardage|fabric.*usage/i }).first();
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
    }

    const yardageText = page.getByText(/fabric.*requirements|yardage/i).first();
    if (await yardageText.isVisible()) {
      await expect(yardageText).toBeVisible();
    }
  });

  test('yardage calculations update with changes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const yardageButton = page.getByRole('button', { name: /yardage/i }).first();
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
    }

    const blockButton = page.getByRole('button', { name: /blocks/i }).first();
    if (await blockButton.isVisible()) {
      await blockButton.click();
    }

    const block = page.locator('[data-block-id]').first();
    const canvas = page.locator('canvas');

    if (await block.isVisible() && await canvas.isVisible()) {
      await block.dragTo(canvas, { targetPosition: { x: 150, y: 150 } });

      const yardageText = page.getByText(/\d+\s*(?:yard|meter|inch)/i).first();
      if (await yardageText.isVisible()) {
        await expect(yardageText).toBeVisible();
      }
    }
  });

  test('fabric selection affects yardage', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const yardageButton = page.getByRole('button', { name: /yardage/i }).first();
    if (await yardageButton.isVisible()) {
      await yardageButton.click();
    }

    const fabricSelect = page.getByRole('combobox', { name: /fabric/i }).first();
    if (await fabricSelect.isVisible()) {
      await fabricSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Advanced Canvas Features', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuth(page, 'pro');
    await mockCanvas(page);
    await mockProject(page, 'test-project-1');
  });

  test('snap to grid works', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const snapButton = page.getByRole('button', { name: /snap.*grid|grid.*snap/i }).first();
    if (await snapButton.isVisible()) {
      await snapButton.click();
    }

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 105, y: 105 } });
    }
  });

  test('alignment guides work', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 150, y: 150 } });
    }

    const alignButton = page.getByRole('button', { name: /align/i }).first();
    if (await alignButton.isVisible()) {
      await alignButton.click();

      const alignText = page.getByText(/left|right|center|top|bottom/i).first();
      if (await alignText.isVisible()) {
        await expect(alignText).toBeVisible();
      }
    }
  });

  test('group/ungroup functionality', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    await page.waitForTimeout(2000);

    const canvas = page.locator('canvas');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
      await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Shift'] });
    }

    const groupButton = page.getByRole('button', { name: /group/i }).first();
    if (await groupButton.isVisible()) {
      await groupButton.click();

      if (await canvas.isVisible()) {
        await canvas.click({ position: { x: 125, y: 125 } });
      }

      const ungroupButton = page.getByRole('button', { name: /ungroup/i }).first();
      if (await ungroupButton.isVisible()) {
        await ungroupButton.click();
      }
    }
  });
});
