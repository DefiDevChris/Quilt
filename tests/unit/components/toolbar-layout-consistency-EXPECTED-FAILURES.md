# Expected Test Failures for Toolbar Layout Consistency Bug

## Overview

This document describes the expected test failures for the toolbar layout consistency bug condition exploration test (`toolbar-layout-consistency.test.tsx`).

## Bug Description

The toolbar displays tools in an irregular 2-1-2-1 pattern instead of a consistent 2-column grid layout. This occurs when tool groups have an odd number of tools - the last tool (orphan) is centered across both columns using `col-span-2` and `justify-center` classes.

## Expected Test Failures on Unfixed Code

### Test: "Toolbar with odd tool count should display all tools in consistent 2-column grid without centering orphans"

**Expected Failure:**
```
AssertionError: expected 1 to be 0
  expect(totalCenteredOrphans).toBe(0)
```

**Why it fails:**
- The `renderToolGroup` function in `Toolbar.tsx` detects orphan tools (last tool when count is odd)
- It wraps orphan tools in a div with `className="col-span-2 flex justify-center"`
- This causes the test to find centered orphans when it expects none

**Counterexample:**
- When rendering the quilt worktable toolbar with primary tools
- At least one tool group has an odd number of tools
- The last tool in that group is wrapped in a centering div
- This breaks the consistent 2-column grid structure

## Root Cause

From `src/components/studio/Toolbar.tsx`, the `renderToolGroup` function contains:

```typescript
const isOrphan = index === tools.length - 1 && tools.length % 2 !== 0;
const icon = (
  <ToolIcon
    key={tool.id}
    tool={tool}
    isActive={isActive}
    onClick={() => {
      if (tool.onClick) {
        tool.onClick();
      } else if (tool.toolType) {
        setActiveTool(tool.toolType);
      }
    }}
  />
);
return isOrphan ? (
  <div key={tool.id} className="col-span-2 flex justify-center">
    {icon}
  </div>
) : (
  icon
);
```

This orphan-centering logic is the direct cause of the bug.

## Expected Behavior After Fix

After implementing the fix (Task 5.1 in the implementation plan):

1. The `isOrphan` variable and conditional logic should be removed
2. All tools should be rendered directly without wrapper divs
3. CSS grid should naturally flow tools left-to-right, top-to-bottom
4. The last tool (if odd count) should be in the left column of the last row
5. No `col-span-2` or `justify-center` classes should be applied to orphan tools

## Test Validation

When the fix is implemented:
- The test should PASS
- `totalCenteredOrphans` should be 0
- `foundOrphanCentering` should be false
- All tools should maintain consistent 2-column grid alignment

## Related Requirements

- **Requirement 2.1**: Toolbar displays tools in irregular 2-1-2-1 pattern (bug condition)
- **Requirement 2.2**: Orphan tools are centered across both columns (bug condition)
- **Requirement 2.3**: renderToolGroup applies col-span-2 to orphan tools (bug condition)
- **Requirement 3.6**: Toolbar should display all tools in consistent 2-column grid (expected behavior)
- **Requirement 3.7**: Last tool should be in left column when odd count (expected behavior)
- **Requirement 3.8**: No col-span-2 or centering logic for orphan tools (expected behavior)
