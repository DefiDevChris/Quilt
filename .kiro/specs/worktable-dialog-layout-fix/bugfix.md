# Bugfix Requirements Document

## Introduction

The worktable dialog UI (New Worktable and Rename Worktable dialogs) is appearing behind the grid rulers on the design studio page, making the dialog partially or fully obscured and unusable. This is a z-index layering issue where the dialog overlay (z-50) is being rendered below the canvas rulers due to DOM stacking order.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks the "+" button to create a new worktable THEN the NewWorktableDialog appears behind the HorizontalRuler and VerticalRuler components, making it partially obscured

1.2 WHEN a user opens the worktable context menu and selects "Rename" THEN the RenameDialog appears behind the grid rulers, making the dialog text and input field difficult or impossible to interact with

1.3 WHEN the worktable dialogs are rendered THEN they use z-50 but the rulers have no explicit z-index, causing DOM stacking order to place rulers above the dialog

### Expected Behavior (Correct)

2.1 WHEN a user clicks the "+" button to create a new worktable THEN the NewWorktableDialog SHALL appear above all studio UI elements including the grid rulers with proper z-index layering

2.2 WHEN a user opens the worktable context menu and selects "Rename" THEN the RenameDialog SHALL appear above all studio UI elements including the grid rulers with proper z-index layering

2.3 WHEN the worktable dialogs are rendered THEN they SHALL use a z-index value that ensures they appear above all other studio UI components (rulers, toolbars, panels)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN other modal dialogs in the studio are opened (ResizeDialog, ReferenceImageDialog, FussyCutDialog, etc.) THEN they SHALL CONTINUE TO display correctly above all UI elements

3.2 WHEN the WorktableContextMenu is opened THEN it SHALL CONTINUE TO display correctly with its current z-index (z-50)

3.3 WHEN the grid rulers (HorizontalRuler and VerticalRuler) are rendered THEN they SHALL CONTINUE TO display correctly in their current position without visual regression

3.4 WHEN the StudioTopBar and WorktableSwitcher are rendered THEN they SHALL CONTINUE TO function and display correctly
