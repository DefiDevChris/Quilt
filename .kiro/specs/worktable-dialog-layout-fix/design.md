# Worktable Dialog Layout Fix - Bugfix Design

## Overview

The worktable dialogs (NewWorktableDialog and RenameDialog) are appearing behind the grid rulers (HorizontalRuler and VerticalRuler) due to a z-index layering issue. Both dialogs use `z-50` for their overlay, but the rulers have no explicit z-index, causing DOM stacking order to place rulers above the dialogs. The fix requires adding explicit z-index values to the rulers to ensure they remain below modal overlays while staying above the canvas content.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when worktable dialogs are rendered with z-50 but rulers have no explicit z-index
- **Property (P)**: The desired behavior when dialogs are opened - dialogs should appear above all studio UI elements including rulers
- **Preservation**: Existing ruler display, other modal dialogs, and canvas UI that must remain unchanged by the fix
- **NewWorktableDialog**: The dialog in `src/components/studio/WorktableSwitcher.tsx` that creates new worktables
- **RenameDialog**: The dialog in `src/components/studio/WorktableSwitcher.tsx` that renames existing worktables
- **HorizontalRuler**: The top ruler component in `src/components/canvas/HorizontalRuler.tsx` that displays horizontal measurements
- **VerticalRuler**: The left ruler component in `src/components/canvas/VerticalRuler.tsx` that displays vertical measurements
- **z-index layering**: CSS stacking order that determines which elements appear above others

## Bug Details

### Bug Condition

The bug manifests when a user opens NewWorktableDialog or RenameDialog. The dialogs use `z-50` for their overlay, but the HorizontalRuler and VerticalRuler components have no explicit z-index, causing the browser's default DOM stacking order to place rulers above the dialog overlay.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type DialogRenderEvent
  OUTPUT: boolean
  
  RETURN input.dialogType IN ['NewWorktableDialog', 'RenameDialog']
         AND input.dialogZIndex == 50
         AND rulerZIndex == undefined
         AND rulersRenderedAfterDialogInDOM == true
END FUNCTION
```

### Examples

- User clicks "+" button to create new worktable → NewWorktableDialog appears behind HorizontalRuler and VerticalRuler, text and input field partially obscured
- User opens worktable context menu and selects "Rename" → RenameDialog appears behind grid rulers, making interaction difficult
- User opens ResizeDialog → Dialog appears correctly above all UI elements (expected behavior)
- User opens ReferenceImageDialog → Dialog appears correctly above all UI elements (expected behavior)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Other modal dialogs (ResizeDialog, ReferenceImageDialog, FussyCutDialog) must continue to display correctly above all UI elements
- WorktableContextMenu must continue to display correctly with its current z-index (z-50)
- Grid rulers must continue to display correctly in their current position with proper visual appearance
- StudioTopBar and WorktableSwitcher must continue to function and display correctly
- Canvas workspace and all canvas tools must continue to function correctly

**Scope:**
All inputs that do NOT involve opening NewWorktableDialog or RenameDialog should be completely unaffected by this fix. This includes:
- Opening other modal dialogs
- Interacting with the canvas
- Using canvas tools and features
- Viewing and interacting with rulers during normal canvas operations

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Missing Z-Index on Rulers**: The HorizontalRuler and VerticalRuler components have no explicit z-index value in their className
   - HorizontalRuler uses: `className="h-6 bg-surface border-b border-outline-variant ml-6"`
   - VerticalRuler uses: `className="w-6 bg-surface border-r border-outline-variant"`
   - No z-index specified, so they inherit default stacking context

2. **DOM Stacking Order**: In the StudioClient component, the rulers are rendered within the canvas area container, which is a sibling to the dialog overlay elements
   - Dialogs are rendered at the root level with `fixed inset-0 z-50`
   - Rulers are rendered within the canvas container
   - Without explicit z-index, DOM order determines stacking

3. **Stacking Context Issue**: The dialogs create a new stacking context with `z-50`, but the rulers may be in a different stacking context that places them above the dialog overlay

4. **Inconsistent Z-Index Strategy**: Other studio UI elements may have z-index values that conflict with the dialog overlay

## Correctness Properties

Property 1: Bug Condition - Worktable Dialogs Appear Above Rulers

_For any_ dialog render event where NewWorktableDialog or RenameDialog is opened, the fixed code SHALL ensure the dialog overlay and content appear above the HorizontalRuler and VerticalRuler components, making the dialog fully visible and interactive.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Ruler Display and Other Dialogs

_For any_ UI interaction that does NOT involve opening NewWorktableDialog or RenameDialog, the fixed code SHALL produce exactly the same visual layering and behavior as the original code, preserving ruler display during normal canvas operations and correct layering for all other modal dialogs.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/components/canvas/HorizontalRuler.tsx`

