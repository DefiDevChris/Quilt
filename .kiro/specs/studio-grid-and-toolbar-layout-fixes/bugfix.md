# Bugfix Requirements Document

## Introduction

This document addresses two distinct bugs in the QuiltCorgi studio interface:

1. **Grid options not working**: The grid layout options (Grid 3×3, Grid 4×4, Grid 5×5, and sashing options) displayed in the right panel's Layout Library are non-functional. When users click these options, no grid appears on the canvas and the layout is not applied.

2. **Left toolbar layout issue**: The left toolbar displays tools in an inconsistent 2-1-2-1 pattern instead of a clean 2-column grid layout, creating visual awkwardness and poor user experience.

## Bug Analysis

### Current Behavior (Defect)

#### Bug 1: Grid Options Not Working

1.1 WHEN a user clicks on a grid layout option (Grid 3×3, Grid 4×4, Grid 5×5) in the Layout Library panel THEN the system updates the layout store state but does not render the grid on the canvas

1.2 WHEN a user clicks on a sashing layout option in the Layout Library panel THEN the system updates the layout store state but does not render the sashing grid on the canvas

1.3 WHEN a user clicks on an on-point layout option in the Layout Library panel THEN the system updates the layout store state but does not render the on-point grid on the canvas

1.4 WHEN the layout store state is updated with a new layout preset THEN the canvas dimensions are not updated to match the layout dimensions

1.5 WHEN the layout store state is updated with a new layout preset THEN the viewport is not centered and fitted to show the new layout

#### Bug 2: Toolbar Layout Issue

2.1 WHEN the quilt worktable toolbar renders with primary tier tools THEN the tools are displayed in an irregular 2-1-2-1 pattern instead of a consistent 2-column grid

2.2 WHEN an odd number of tools exists in a group THEN the last tool (orphan) is centered across both columns, breaking the grid consistency

2.3 WHEN the toolbar renders tool groups THEN the `renderToolGroup` function applies `col-span-2` to orphan tools, causing the irregular layout pattern

### Expected Behavior (Correct)

#### Bug 1: Grid Options Should Work

3.1 WHEN a user clicks on a grid layout option (Grid 3×3, Grid 4×4, Grid 5×5) in the Layout Library panel THEN the system SHALL update the layout store state AND update the canvas dimensions to match the layout (rows × cols × blockSize) AND center and fit the viewport to show the grid

3.2 WHEN a user clicks on a sashing layout option in the Layout Library panel THEN the system SHALL update the layout store state AND update the canvas dimensions to include sashing width AND center and fit the viewport to show the sashing grid

3.3 WHEN a user clicks on an on-point layout option in the Layout Library panel THEN the system SHALL update the layout store state AND update the canvas dimensions for the rotated layout AND center and fit the viewport to show the on-point grid

3.4 WHEN the layout store state is updated with a new layout preset THEN the system SHALL calculate the total canvas width as (cols × blockSize + sashing.width × (cols - 1)) and height as (rows × blockSize + sashing.width × (rows - 1))

3.5 WHEN the layout store state is updated with a new layout preset THEN the system SHALL call `useCanvasStore.getState().centerAndFitViewport()` to ensure the layout is visible

#### Bug 2: Toolbar Should Have Consistent Layout

3.6 WHEN the quilt worktable toolbar renders with primary tier tools THEN the system SHALL display all tools in a consistent 2-column grid without centering orphan tools

3.7 WHEN an odd number of tools exists in a group THEN the system SHALL display the last tool in the left column of the grid, maintaining the 2-column structure

3.8 WHEN the toolbar renders tool groups THEN the system SHALL NOT apply `col-span-2` or centering logic to orphan tools

### Unchanged Behavior (Regression Prevention)

4.1 WHEN a user clicks on the "No Layout (Free Canvas)" option THEN the system SHALL CONTINUE TO set layoutType to 'free-form' without applying grid dimensions

4.2 WHEN a user drags a layout preset onto the canvas THEN the system SHALL CONTINUE TO apply the layout using the existing drag-and-drop handler

4.3 WHEN the block worktable toolbar renders THEN the system SHALL CONTINUE TO display tools in a single-column layout as currently implemented

4.4 WHEN the layout worktable toolbar renders THEN the system SHALL CONTINUE TO display tools in a single-column layout as currently implemented

4.5 WHEN the toolbar renders with advanced tools collapsed THEN the system SHALL CONTINUE TO show only primary and pinned tools

4.6 WHEN the toolbar renders with advanced tools expanded THEN the system SHALL CONTINUE TO show primary, advanced, and pinned tools

4.7 WHEN a user selects a layout preset that is already active THEN the system SHALL CONTINUE TO maintain the current selection state

4.8 WHEN the LayoutSelector component renders preset thumbnails THEN the system SHALL CONTINUE TO display SVG thumbnails from PRESET_SVG mapping
