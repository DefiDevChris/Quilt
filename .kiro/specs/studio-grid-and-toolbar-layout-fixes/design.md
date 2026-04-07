# Studio Grid and Toolbar Layout Fixes - Bugfix Design

## Overview

This design addresses two distinct bugs in the QuiltCorgi studio interface:

1. **Grid options not working**: Layout presets (Grid 3×3, Grid 4×4, Grid 5×5, sashing, on-point) update the layout store but fail to render on the canvas because the canvas dimensions are not updated and the viewport is not centered/fitted.

2. **Toolbar layout inconsistency**: The left toolbar displays tools in an irregular 2-1-2-1 pattern due to orphan tools being centered with `col-span-2`, breaking the intended 2-column grid structure.

The fix strategy is minimal and targeted: for Bug 1, trigger canvas dimension updates and viewport centering when layout presets are selected; for Bug 2, remove the orphan-centering logic to maintain consistent grid alignment.

## Glossary

- **Bug_Condition_1 (C1)**: The condition that triggers the grid rendering bug - when a user clicks a layout preset but the canvas dimensions are not updated
- **Bug_Condition_2 (C2)**: The condition that triggers the toolbar layout bug - when an odd number of tools causes the last tool to be centered across both columns
- **Property_1 (P1)**: The desired behavior for grid presets - canvas dimensions should update and viewport should center/fit to show the layout
- **Property_2 (P2)**: The desired behavior for toolbar layout - all tools should maintain a consistent 2-column grid without centering orphans
- **Preservation**: Existing behaviors that must remain unchanged (free canvas mode, drag-and-drop, other worktable toolbars, etc.)
- **layoutStore**: Zustand store in `src/stores/layoutStore.ts` that manages layout configuration (rows, cols, blockSize, sashing, borders)
- **canvasStore**: Zustand store in `src/stores/canvasStore.ts` that manages canvas state including viewport and zoom
- **LayoutSelector**: Component in `src/components/studio/LayoutSelector.tsx` that renders layout preset options
- **Toolbar**: Component in `src/components/studio/Toolbar.tsx` that renders the left toolbar with tool icons
- **renderToolGroup**: Function in Toolbar.tsx that renders a group of tools in a grid layout
- **centerAndFitViewport**: Method in canvasStore that centers and fits the viewport to show the current canvas dimensions

## Bug Details

### Bug Condition 1: Grid Options Not Working

The bug manifests when a user clicks on any grid layout preset (Grid 3×3, Grid 4×4, Grid 5×5, sashing, or on-point) in the Layout Library panel. The `LayoutSelector` component updates the layout store state (rows, cols, blockSize, sashing) but does not trigger any canvas dimension updates or viewport adjustments, leaving the canvas unchanged.

**Formal Specification:**
```
FUNCTION isBugCondition1(input)
  INPUT: input of type { presetId: string, layoutType: LayoutType }
  OUTPUT: boolean
  
  RETURN input.layoutType IN ['grid', 'sashing', 'on-point']
         AND layoutStoreUpdated(input.presetId)
         AND NOT canvasDimensionsUpdated()
         AND NOT viewportCenteredAndFitted()
END FUNCTION
```

### Bug Condition 2: Toolbar Layout Inconsistency

The bug manifests when the quilt worktable toolbar renders with an odd number of tools in a group. The `renderToolGroup` function detects orphan tools (last tool when count is odd) and applies `col-span-2` with centered alignment, breaking the 2-column grid structure.

**Formal Specification:**
```
FUNCTION isBugCondition2(input)
  INPUT: input of type { tools: ToolDef[], groupIndex: number }
  OUTPUT: boolean
  
  RETURN input.tools.length % 2 !== 0
         AND isLastTool(input.tools[input.tools.length - 1])
         AND appliesColSpan2(input.tools[input.tools.length - 1])
END FUNCTION
```

### Examples

**Bug 1 Examples:**
- User clicks "Grid 3×3" preset → layoutStore updates to rows=3, cols=3, blockSize=6 → canvas remains at previous dimensions → grid is not visible
- User clicks "Grid 4×4 with Sashing" preset → layoutStore updates with sashing.width=1 → canvas dimensions do not include sashing → layout is not rendered
- User clicks "On-Point 3×3" preset → layoutStore updates to layoutType='on-point' → canvas dimensions do not account for rotation → on-point grid is not visible
- Edge case: User clicks "No Layout (Free Canvas)" → layoutType='free-form' → canvas dimensions should NOT be constrained (expected behavior)

