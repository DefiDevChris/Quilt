// @vitest-environment jsdom
/**
 * Bug Condition Exploration Test: Toolbar Layout Consistency
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test verifies that toolbar with odd tool counts displays all tools in consistent 
 * 2-column grid without centering orphans.
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * 
 * The test encodes the expected behavior - it will validate the fix when it passes after implementation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Toolbar } from '@/components/studio/Toolbar';
import { useCanvasStore } from '@/stores/canvasStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useYardageStore } from '@/stores/yardageStore';
import { usePrintlistStore } from '@/stores/printlistStore';

describe('Bug Condition 2: Toolbar Displays Irregular 2-1-2-1 Pattern', () => {
  beforeEach(() => {
    // Reset all stores to initial state
    useCanvasStore.getState().reset();
    useLayoutStore.getState().reset();
    useYardageStore.getState().reset();
    usePrintlistStore.getState().reset();
    
    // Set active worktable to 'quilt' to test the 2-column grid layout
    useCanvasStore.setState({ activeWorktable: 'quilt' });
  });

  it('Toolbar with odd tool count should display all tools in consistent 2-column grid without centering orphans', () => {
    // Arrange: Render toolbar with quilt worktable (which has multiple primary tools)
    const { container } = render(<Toolbar />);
    
    // Find all toolbar grid containers (there may be multiple groups)
    const gridContainers = container.querySelectorAll('.grid.grid-cols-2');
    expect(gridContainers.length).toBeGreaterThan(0);
    
    // Act: Check each grid container for orphan centering
    let foundOrphanCentering = false;
    let totalCenteredOrphans = 0;
    
    gridContainers.forEach(gridContainer => {
      // Get all direct children of the grid
      const gridChildren = Array.from(gridContainer.children);
      
      // Check for orphan centering pattern: div with col-span-2 and justify-center
      const centeredOrphans = gridChildren.filter(child => {
        const element = child as HTMLElement;
        return element.classList.contains('col-span-2') && 
               element.classList.contains('justify-center');
      });
      
      if (centeredOrphans.length > 0) {
        foundOrphanCentering = true;
        totalCenteredOrphans += centeredOrphans.length;
      }
    });
    
    // Assert: No tools should be centered with col-span-2
    // BUG: On unfixed code, this will FAIL because orphan tools are centered
    // Expected behavior: All tools should maintain left-aligned grid flow
    expect(totalCenteredOrphans).toBe(0);
    expect(foundOrphanCentering).toBe(false);
  });

  it('should document the bug condition and expected counterexamples', () => {
    // This test documents the expected failure pattern
    // When run on unfixed code, the above test will fail because:
    // 1. Orphan tools (last tool when count is odd) are wrapped in divs with col-span-2
    // 2. These wrapper divs have justify-center class, centering the orphan tool
    // 3. This breaks the consistent 2-column grid structure
    
    // Expected counterexamples from the bug:
    // - Toolbar with 5 primary tools: 5th tool is centered with col-span-2 (creates 2-1 pattern)
    // - Toolbar with 7 primary tools: 7th tool is centered with col-span-2 (creates 2-2-2-1 pattern)
    // - Any group with odd tool count will have the last tool centered
    
    // Root cause (from Toolbar.tsx renderToolGroup function):
    // ```typescript
    // const isOrphan = index === tools.length - 1 && tools.length % 2 !== 0;
    // return isOrphan ? (
    //   <div key={tool.id} className="col-span-2 flex justify-center">{icon}</div>
    // ) : (icon);
    // ```
    
    // Expected behavior after fix:
    // - All tools should be rendered directly without wrapper divs
    // - CSS grid should naturally flow tools left-to-right, top-to-bottom
    // - Last tool (if odd count) should be in the left column of the last row
    // - No col-span-2 or justify-center classes should be applied to orphan tools
    
    expect(true).toBe(true); // Placeholder to document expected behavior
  });
});
