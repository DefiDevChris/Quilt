# Requirements Document

## Introduction

This document specifies the requirements for removing the Layout Settings feature from QuiltCorgi studio. The Layout Settings feature currently allows users to configure grid, sashing, on-point, and border layouts for quilts. However, the feature is not functioning correctly (borders appear as separate black rectangles instead of being integrated into the layout structure), and the decision has been made to remove it entirely rather than fix it.

## Glossary

- **Studio**: The QuiltCorgi design canvas application where users create quilt patterns
- **Layout_Settings_Panel**: The UI dialog that allows users to configure layout options (grid, sashing, on-point, borders)
- **Layout_Settings_Button**: The toolbar button that opens the Layout Settings Panel
- **Layout_Store**: The Zustand store that manages layout configuration state
- **Layout_Engine**: The pure computation functions in layout-utils.ts that generate layout structures
- **Toolbar**: The floating toolbar in the studio that contains tool buttons
- **Canvas**: The Fabric.js-based drawing surface where quilt designs are created
- **Worktable**: An independent canvas within a project (projects support up to 10 worktables)

## Requirements

### Requirement 1: Remove Layout Settings UI Components

**User Story:** As a developer, I want to remove all Layout Settings UI components, so that users cannot access the non-functional feature.

#### Acceptance Criteria

1. THE System SHALL remove the LayoutSettingsPanel component file
2. THE System SHALL remove the Layout Settings button from the studio toolbar configuration
3. THE System SHALL remove the onOpenLayoutSettings callback from ToolbarCallbacks interface
4. THE System SHALL remove all references to Layout Settings from onboarding tooltips and tour steps
5. THE System SHALL remove Layout Settings references from help content

### Requirement 2: Remove Layout Store

**User Story:** As a developer, I want to remove the layout store, so that no layout state management code remains in the application.

#### Acceptance Criteria

1. THE System SHALL remove the layoutStore.ts file from the stores directory
2. THE System SHALL remove the layoutStore test file
3. THE System SHALL remove all imports of useLayoutStore from components and hooks
4. WHEN the layout store is removed, THE System SHALL ensure no broken references remain in the codebase

### Requirement 3: Remove Layout Engine and Utilities

**User Story:** As a developer, I want to remove layout computation code, so that unused layout generation logic is eliminated.

#### Acceptance Criteria

1. THE System SHALL remove the layout-utils.ts file containing layout engine functions
2. THE System SHALL remove the layout-engine.test.ts test file
3. THE System SHALL remove layout-related types (LayoutType, SashingConfig, BorderConfig, LayoutConfig, LayoutResult, etc.)
4. THE System SHALL remove border-generator.ts if it only supports layout borders
5. THE System SHALL remove pattern-import-layouts.ts if it only handles layout imports

### Requirement 4: Clean Up Layout References in Other Files

**User Story:** As a developer, I want to remove layout references from supporting files, so that the codebase remains consistent and functional.

#### Acceptance Criteria

1. THE System SHALL remove layout-related constants from constants.ts (DEFAULT_SASHING_COLOR, DEFAULT_BORDER_COLOR)
2. THE System SHALL remove layout settings from onboarding-utils.ts
3. THE System SHALL remove layout-related help content from help-content.ts
4. THE System SHALL remove layout references from WorkspacePreview.tsx landing page component
5. THE System SHALL remove layout-related seed data from blog-seed.ts

### Requirement 5: Update Pattern Import and Export

**User Story:** As a developer, I want to update pattern import/export code to handle the absence of layout data, so that existing functionality continues to work.

#### Acceptance Criteria

1. WHEN a pattern is imported, THE System SHALL ignore any layout configuration data
2. WHEN a pattern is exported, THE System SHALL not include layout configuration data
3. THE System SHALL update pattern-import-canvas.ts to remove layout processing
4. THE System SHALL update pattern-import-printlist.ts to remove layout references
5. THE System SHALL update pattern-import-types.ts to remove layout-related type definitions

### Requirement 6: Update Resize Functionality

**User Story:** As a developer, I want to update the resize engine to work without layout settings, so that quilt resizing continues to function.

#### Acceptance Criteria

1. THE System SHALL remove layout-specific resize logic from resize-utils.ts or resize-engine.ts
2. THE System SHALL update resize tests to remove layout-related test cases
3. WHEN a user resizes a quilt, THE System SHALL resize the canvas without considering layout type
4. THE System SHALL maintain free-form canvas resizing functionality

### Requirement 7: Maintain All Other Studio Functionality

**User Story:** As a user, I want all other studio features to continue working, so that I can still design quilts effectively.

#### Acceptance Criteria

1. THE System SHALL maintain block library functionality
2. THE System SHALL maintain fabric library functionality
3. THE System SHALL maintain all drawing tools (rectangle, circle, triangle, polygon, line, curve)
4. THE System SHALL maintain Photo-to-Pattern functionality
5. THE System SHALL maintain yardage estimator functionality
6. THE System SHALL maintain printlist functionality
7. THE System SHALL maintain export functionality (PDF, PNG, SVG)
8. THE System SHALL maintain grid and snap-to-grid functionality
9. THE System SHALL maintain all other toolbar tools and panels

### Requirement 8: Remove Layout Tests

**User Story:** As a developer, I want to remove all layout-related tests, so that the test suite remains clean and relevant.

#### Acceptance Criteria

1. THE System SHALL remove tests/unit/lib/layout-engine.test.ts
2. THE System SHALL remove tests/unit/stores/layoutStore.test.ts
3. THE System SHALL remove layout-related test cases from pattern-import-canvas.test.ts
4. THE System SHALL remove layout-related test cases from pattern-import-printlist.test.ts
5. THE System SHALL remove layout-related test cases from resize-engine.test.ts
6. WHEN all layout tests are removed, THE System SHALL ensure the remaining test suite passes

### Requirement 9: Update Documentation

**User Story:** As a developer, I want to update documentation to reflect the removal of Layout Settings, so that documentation remains accurate.

#### Acceptance Criteria

1. THE System SHALL remove Layout Settings references from README.md
2. THE System SHALL remove layout mode descriptions from product documentation
3. THE System SHALL update any architecture documentation that references layout features
4. THE System SHALL remove layout-related screenshots or images if they exist

