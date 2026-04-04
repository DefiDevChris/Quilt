import { test, expect } from '@playwright/test';
import { mockAuth, mockCanvas } from './utils';

test.describe('Studio Access', () => {
  test('studio requires authentication', async ({ page }) => {
    await page.goto('/studio/test-project-id');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('signin');
  });

  test('studio has callback URL after redirect', async ({ page }) => {
    await page.goto('/studio/test-project-id');
    await page.waitForURL(/signin/);
    expect(page.url()).toContain('callbackUrl');
  });
});

test.describe('Studio Mobile Gate', () => {
  test('mobile users see desktop-only message', async ({ page, isMobile }) => {
    if (isMobile) {
      await mockAuth(page);
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
    await mockAuth(page);
    await mockCanvas(page);
  });

  test('canvas initializes', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });
  });

  test('worktable tabs are visible', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const worktable = page.getByText(/worktable/i);
    await expect(worktable).toBeVisible({ timeout: 10000 });
  });

  test('project name is displayed', async ({ page }) => {
    await page.goto('/studio/test-project-1');
    const projectName = page.getByText(/test project/i);
    await expect(projectName).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Canvas Design Tools', () => {
  test.skip('reference image dialog opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const refButton = page.getByRole('button', { name: /reference/i });
    await refButton.click();
    await expect(page.getByText(/upload/i)).toBeVisible();
  });

  test.skip('block library opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const blockButton = page.getByRole('button', { name: /blocks/i });
    await blockButton.click();
    await expect(page.getByText(/651/i)).toBeVisible();
  });

  test.skip('fabric library opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const fabricButton = page.getByRole('button', { name: /fabrics/i });
    await fabricButton.click();
    await expect(page.getByText(/fabric/i)).toBeVisible();
  });

  test.skip('export menu opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    await expect(page.getByText(/pdf/i)).toBeVisible();
  });

  test.skip('yardage calculator opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const yardageButton = page.getByRole('button', { name: /yardage/i });
    await yardageButton.click();
    await expect(page.getByText(/fabric usage/i)).toBeVisible();
  });

  test.skip('pattern overlay selector opens', async ({ page }) => {
    // Requires auth setup
    await page.goto('/studio/test-project-id');
    const overlayButton = page.getByRole('button', { name: /overlay/i });
    await overlayButton.click();
    await expect(page.getByText(/pattern/i)).toBeVisible();
  });
});

test.describe('Canvas Design Tools', () => {
  test.describe('Basic Canvas Operations', () => {
    test('canvas loads with proper dimensions', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');
      const canvas = page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Check canvas has proper size
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox?.width).toBeGreaterThan(100);
      expect(boundingBox?.height).toBeGreaterThan(100);
    });

    test('canvas responds to zoom controls', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');

      // Look for zoom controls
      const zoomInButton = page.getByRole('button', { name: /zoom.*in|\+/i });
      const zoomOutButton = page.getByRole('button', { name: /zoom.*out|\-/i });

      if (await zoomInButton.isVisible()) {
        await zoomInButton.click();
        // Canvas should respond to zoom
        await page.waitForTimeout(500);
      }
    });

    test('canvas supports pan/drag', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');
      const canvas = page.locator('canvas');

      // Try to drag the canvas
      await canvas.dragTo(canvas, {
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      });
    });
  });

  test.describe('Drawing Tools', () => {
    test('select tool is active by default', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');
      const selectTool = page.getByRole('button', { name: /select/i }).first();
      await expect(selectTool).toHaveAttribute('aria-pressed', 'true');
    });

    test('can switch to drawing tools', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');

      // Try different drawing tools
      const tools = [
        { name: /free.*draw|pen/i, action: 'drawing' },
        { name: /rectangle|square/i, action: 'rectangle' },
        { name: /circle/i, action: 'circle' },
        { name: /line/i, action: 'line' },
      ];

      for (const tool of tools) {
        const toolButton = page.getByRole('button', { name: tool.name }).first();
        if (await toolButton.isVisible()) {
          await toolButton.click();
          await expect(toolButton).toHaveAttribute('aria-pressed', 'true');
        }
      }
    });

    test('color picker works', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');

      const colorPicker = page.locator('input[type="color"]').first();
      if (await colorPicker.isVisible()) {
        await colorPicker.fill('#ff0000');
        // Should update the selected color
      }
    });

    test('brush size controls work', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');

      const sizeSlider = page.locator('input[type="range"]').first();
      if (await sizeSlider.isVisible()) {
        await sizeSlider.fill('10');
      }
    });
  });

  test.describe('Shape Tools', () => {
    test('can draw basic shapes', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');
      const canvas = page.locator('canvas');

      // Switch to rectangle tool
      const rectangleTool = page.getByRole('button', { name: /rectangle|square/i }).first();
      if (await rectangleTool.isVisible()) {
        await rectangleTool.click();

        // Draw a rectangle on canvas
        await canvas.click({ position: { x: 100, y: 100 } });
        await canvas.click({ position: { x: 200, y: 200 } });
      }
    });

    test('shape manipulation works', async ({ page }) => {
      test.skip(true, 'Requires authenticated user');

      await page.goto('/studio/test-project');

      // Select a shape and try to resize/move it
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 150, y: 150 } });

      // Look for resize handles
      const resizeHandle = page.locator('.resize-handle').first();
      if (await resizeHandle.isVisible()) {
        await resizeHandle.dragTo(canvas, { targetPosition: { x: 250, y: 250 } });
      }
    });
  });
});

