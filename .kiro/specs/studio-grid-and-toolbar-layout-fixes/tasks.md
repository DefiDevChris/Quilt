# Implementation Plan

- [x] 1. Write bug condition exploration test for grid layout rendering
  - **Property 1: Bug Condition** - Grid Layout Presets Do Not Render on Canvas
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: Grid 3×3, Grid 4×4 with Sashing, On-Point 3×3
  - Test that clicking layout presets (grid, sashing, on-point) updates canvas dimensions and centers viewport
  - The test assertions should match the Expected Behavior Properties from design (canvas dimensions match layout, viewport is centered/fitted)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "Grid 3×3 clicked but canvas dimensions remain unchanged")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write bug condition exploration test for toolbar layout consistency
  - **Property 1: Bug Condition** - Toolbar Displays Irregular 2-1-2-1 Pattern
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases: toolbar with 5 tools, toolbar with 7 tools
  - Test that toolbar with odd tool counts displays all tools in consistent 2-column grid without centering orphans
  - The test assertions should match the Expected Behavior Properties from design (no col-span-2, no centering, consistent grid)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "5th tool is centered with col-span-2")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Free Canvas and Non-Quilt Worktable Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Clicking "No Layout (Free Canvas)" sets layoutType='free-form' without dimension updates on unfixed code
  - Observe: Block worktable toolbar displays in single-column layout on unfixed code
  - Observe: Layout worktable toolbar displays in single-column layout on unfixed code
  - Observe: Toolbar with even tool counts displays correctly without orphan centering on unfixed code
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 4. Fix for grid layout rendering bug

  - [x] 4.1 Implement canvas dimension updates in LayoutSelector
    - Import canvas store and project store (if needed for dimension management)
    - Add dimension calculation logic in `handleSelectPreset` function
    - Calculate total width: `cols * blockSize + sashing.width * (cols - 1)`
    - Calculate total height: `rows * blockSize + sashing.width * (rows - 1)`
    - Handle on-point layout dimensions with rotation calculation
    - Update canvas dimensions after layout store updates
    - Call `useCanvasStore.getState().centerAndFitViewport()` after dimension update
    - Add conditional logic to skip dimension updates when layoutType is 'free-form'
    - _Bug_Condition: isBugCondition1(input) where input.layoutType IN ['grid', 'sashing', 'on-point'] AND layoutStoreUpdated AND NOT canvasDimensionsUpdated AND NOT viewportCenteredAndFitted_
    - _Expected_Behavior: Canvas dimensions match layout dimensions AND viewport is centered and fitted_
    - _Preservation: Free canvas mode does not trigger dimension updates (Requirement 4.1)_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1_

  - [x] 4.2 Verify grid layout exploration test now passes
    - **Property 1: Expected Behavior** - Grid Layout Presets Render on Canvas
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design (3.1, 3.2, 3.3, 3.4, 3.5)_

- [x] 5. Fix for toolbar layout consistency bug

  - [x] 5.1 Remove orphan-centering logic in Toolbar renderToolGroup
    - Remove `isOrphan` variable and conditional logic from `renderToolGroup` function
    - Simplify tool rendering to always return icon directly without wrapping
    - Remove `col-span-2` and `justify-center` logic for orphan tools
    - Let CSS grid naturally flow tools left-to-right, top-to-bottom
    - _Bug_Condition: isBugCondition2(input) where input.tools.length % 2 !== 0 AND isLastTool AND appliesColSpan2_
    - _Expected_Behavior: All tools display in consistent 2-column grid without centering orphans_
    - _Preservation: Block and layout worktable toolbars maintain single-column layout (Requirements 4.3, 4.4)_
    - _Requirements: 2.1, 2.2, 2.3, 3.6, 3.7, 3.8, 4.3, 4.4_

  - [x] 5.2 Verify toolbar layout exploration test now passes
    - **Property 1: Expected Behavior** - Toolbar Maintains Consistent 2-Column Grid
    - **IMPORTANT**: Re-run the SAME test from task 2 - do NOT write a new test
    - The test from task 2 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 2
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: Expected Behavior Properties from design (3.6, 3.7, 3.8)_

- [x] 6. Verify preservation tests still pass
  - **Property 2: Preservation** - Free Canvas and Non-Quilt Worktable Behavior
  - **IMPORTANT**: Re-run the SAME tests from task 3 - do NOT write new tests
  - Run preservation property tests from step 3
  - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
  - Confirm all tests still pass after fix (no regressions)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise
