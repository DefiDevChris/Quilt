# Expected Test Failures on Unfixed Code

## Bug Condition Exploration Test: Grid Layout Rendering

This document describes the expected failures when running `layout-selector-grid-rendering.test.ts` on UNFIXED code.

### Test: Grid 3×3 preset should update canvas dimensions to 18×18

**Expected Behavior (what the test checks):**
- Canvas dimensions should be updated to 18×18 (3 cols × 6 blockSize)

**Actual Behavior on Unfixed Code:**
- Canvas dimensions remain at 48×48 (DEFAULT_CANVAS_WIDTH/HEIGHT)
- Layout store is updated but project store (canvas dimensions) is NOT updated

**Expected Failure:**
```
AssertionError: expected 48 to equal 18
  expect(projectStore.canvasWidth).toBe(expectedWidth);
```

**Counterexample:**
- Input: Grid 3×3 preset (rows=3, cols=3, blockSize=6)
- Expected: canvasWidth=18, canvasHeight=18
- Actual: canvasWidth=48, canvasHeight=48
- Root Cause: `LayoutSelector.handleSelectPreset` does not call `projectStore.setCanvasDimensions()`

---

### Test: Grid 4×4 with Sashing preset should update canvas dimensions to 27×27

**Expected Behavior (what the test checks):**
- Canvas dimensions should be updated to 27×27 (4 cols × 6 blockSize + 1 sashing × 3 gaps)

**Actual Behavior on Unfixed Code:**
- Canvas dimensions remain at 48×48
- Sashing configuration is stored in layout store but not reflected in canvas dimensions

**Expected Failure:**
```
AssertionError: expected 48 to equal 27
  expect(projectStore.canvasWidth).toBe(expectedWidth);
```

**Counterexample:**
- Input: Sashing 4×4 preset (rows=4, cols=4, blockSize=6, sashing.width=1)
- Expected: canvasWidth=27, canvasHeight=27
- Actual: canvasWidth=48, canvasHeight=48
- Root Cause: Sashing dimensions are not calculated and applied to canvas

---

### Test: On-Point 3×3 preset should update canvas dimensions for rotated layout

**Expected Behavior (what the test checks):**
- Canvas dimensions should be larger than straight grid (>18) to account for 45° rotation
- Dimensions should be approximately 21 (calculated from diagonal)

**Actual Behavior on Unfixed Code:**
- Canvas dimensions remain at 48×48
- On-point layout type is stored but canvas is not resized for rotation

**Expected Failure:**
```
AssertionError: expected 48 to be greater than 18
  expect(projectStore.canvasWidth).toBeGreaterThan(straightGridDimension);
```

**Counterexample:**
- Input: On-Point 3×3 preset (rows=3, cols=3, blockSize=6, type='on-point')
- Expected: canvasWidth > 18 (approximately 21)
- Actual: canvasWidth=48 (unchanged)
- Root Cause: On-point layout dimensions are not calculated

---

## Root Cause Analysis

All three test failures confirm the same root cause:

**Missing Canvas Dimension Update Logic in `LayoutSelector.handleSelectPreset`**

The function currently:
1. ✅ Updates layout store (rows, cols, blockSize, sashing, layoutType)
2. ❌ Does NOT update project store canvas dimensions
3. ❌ Does NOT call `centerAndFitViewport()` to show the layout

The fix requires:
1. Calculate total canvas dimensions based on layout configuration
2. Call `projectStore.setCanvasDimensions(width, height)`
3. Call `canvasStore.centerAndFitViewport()` to center the viewport

---

## Test Validation

These tests encode the EXPECTED BEHAVIOR. When the fix is implemented:
- All three tests should PASS
- Canvas dimensions will be correctly updated when presets are selected
- Viewport will be centered to show the layout

The test failures on unfixed code CONFIRM that the bug exists and provide concrete counterexamples demonstrating the issue.