**Bug 2 Examples:**
- Toolbar renders with 5 primary tools → first 4 tools display in 2×2 grid → 5th tool is centered with col-span-2 → creates 2-1 pattern
- Toolbar renders with 7 primary tools → first 6 tools display in 3×2 grid → 7th tool is centered with col-span-2 → creates 2-2-2-1 pattern
- Edge case: Toolbar renders with 6 primary tools → all tools display in 3×2 grid → no orphan, layout is correct (expected behavior)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Free canvas mode ("No Layout (Free Canvas)") must continue to set layoutType='free-form' without applying grid dimensions
- Drag-and-drop of layout presets must continue to work using the existing drag handler
- Block worktable toolbar must continue to display tools in single-column layout
- Layout worktable toolbar must continue to display tools in single-column layout
- Advanced tools collapse/expand functionality must continue to work
- Tool selection and activation must continue to work for all tools
- Layout preset thumbnails must continue to display SVG images from PRESET_SVG mapping
- Clicking an already-active preset must continue to maintain selection state

**Scope:**
All inputs that do NOT involve clicking grid/sashing/on-point layout presets (Bug 1) or rendering quilt worktable toolbar with odd tool counts (Bug 2) should be completely unaffected by this fix. This includes:
- Free canvas selection
- Drag-and-drop interactions
- Block and layout worktable toolbars
- Mouse interactions with tools
- Keyboard shortcuts
- Canvas zoom and pan operations

## Hypothesized Root Cause

### Bug 1: Grid Options Not Working

Based on the bug description and code analysis, the root cause is:

1. **Missing Canvas Dimension Update**: The `LayoutSelector.handleSelectPreset` function updates the layout store (rows, cols, blockSize, sashing) but does not trigger any mechanism to update the canvas dimensions. The canvas dimensions are likely managed separately (possibly in a project store or canvas initialization logic) and are not automatically synchronized with layout store changes.

2. **Missing Viewport Centering**: Even if canvas dimensions were updated, there is no call to `centerAndFitViewport()` to ensure the new layout is visible to the user. The viewport remains at its previous pan/zoom state.

3. **No Bridge Between Stores**: The layout store and canvas store are independent. There is no reactive effect or callback that listens to layout store changes and updates canvas dimensions accordingly.

### Bug 2: Toolbar Layout Inconsistency

Based on the code in `Toolbar.tsx`, the root cause is:

1. **Orphan Detection Logic**: The `renderToolGroup` function includes this code:
   ```typescript
   const isOrphan = index === tools.length - 1 && tools.length % 2 !== 0;
   ```

2. **Centering Logic**: When an orphan is detected, the tool is wrapped in a div with `col-span-2` and `justify-center`:
   ```typescript
   return isOrphan ? (
     <div key={tool.id} className="col-span-2 flex justify-center">
       {icon}
     </div>
   ) : (
     icon
   );
   ```

3. **Design Intent Mismatch**: This centering logic was likely intended to make orphan tools visually balanced, but it breaks the consistent 2-column grid structure that users expect.

## Correctness Properties

Property 1: Bug Condition 1 - Grid Layout Presets Render on Canvas

_For any_ layout preset selection where the preset type is 'grid', 'sashing', or 'on-point', the fixed LayoutSelector component SHALL update the layout store state AND trigger canvas dimension updates to match the layout dimensions (accounting for rows, cols, blockSize, and sashing) AND call centerAndFitViewport() to ensure the layout is visible.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

Property 2: Bug Condition 2 - Toolbar Maintains Consistent 2-Column Grid

_For any_ toolbar rendering where the quilt worktable is active and tools are displayed in groups, the fixed renderToolGroup function SHALL display all tools in a consistent 2-column grid layout without applying col-span-2 or centering logic to orphan tools, maintaining left-aligned grid flow.

**Validates: Requirements 3.6, 3.7, 3.8**

Property 3: Preservation - Free Canvas Mode Unchanged

_For any_ layout selection where the user clicks "No Layout (Free Canvas)", the fixed code SHALL produce exactly the same behavior as the original code, setting layoutType='free-form' without applying grid dimensions or viewport centering.