**Function**: `HorizontalRuler` component

**Specific Changes**:
1. **Add Z-Index to Ruler Container**: Add `z-10` to the ruler container className
   - Change: `className="h-6 bg-surface border-b border-outline-variant ml-6"`
   - To: `className="h-6 bg-surface border-b border-outline-variant ml-6 z-10"`
   - Rationale: z-10 places rulers above canvas content (z-0) but below modal overlays (z-50)

**File**: `src/components/canvas/VerticalRuler.tsx`

**Function**: `VerticalRuler` component

**Specific Changes**:
1. **Add Z-Index to Ruler Container**: Add `z-10` to the ruler container className
   - Change: `className="w-6 bg-surface border-r border-outline-variant"`
   - To: `className="w-6 bg-surface border-r border-outline-variant z-10"`
   - Rationale: z-10 places rulers above canvas content (z-0) but below modal overlays (z-50)

**Alternative Approach** (if z-10 doesn't resolve the issue):

**File**: `src/components/studio/WorktableSwitcher.tsx`

**Functions**: `NewWorktableDialog` and `RenameDialog`

**Specific Changes**:
1. **Increase Dialog Z-Index**: Change dialog overlay z-index from `z-50` to `z-[60]` or higher
   - This ensures dialogs are above any other studio UI elements
   - Only implement if adding z-index to rulers doesn't resolve the issue

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Manually test the worktable dialogs on UNFIXED code to observe the layering issue. Use browser DevTools to inspect z-index values and stacking contexts. Document the exact visual behavior and DOM structure.

**Test Cases**:
1. **New Worktable Dialog Test**: Click "+" button in WorktableSwitcher (will show dialog behind rulers on unfixed code)
2. **Rename Dialog Test**: Open worktable context menu and select "Rename" (will show dialog behind rulers on unfixed code)
3. **Z-Index Inspection**: Use DevTools to inspect computed z-index of rulers and dialogs (will show rulers have no z-index on unfixed code)
4. **Stacking Context Analysis**: Use DevTools to analyze stacking contexts and DOM hierarchy (may reveal stacking context issues on unfixed code)

**Expected Counterexamples**:
- Dialogs appear partially or fully behind rulers
- Possible causes: missing z-index on rulers, stacking context conflicts, DOM order issues

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL dialogOpen WHERE isBugCondition(dialogOpen) DO
  result := renderDialog_fixed(dialogOpen)
  ASSERT dialogAppearsAboveRulers(result)
  ASSERT dialogIsFullyVisible(result)
  ASSERT dialogIsInteractive(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL uiInteraction WHERE NOT isBugCondition(uiInteraction) DO
  ASSERT renderUI_original(uiInteraction) = renderUI_fixed(uiInteraction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for other dialogs and ruler display, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Other Dialog Preservation**: Observe that ResizeDialog, ReferenceImageDialog, and FussyCutDialog appear correctly above all UI on unfixed code, then verify this continues after fix
2. **Ruler Display Preservation**: Observe that rulers display correctly during normal canvas operations on unfixed code, then verify this continues after fix
3. **Context Menu Preservation**: Observe that WorktableContextMenu displays correctly on unfixed code, then verify this continues after fix
4. **Canvas Interaction Preservation**: Observe that canvas tools and interactions work correctly on unfixed code, then verify this continues after fix

### Unit Tests

- Test that NewWorktableDialog renders with correct z-index after fix
- Test that RenameDialog renders with correct z-index after fix
- Test that HorizontalRuler has explicit z-index value after fix
- Test that VerticalRuler has explicit z-index value after fix
- Test that dialogs appear above rulers in the DOM stacking order

### Property-Based Tests

- Generate random dialog open/close sequences and verify dialogs always appear above rulers
- Generate random canvas interactions and verify rulers continue to display correctly
- Test that all modal dialogs across the studio maintain correct z-index layering

### Integration Tests

- Test full worktable creation flow with dialog appearing correctly above rulers
- Test full worktable rename flow with dialog appearing correctly above rulers
- Test switching between worktables while dialogs are open
- Test opening multiple dialogs in sequence and verifying correct layering
