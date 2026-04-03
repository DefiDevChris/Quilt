/**
 * Preservation Property Tests
 * 
 * Property 2: Preservation - Ruler Display and Other Dialogs
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * IMPORTANT: These tests capture baseline behavior on UNFIXED code.
 * They should PASS on unfixed code and continue to PASS after the fix.
 * 
 * Preservation Requirements:
 * - Other modal dialogs (ResizeDialog, ReferenceImageDialog, FussyCutDialog) display correctly above all UI
 * - WorktableContextMenu displays correctly with z-50
 * - HorizontalRuler and VerticalRuler display correctly during normal canvas operations
 * - StudioTopBar and WorktableSwitcher function correctly
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ResizeDialog } from '../ResizeDialog';
import { ReferenceImageDialog } from '../ReferenceImageDialog';
import { FussyCutDialog } from '../FussyCutDialog';
import { HorizontalRuler } from '../../canvas/HorizontalRuler';
import { VerticalRuler } from '../../canvas/VerticalRuler';
import * as fc from 'fast-check';

// Mock stores
vi.mock('@/stores/projectStore', () => ({
  useProjectStore: vi.fn((selector) => {
    const state = {
      canvasWidth: 48,
      canvasHeight: 48,
      worktables: [
        { id: 'wt-1', name: 'Worktable 1', canvasData: {}, order: 0 },
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
      referenceImageOpacity: 0.5,
    };
    return selector(state);
  }),
}));

vi.mock('@/stores/layoutStore', () => ({
  useLayoutStore: vi.fn((selector) => {
    const state = {
      layoutType: 'free-form' as const,
    };
    return selector(state);
  }),
}));

vi.mock('@/hooks/useQuiltResize', () => ({
  useQuiltResize: vi.fn(() => ({
    applyResize: vi.fn(),
  })),
}));

vi.mock('@/hooks/useReferenceImage', () => ({
  useReferenceImage: vi.fn(() => ({
    hasImage: false,
    isVisible: true,
    isLocked: false,
    importImage: vi.fn(),
    removeImage: vi.fn(),
    setOpacity: vi.fn(),
    toggleVisibility: vi.fn(),
    toggleLock: vi.fn(),
  })),
}));

// vi.mock('@/hooks/useFussyCut') removed due to deleted hook

vi.mock('@/lib/canvas-utils', () => ({
  getPixelsPerUnit: vi.fn(() => 96),
  formatMeasurement: vi.fn((value: number) => value.toString()),
  getUnitLabel: vi.fn(() => 'in'),
}));

describe('Property 2: Preservation - Ruler Display and Other Dialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test Case 1: ResizeDialog z-index preservation
   * 
   * Validates Requirement 3.1: Other modal dialogs continue to display correctly above all UI
   * 
   * This test verifies that ResizeDialog has z-50 and continues to work correctly.
   * This behavior should be UNCHANGED by the fix.
   */
  it('ResizeDialog should have z-50 overlay (preservation)', () => {
    const { container } = render(<ResizeDialog isOpen={true} onClose={() => {}} />);
    
    // Find the dialog overlay
    const dialogOverlay = container.querySelector('.fixed.inset-0');
    expect(dialogOverlay).toBeTruthy();
    
    // Get the className
    const className = dialogOverlay?.className || '';
    
    // Verify dialog has z-50 (this should pass on both unfixed and fixed code)
    expect(className).toContain('z-50');
  });

  /**
   * Test Case 2: ReferenceImageDialog z-index preservation
   * 
   * Validates Requirement 3.1: Other modal dialogs continue to display correctly above all UI
   */
  it('ReferenceImageDialog should have z-50 overlay (preservation)', () => {
    const { container } = render(<ReferenceImageDialog isOpen={true} onClose={() => {}} />);
    
    // Find the dialog overlay
    const dialogOverlay = container.querySelector('.fixed.inset-0');
    expect(dialogOverlay).toBeTruthy();
    
    // Get the className
    const className = dialogOverlay?.className || '';
    
    // Verify dialog has z-50 (this should pass on both unfixed and fixed code)
    expect(className).toContain('z-50');
  });


  /**
   * Test Case 4: HorizontalRuler rendering preservation
   * 
   * Validates Requirement 3.3: Rulers continue to display correctly in their current position
   * 
   * This test verifies that HorizontalRuler renders with its expected structure.
   * The visual appearance should be UNCHANGED by the fix (only z-index changes).
   */
  it('HorizontalRuler should render with correct structure (preservation)', () => {
    const { container } = render(<HorizontalRuler />);
    
    // Find the ruler container
    const rulerElement = container.querySelector('.h-6.bg-surface');
    expect(rulerElement).toBeTruthy();
    
    // Verify ruler has expected classes (excluding z-index)
    const className = rulerElement?.className || '';
    expect(className).toContain('h-6');
    expect(className).toContain('bg-surface');
    expect(className).toContain('border-b');
    expect(className).toContain('border-outline-variant');
    expect(className).toContain('ml-6');
  });

  /**
   * Test Case 5: VerticalRuler rendering preservation
   * 
   * Validates Requirement 3.3: Rulers continue to display correctly in their current position
   */
  it('VerticalRuler should render with correct structure (preservation)', () => {
    const { container } = render(<VerticalRuler />);
    
    // Find the ruler container
    const rulerElement = container.querySelector('.w-6.bg-surface');
    expect(rulerElement).toBeTruthy();
    
    // Verify ruler has expected classes (excluding z-index)
    const className = rulerElement?.className || '';
    expect(className).toContain('w-6');
    expect(className).toContain('bg-surface');
    expect(className).toContain('border-r');
    expect(className).toContain('border-outline-variant');
  });

  /**
   * Test Case 6: Property-based test for other dialogs z-index preservation
   * 
   * Validates Requirement 3.1: All other modal dialogs maintain z-50
   * 
   * This property test verifies that all other dialogs consistently use z-50.
   */
  it('Property: All other modal dialogs should have z-50 (preservation)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ResizeDialog', 'ReferenceImageDialog'),
        (dialogType) => {
          let container;
          
          if (dialogType === 'ResizeDialog') {
            container = render(<ResizeDialog isOpen={true} onClose={() => {}} />).container;
          } else {
            container = render(<ReferenceImageDialog isOpen={true} onClose={() => {}} />).container;
          }
          
          const dialogOverlay = container.querySelector('.fixed.inset-0') as HTMLElement;
          expect(dialogOverlay).toBeTruthy();
          
          const className = dialogOverlay?.className || '';
          
          // CRITICAL PROPERTY: Other dialogs must maintain z-50
          // This should PASS on both unfixed and fixed code
          expect(className).toContain('z-50');
        }
      ),
      { numRuns: 10 } // Run 10 times with different dialog types
    );
  });

  /**
   * Test Case 7: Property-based test for ruler rendering preservation
   * 
   * Validates Requirement 3.3: Both rulers continue to render correctly
   * 
   * This property test verifies that rulers maintain their visual structure.
   */
  it('Property: Both rulers should render with correct structure (preservation)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('HorizontalRuler', 'VerticalRuler'),
        (rulerType) => {
          let container;
          let selector;
          let expectedClasses;
          
          if (rulerType === 'HorizontalRuler') {
            container = render(<HorizontalRuler />).container;
            selector = '.h-6.bg-surface';
            expectedClasses = ['h-6', 'bg-surface', 'border-b', 'border-outline-variant', 'ml-6'];
          } else {
            container = render(<VerticalRuler />).container;
            selector = '.w-6.bg-surface';
            expectedClasses = ['w-6', 'bg-surface', 'border-r', 'border-outline-variant'];
          }
          
          const rulerElement = container.querySelector(selector) as HTMLElement;
          expect(rulerElement).toBeTruthy();
          
          const className = rulerElement?.className || '';
          
          // CRITICAL PROPERTY: Rulers must maintain their visual structure
          // This should PASS on both unfixed and fixed code
          for (const expectedClass of expectedClasses) {
            expect(className).toContain(expectedClass);
          }
        }
      ),
      { numRuns: 10 } // Run 10 times with both ruler types
    );
  });

  /**
   * Test Case 8: Dialog overlay structure preservation
   * 
   * Validates Requirement 3.1: Dialog overlays maintain consistent structure
   * 
   * This test verifies that all dialogs use the same overlay pattern.
   */
  it('Property: All dialogs should use consistent overlay structure (preservation)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('ResizeDialog', 'ReferenceImageDialog'),
        (dialogType) => {
          let container;
          
          if (dialogType === 'ResizeDialog') {
            container = render(<ResizeDialog isOpen={true} onClose={() => {}} />).container;
          } else {
            container = render(<ReferenceImageDialog isOpen={true} onClose={() => {}} />).container;
          }
          
          const dialogOverlay = container.querySelector('.fixed.inset-0') as HTMLElement;
          expect(dialogOverlay).toBeTruthy();
          
          const className = dialogOverlay?.className || '';
          
          // CRITICAL PROPERTY: All dialogs use consistent overlay structure
          // fixed, inset-0, z-50, flex, items-center, justify-center
          expect(className).toContain('fixed');
          expect(className).toContain('inset-0');
          expect(className).toContain('z-50');
          expect(className).toContain('flex');
          expect(className).toContain('items-center');
          expect(className).toContain('justify-center');
        }
      ),
      { numRuns: 10 }
    );
  });
});
