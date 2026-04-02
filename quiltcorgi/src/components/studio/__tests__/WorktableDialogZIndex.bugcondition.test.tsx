/**
 * Bug Condition Exploration Test
 * 
 * Property 1: Bug Condition - Worktable Dialogs Appear Above Rulers
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * This test encodes the EXPECTED behavior - it will validate the fix when it passes.
 * 
 * Bug Condition: input.dialogType IN ['NewWorktableDialog', 'RenameDialog'] 
 *                AND input.dialogZIndex == 50 
 *                AND rulerZIndex == undefined
 * 
 * Expected Behavior: Dialogs SHALL appear above all studio UI elements including rulers
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { WorktableSwitcher } from '../WorktableSwitcher';
import { HorizontalRuler } from '../../canvas/HorizontalRuler';
import { VerticalRuler } from '../../canvas/VerticalRuler';
import * as fc from 'fast-check';

// Mock stores
vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      worktables: [
        { id: 'wt-1', name: 'Worktable 1', canvasData: {}, order: 0 },
        { id: 'wt-2', name: 'Worktable 2', canvasData: {}, order: 1 },
      ],
      activeWorktableId: 'wt-1',
      addWorktable: vi.fn(),
      renameWorktable: vi.fn(),
      duplicateWorktable: vi.fn(),
      deleteWorktable: vi.fn(),
      updateWorktableCanvas: vi.fn(),
      setActiveWorktableId: vi.fn(),
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/canvasStore', () => ({
  useCanvasStore: vi.fn((selector) => {
    const state = {
      fabricCanvas: null,
      zoom: 1,
      unitSystem: 'inches' as const,
      cursorPosition: { x: 0, y: 0 },
    };
    return selector(state);
  }),
}));

vi.mock('@/lib/canvas-utils', () => ({
  getPixelsPerUnit: vi.fn(() => 96),
}));

describe('Property 1: Bug Condition - Worktable Dialogs Appear Above Rulers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Case 1: HorizontalRuler z-index verification
   * 
   * Validates Requirement 1.3: Rulers have no explicit z-index (bug condition)
   * Validates Requirement 2.3: Rulers SHALL have explicit z-index below dialogs (expected behavior)
   * 
   * This test checks the className directly to verify z-index is present.
   * On unfixed code: className will NOT contain 'z-10' or similar
   * On fixed code: className WILL contain 'z-10'
   */
  it('HorizontalRuler should have explicit z-index in className (z-10)', () => {
    const { container } = render(<HorizontalRuler />);
    
    // Find the ruler container div
    const rulerElement = container.querySelector('.h-6.bg-surface');
    expect(rulerElement).toBeTruthy();
    
    // Get the className
    const className = rulerElement?.className || '';
    
    // CRITICAL ASSERTION: This encodes the EXPECTED behavior
    // On unfixed code: className will be "h-6 bg-surface border-b border-outline-variant ml-6"
    // On fixed code: className will include "z-10"
    // This assertion will FAIL on unfixed code, confirming the bug
    expect(className).toContain('z-10');
  });

  /**
   * Test Case 2: VerticalRuler z-index verification
   * 
   * Validates Requirement 1.3: Rulers have no explicit z-index (bug condition)
   * Validates Requirement 2.3: Rulers SHALL have explicit z-index below dialogs (expected behavior)
   */
  it('VerticalRuler should have explicit z-index in className (z-10)', () => {
    const { container } = render(<VerticalRuler />);
    
    // Find the ruler container div
    const rulerElement = container.querySelector('.w-6.bg-surface');
    expect(rulerElement).toBeTruthy();
    
    // Get the className
    const className = rulerElement?.className || '';
    
    // CRITICAL ASSERTION: This encodes the EXPECTED behavior
    // On unfixed code: className will be "w-6 bg-surface border-r border-outline-variant"
    // On fixed code: className will include "z-10"
    // This assertion will FAIL on unfixed code, confirming the bug
    expect(className).toContain('z-10');
  });

  /**
   * Test Case 3: Dialog z-index verification
   * 
   * Validates Requirements 1.1, 1.2: Dialogs use z-50
   * 
   * This test verifies that dialogs have z-50, which is correct.
   * The bug is that rulers have NO z-index, not that dialogs have the wrong z-index.
   */
  it('NewWorktableDialog overlay should have z-50 in className', () => {
    const { container } = render(<WorktableSwitcher />);
    
    // Click the "+" button to open NewWorktableDialog
    const addButton = container.querySelector('button[aria-label="Add worktable"]') as HTMLButtonElement;
    expect(addButton).toBeTruthy();
    act(() => {
      addButton?.click();
    });
    
    // Find the dialog overlay
    const dialogOverlay = container.querySelector('.fixed.inset-0');
    expect(dialogOverlay).toBeTruthy();
    
    // Get the className
    const className = dialogOverlay?.className || '';
    
    // Verify dialog has z-50 (this should pass on both unfixed and fixed code)
    expect(className).toContain('z-50');
  });

  /**
   * Test Case 4: Property-based test for ruler z-index
   * 
   * Validates Requirements 1.3, 2.3: Rulers must have explicit z-index
   * 
   * This property test verifies that both rulers have z-10 in their className.
   */
  it('Property: Both rulers should have z-10 in className', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('HorizontalRuler', 'VerticalRuler'),
        (rulerType) => {
          let container;
          let selector;
          
          if (rulerType === 'HorizontalRuler') {
            container = render(<HorizontalRuler />).container;
            selector = '.h-6.bg-surface';
          } else {
            container = render(<VerticalRuler />).container;
            selector = '.w-6.bg-surface';
          }
          
          const rulerElement = container.querySelector(selector) as HTMLElement;
          expect(rulerElement).toBeTruthy();
          
          const className = rulerElement?.className || '';
          
          // CRITICAL PROPERTY: Rulers must have z-10 in className
          // On unfixed code: this will FAIL
          // On fixed code: this will PASS
          expect(className).toContain('z-10');
        }
      ),
      { numRuns: 10 } // Run 10 times with both ruler types
    );
  });
});