**Validates: Requirements 4.1**

Property 4: Preservation - Non-Quilt Worktable Toolbars Unchanged

_For any_ toolbar rendering where the active worktable is 'block' or 'layout', the fixed code SHALL produce exactly the same single-column layout as the original code, preserving the existing toolbar structure.

**Validates: Requirements 4.3, 4.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/studio/LayoutSelector.tsx`

**Function**: `handleSelectPreset`

**Specific Changes**:
1. **Import canvas store**: Add `import { useCanvasStore } from '@/stores/canvasStore';` at the top
2. **Import project store**: Add import for the store that manages canvas dimensions (likely `useProjectStore` or similar)
3. **Update canvas dimensions**: After updating layout store, calculate total canvas width and height:
   - Width: `cols * blockSize + sashing.width * (cols - 1)` (for grid/sashing)
   - Height: `rows * blockSize + sashing.width * (rows - 1)` (for grid/sashing)
   - For on-point: use rotated dimensions calculation
4. **Center and fit viewport**: Call `useCanvasStore.getState().centerAndFitViewport()` after dimension update
5. **Conditional logic**: Only apply dimension updates and viewport centering when layoutType is NOT 'free-form'

**File**: `src/components/studio/Toolbar.tsx`

**Function**: `renderToolGroup`

**Specific Changes**:
1. **Remove orphan detection**: Delete the `isOrphan` variable and conditional logic
2. **Simplify rendering**: Always render tools directly without wrapping orphans in centered divs
3. **Maintain grid structure**: Let CSS grid naturally flow tools left-to-right, top-to-bottom

### Pseudocode for Bug 1 Fix

```
FUNCTION handleSelectPreset(preset)
  // Existing logic
  setLayoutType(preset.config.type)
  setSelectedPreset(preset.id)
  setRows(preset.config.rows)
  setCols(preset.config.cols)
  setBlockSize(preset.config.blockSize)
  setSashing(preset.config.sashing)
  
  // NEW: Update canvas dimensions
  IF preset.config.type IN ['grid', 'sashing', 'on-point'] THEN
    totalWidth := calculateLayoutWidth(preset.config)
    totalHeight := calculateLayoutHeight(preset.config)
    setCanvasDimensions(totalWidth, totalHeight)
    
    // NEW: Center and fit viewport
    centerAndFitViewport()
  END IF
  
  onSelect?.(preset)
END FUNCTION

FUNCTION calculateLayoutWidth(config)
  IF config.type = 'on-point' THEN
    RETURN calculateOnPointWidth(config.rows, config.cols, config.blockSize)
  ELSE
    RETURN config.cols * config.blockSize + config.sashing.width * (config.cols - 1)
  END IF
END FUNCTION

FUNCTION calculateLayoutHeight(config)
  IF config.type = 'on-point' THEN
    RETURN calculateOnPointHeight(config.rows, config.cols, config.blockSize)
  ELSE
    RETURN config.rows * config.blockSize + config.sashing.width * (config.rows - 1)
  END IF
END FUNCTION
```

### Pseudocode for Bug 2 Fix

```
FUNCTION renderToolGroup(tools, activeTool, setActiveTool, showSeparatorBefore, groupName)
  label := groupName ? GROUP_LABELS[groupName] : ''
  
  RETURN (
    <div>
      {showSeparatorBefore && <Separator />}
      {label && <div className="label">{label}</div>}
      <div className="grid grid-cols-2 gap-1">
        {tools.map((tool, index) => {
          isActive := tool.toolType ? activeTool === tool.toolType : tool.isActive?.()
          
          // REMOVED: const isOrphan = index === tools.length - 1 && tools.length % 2 !== 0
          
          icon := <ToolIcon key={tool.id} tool={tool} isActive={isActive} onClick={...} />
          
          // SIMPLIFIED: Always return icon directly
          RETURN icon
        })}
      </div>
    </div>
  )
