# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Worktable Dialogs Appear Behind Rulers
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: For deterministic bugs, scope the property to the concrete failing case(s) to ensure reproducibility
  - Test that NewWorktableDialog and RenameDialog appear behind HorizontalRuler and VerticalRuler when opened
  - Verify dialogs use z-50 but rulers have no explicit z-index
  - Test implementation details from Bug Condition in design: `input.dialogType IN ['NewWorktableDialog', 'RenameDialog'] AND input.dialogZIndex == 50 AND rulerZIndex == undefined`
  - The test assertions should match the Expected Behavior Properties from design: dialogs SHALL appear above all studio UI elements including rulers
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found: dialogs appearing behind rulers, z-index values, stacking context issues
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Ruler Display and Other Dialogs
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (other dialogs, ruler display during normal operations)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that ResizeDialog, ReferenceImageDialog, and FussyCutDialog appear correctly above all UI elements
  - Test that WorktableContextMenu displays correctly with z-50
  - Test that HorizontalRuler and VerticalRuler display correctly during normal canvas operations
  - Test that StudioTopBar and WorktableSwitcher function correctly
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for worktable dialog z-index layering

  - [x] 3.1 Implement the fix
    - Add z-10 to HorizontalRuler container className in `src/components/canvas/HorizontalRuler.tsx`
    - Change `className="h-6 bg-surface border-b border-outline-variant ml-6"` to `className="h-6 bg-surface border-b border-outline-variant ml-6 z-10"`
    - Add z-10 to VerticalRuler container className in `src/components/canvas/VerticalRuler.tsx`
    - Change `className="w-6 bg-surface border-r border-outline-variant"` to `className="w-6 bg-surface border-r border-outline-variant z-10"`
    - Rationale: z-10 places rulers above canvas content (z-0) but below modal overlays (z-50)
    - Alternative: If z-10 doesn't resolve, increase dialog z-index from z-50 to z-[60] in WorktableSwitcher.tsx
    - _Bug_Condition: isBugCondition(input) where input.dialogType IN ['NewWorktableDialog', 'RenameDialog'] AND input.dialogZIndex == 50 AND rulerZIndex == undefined_
    - _Expected_Behavior: dialogAppearsAboveRulers(result) AND dialogIsFullyVisible(result) AND dialogIsInteractive(result) from design_
    - _Preservation: Other modal dialogs, WorktableContextMenu, ruler display, StudioTopBar, and WorktableSwitcher must continue to function correctly_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Worktable Dialogs Appear Above Rulers
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - Verify NewWorktableDialog and RenameDialog now appear above HorizontalRuler and VerticalRuler
    - Verify dialogs are fully visible and interactive
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Ruler Display and Other Dialogs
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)
    - Verify other dialogs, rulers, context menu, and studio UI continue to function correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