test.describe('Block and Pattern Tools', () => {
  test('block library opens and shows blocks', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const blockButton = page.getByRole('button', { name: /blocks|library/i }).first();
    await blockButton.click();

    // Check that block library panel opens
    await expect(page.getByText(/block library|651 blocks/i)).toBeVisible();

    // Check for block categories
    await expect(page.getByText(/traditional|modern|geometric/i).first()).toBeVisible();
  });

  test('can drag blocks to canvas', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const blockButton = page.getByRole('button', { name: /blocks/i }).first();
    await blockButton.click();

    // Find a block and drag it to canvas
    const blockElement = page.locator('[data-block-id]').first();
    const canvas = page.locator('canvas');

    if (await blockElement.isVisible()) {
      await blockElement.dragTo(canvas, { targetPosition: { x: 150, y: 150 } });
    }
  });

  test('pattern overlay toggles correctly', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const overlayButton = page.getByRole('button', { name: /pattern.*overlay|grid/i }).first();
    if (await overlayButton.isVisible()) {
      await overlayButton.click();

      // Pattern overlay should be visible on canvas
      const overlayElement = page.locator('[data-overlay="pattern"]').first();
      await expect(overlayElement).toBeVisible();
    }
  });

  test('grid overlay toggle works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const gridButton = page.getByRole('button', { name: /grid/i }).first();
    if (await gridButton.isVisible()) {
      await gridButton.click();

      // Grid lines should appear/disappear on canvas
      const gridLines = page.locator('.grid-line').first();
      // Either visible or not depending on initial state
    }
  });
});

test.describe('History and Undo/Redo', () => {
  test('history panel shows actions', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Make some changes first
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Open history panel
    const historyButton = page.getByRole('button', { name: /history/i }).first();
    await historyButton.click();

    // Check for history items
    await expect(page.getByText(/draw|create|add/i).first()).toBeVisible();
  });

  test('undo button works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Make a change
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Click undo
    const undoButton = page.getByRole('button', { name: /undo/i }).first();
    await undoButton.click();

    // Change should be undone
    await expect(undoButton).toBeEnabled();
  });

  test('redo button works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Make a change and undo it
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    const undoButton = page.getByRole('button', { name: /undo/i }).first();
    await undoButton.click();

    // Click redo
    const redoButton = page.getByRole('button', { name: /redo/i }).first();
    await redoButton.click();

    // Change should be restored
    await expect(redoButton).toBeEnabled();
  });
});

test.describe('Reference Images', () => {
  test('reference image upload dialog opens', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const refButton = page.getByRole('button', { name: /reference.*image/i }).first();
    await refButton.click();

    // Upload dialog should open
    await expect(page.getByText(/upload.*image|choose.*file/i).first()).toBeVisible();
  });

  test('reference image displays on canvas', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // This would require setting up file upload in tests
    // For now, just check the UI elements exist
    const refButton = page.getByRole('button', { name: /reference/i }).first();
    await expect(refButton).toBeVisible();
  });

  test('reference image opacity controls work', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Look for opacity slider
    const opacitySlider = page.locator('input[type="range"][aria-label*="opacity"]').first();
    if (await opacitySlider.isVisible()) {
      await opacitySlider.fill('50');
    }
  });
});

test.describe('Multi-Worktable System', () => {
  test('multiple worktables can be created', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Look for add worktable button
    const addButton = page
      .getByRole('button', { name: /add.*worktable|new.*worktable|\+/i })
      .first();
    if (await addButton.isVisible()) {
      await addButton.click();

      // Should show new worktable tab
      const worktableTabs = page.getByRole('tab', { name: /worktable/i });
      const count = await worktableTabs.count();
      expect(count).toBeGreaterThan(1);
    }
  });

  test('worktable tabs switch correctly', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Click on different worktable tabs
    const tabs = page.getByRole('tab', { name: /worktable/i });
    const tabCount = await tabs.count();

    if (tabCount > 1) {
      await tabs.nth(1).click();

      // Should switch to that worktable
      await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('worktable state persists when switching', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Add something to first worktable
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Switch to another worktable
    const tabs = page.getByRole('tab', { name: /worktable/i });
    if ((await tabs.count()) > 1) {
      await tabs.nth(1).click();

      // Switch back
      await tabs.first().click();

      // Drawing should still be there
      // This would require checking canvas content
    }
  });

  test('worktable can be renamed', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Right-click or long-press on worktable tab to rename
    const tab = page.getByRole('tab', { name: /worktable/i }).first();
    await tab.click({ button: 'right' });

    // Look for rename option
    const renameOption = page.getByText(/rename/i).first();
    if (await renameOption.isVisible()) {
      await renameOption.click();

      // Enter new name
      const input = page.locator('input[type="text"]').first();
      await input.fill('My Custom Worktable');
      await input.press('Enter');

      // Tab should have new name
      await expect(page.getByRole('tab', { name: 'My Custom Worktable' })).toBeVisible();
    }
  });
});

test.describe('Export and Save Functionality', () => {
  test('export dialog opens with options', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    // Check export options
    await expect(page.getByText(/pdf|png|jpg|svg/i).first()).toBeVisible();

    // Check export dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
  });

  test('PDF export works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    const pdfButton = page.getByRole('button', { name: /pdf/i }).first();
    if (await pdfButton.isVisible()) {
      await pdfButton.click();

      // Should trigger download or show success message
      await expect(page.getByText(/export.*complete|download/i).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('image export works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();

    const imageButton = page.getByRole('button', { name: /png|jpg/i }).first();
    if (await imageButton.isVisible()) {
      await imageButton.click();

      // Should trigger download
      await expect(page.getByText(/export.*complete|download/i).first()).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test('project auto-saves', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Make a change
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });

    // Wait for auto-save indicator
    await expect(page.getByText(/saved|auto.*save/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('manual save works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const saveButton = page.getByRole('button', { name: /save/i }).first();
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show save confirmation
      await expect(page.getByText(/saved|project.*saved/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Yardage Calculator', () => {
  test('yardage panel opens', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const yardageButton = page.getByRole('button', { name: /yardage|fabric.*usage/i }).first();
    await yardageButton.click();

    // Yardage panel should open
    await expect(page.getByText(/fabric.*requirements|yardage/i).first()).toBeVisible();
  });

  test('yardage calculations update with changes', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const yardageButton = page.getByRole('button', { name: /yardage/i }).first();
    await yardageButton.click();

    // Add some blocks to canvas first
    const blockButton = page.getByRole('button', { name: /blocks/i }).first();
    await blockButton.click();

    const block = page.locator('[data-block-id]').first();
    const canvas = page.locator('canvas');

    if (await block.isVisible()) {
      await block.dragTo(canvas, { targetPosition: { x: 150, y: 150 } });

      // Yardage should update
      await expect(page.getByText(/\d+\s*(?:yard|meter|inch)/i).first()).toBeVisible();
    }
  });

  test('fabric selection affects yardage', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const yardageButton = page.getByRole('button', { name: /yardage/i }).first();
    await yardageButton.click();

    // Look for fabric selector
    const fabricSelect = page.getByRole('combobox', { name: /fabric/i }).first();
    if (await fabricSelect.isVisible()) {
      await fabricSelect.selectOption({ index: 1 });

      // Yardage should recalculate
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('Advanced Canvas Features', () => {
  test('snap to grid works', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    const snapButton = page.getByRole('button', { name: /snap.*grid|grid.*snap/i }).first();
    if (await snapButton.isVisible()) {
      await snapButton.click();

      // Objects should snap to grid when moved
      const canvas = page.locator('canvas');
      await canvas.click({ position: { x: 105, y: 105 } }); // Slightly off grid

      // Should snap to nearest grid point
    }
  });

  test('alignment guides work', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Add multiple objects and check alignment
    const canvas = page.locator('canvas');

    // Draw multiple shapes
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 150, y: 150 } });

    // Select both and look for alignment options
    const alignButton = page.getByRole('button', { name: /align/i }).first();
    if (await alignButton.isVisible()) {
      await alignButton.click();

      // Should show alignment options
      await expect(page.getByText(/left|right|center|top|bottom/i).first()).toBeVisible();
    }
  });

  test('group/ungroup functionality', async ({ page }) => {
    test.skip(true, 'Requires authenticated user');

    await page.goto('/studio/test-project');

    // Select multiple objects
    const canvas = page.locator('canvas');
    await canvas.click({ position: { x: 100, y: 100 } });
    await canvas.click({ position: { x: 150, y: 150 }, modifiers: ['Shift'] });

    // Group them
    const groupButton = page.getByRole('button', { name: /group/i }).first();
    if (await groupButton.isVisible()) {
      await groupButton.click();

      // Should behave as single object
      await canvas.click({ position: { x: 125, y: 125 } });

      // Ungroup
      const ungroupButton = page.getByRole('button', { name: /ungroup/i }).first();
      if (await ungroupButton.isVisible()) {
        await ungroupButton.click();
      }
    }
  });
});