END FUNCTION
```

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate clicking layout presets and rendering toolbars with various tool counts. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Grid 3×3 Test**: Click "Grid 3×3" preset, observe that canvas dimensions remain unchanged (will fail on unfixed code)
2. **Sashing Test**: Click "Grid 4×4 with Sashing" preset, observe that canvas dimensions do not include sashing width (will fail on unfixed code)
3. **On-Point Test**: Click "On-Point 3×3" preset, observe that canvas dimensions do not account for rotation (will fail on unfixed code)
4. **Toolbar 5 Tools Test**: Render toolbar with 5 tools, observe that 5th tool is centered with col-span-2 (will fail on unfixed code)
5. **Toolbar 7 Tools Test**: Render toolbar with 7 tools, observe irregular 2-2-2-1 pattern (will fail on unfixed code)

**Expected Counterexamples**:
- Canvas dimensions do not update when layout presets are clicked
- Viewport does not center/fit to show the new layout
- Toolbar orphan tools are centered across both columns, breaking grid consistency
- Possible causes: missing dimension update logic, missing viewport centering call, orphan-centering logic in renderToolGroup

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL preset WHERE preset.type IN ['grid', 'sashing', 'on-point'] DO
  handleSelectPreset_fixed(preset)
  ASSERT canvasDimensionsMatch(preset.config)
  ASSERT viewportIsCenteredAndFitted()
END FOR

FOR ALL toolGroup WHERE toolGroup.length % 2 !== 0 DO
  result := renderToolGroup_fixed(toolGroup, ...)
  ASSERT allToolsInConsistent2ColumnGrid(result)
  ASSERT noOrphanToolsCentered(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE input.layoutType = 'free-form' DO
  ASSERT handleSelectPreset_original(input) = handleSelectPreset_fixed(input)
END FOR

FOR ALL toolGroup WHERE toolGroup.length % 2 = 0 DO
  ASSERT renderToolGroup_original(toolGroup) = renderToolGroup_fixed(toolGroup)
END FOR

FOR ALL worktable WHERE worktable IN ['block', 'layout'] DO
  ASSERT Toolbar_original(worktable) = Toolbar_fixed(worktable)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for free canvas mode, drag-and-drop, and other worktable toolbars, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Free Canvas Preservation**: Observe that clicking "No Layout (Free Canvas)" sets layoutType='free-form' without dimension updates on unfixed code, then write test to verify this continues after fix
2. **Drag-and-Drop Preservation**: Observe that dragging layout presets works correctly on unfixed code, then write test to verify this continues after fix
3. **Block Toolbar Preservation**: Observe that block worktable toolbar displays in single-column layout on unfixed code, then write test to verify this continues after fix
4. **Layout Toolbar Preservation**: Observe that layout worktable toolbar displays in single-column layout on unfixed code, then write test to verify this continues after fix
5. **Even Tool Count Preservation**: Observe that toolbar with even tool counts displays correctly on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test `handleSelectPreset` with Grid 3×3 preset, verify canvas dimensions update to 18×18 (3 * 6)
- Test `handleSelectPreset` with Grid 4×4 with Sashing preset, verify canvas dimensions include sashing (4 * 6 + 1 * 3 = 27)
- Test `handleSelectPreset` with On-Point 3×3 preset, verify canvas dimensions account for rotation
- Test `handleSelectPreset` with "No Layout (Free Canvas)", verify no dimension updates occur
- Test `renderToolGroup` with 5 tools, verify all tools are in 2-column grid without centering
- Test `renderToolGroup` with 7 tools, verify all tools are in 2-column grid without centering
- Test `renderToolGroup` with 6 tools, verify layout remains unchanged (even count)

### Property-Based Tests

- Generate random layout presets (grid, sashing, on-point) and verify canvas dimensions always match calculated layout dimensions
- Generate random tool groups with odd counts and verify no tools have col-span-2 or centering applied
- Generate random tool groups with even counts and verify layout is identical to original implementation
- Test that free canvas mode never triggers dimension updates across many random selections
- Test that block/layout worktable toolbars maintain single-column layout across many random tool configurations

### Integration Tests

- Test full flow: open Layout Library → click Grid 3×3 → verify grid renders on canvas → verify viewport is centered
- Test full flow: open Layout Library → click Grid 4×4 with Sashing → verify sashing grid renders → verify viewport is fitted
- Test full flow: open Layout Library → click On-Point 3×3 → verify on-point grid renders → verify viewport is centered
- Test full flow: switch to quilt worktable → verify toolbar displays in 2-column grid → verify no orphan centering
- Test full flow: switch to block worktable → verify toolbar displays in single-column layout → verify no regression
- Test full flow: click "No Layout (Free Canvas)" → verify canvas remains unconstrained → verify no dimension updates
