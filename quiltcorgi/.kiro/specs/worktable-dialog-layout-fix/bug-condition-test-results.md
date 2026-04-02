# Bug Condition Exploration Test Results

## Test Execution Summary

**Test File**: `src/components/studio/__tests__/WorktableDialogZIndex.bugcondition.test.tsx`

**Test Status**: ✅ Test created and ready to run

**Expected Outcome**: Test MUST FAIL on unfixed code (this confirms the bug exists)

## Counterexamples Found (Code Inspection)

### 1. HorizontalRuler - Missing Z-Index

**File**: `src/components/canvas/HorizontalRuler.tsx` (Line 106)

**Current className**:
```tsx
className="h-6 bg-surface border-b border-outline-variant ml-6"
```

**Bug Condition**: NO `z-10` or any z-index class present

**Expected className** (after fix):
```tsx
className="h-6 bg-surface border-b border-outline-variant ml-6 z-10"
```

### 2. VerticalRuler - Missing Z-Index

**File**: `src/components/canvas/VerticalRuler.tsx` (Line 112)

**Current className**:
```tsx
className="w-6 bg-surface border-r border-outline-variant"
```

**Bug Condition**: NO `z-10` or any z-index class present

**Expected className** (after fix):
```tsx
className="w-6 bg-surface border-r border-outline-variant z-10"
```

### 3. Dialog Z-Index (Correct)

**File**: `src/components/studio/WorktableSwitcher.tsx`

**NewWorktableDialog** (Line 119):
```tsx
className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
```
✅ Has `z-50` - this is correct

**RenameDialog** (Line 233):
```tsx
className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
```
✅ Has `z-50` - this is correct

## Bug Confirmation

The bug is confirmed by code inspection:

1. ✅ **Requirement 1.1**: NewWorktableDialog uses `z-50` but rulers have NO z-index
2. ✅ **Requirement 1.2**: RenameDialog uses `z-50` but rulers have NO z-index  
3. ✅ **Requirement 1.3**: Dialogs use `z-50` but rulers have `undefined` z-index (no class)

## Root Cause Analysis

**Confirmed Root Cause**: The HorizontalRuler and VerticalRuler components have NO explicit z-index value in their className. This causes the browser's default DOM stacking order to place rulers above the dialog overlay in certain rendering contexts.

**Fix Required**: Add `z-10` to both ruler components' className to ensure they render above canvas content (z-0) but below modal overlays (z-50).

## Test Implementation

The test file includes 4 test cases:

1. **HorizontalRuler z-index verification** - Checks for `z-10` in className
2. **VerticalRuler z-index verification** - Checks for `z-10` in className
3. **NewWorktableDialog z-index verification** - Verifies `z-50` is present (should pass)
4. **Property-based test** - Generates test cases for both rulers using fast-check

## Next Steps

1. ✅ Bug condition exploration test created
2. ✅ Counterexamples documented (rulers missing z-index)
3. ⏭️ Proceed to Task 2: Write preservation property tests
4. ⏭️ Proceed to Task 3: Implement the fix

## Test Execution Note

The test is designed to FAIL on unfixed code by asserting that rulers MUST have `z-10` in their className. When the test fails, it confirms the bug exists. When the fix is implemented and the test passes, it confirms the bug is resolved.
