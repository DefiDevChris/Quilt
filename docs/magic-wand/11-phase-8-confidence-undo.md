# Phase 8: Confidence Surface + Undo/Redo

## Goal

Make every step of the pipeline recoverable and self-critiquing. Users should never feel the system lied. Users should never be one wrong click away from starting over.

## Inputs

- All prior phases functional.

## Outputs

- Per-group, per-shape, and overall confidence scores surfaced in UI.
- Full undo/redo stack across grouping and canonicalization decisions.
- Keyboard shortcuts.

## Tasks

### 1. Confidence scoring

```ts
type Confidence = {
  groupingConfidence: number;      // mean inverse feature-distance of members to group centroid
  canonicalConfidence: number;     // 1 - canonical residual
  gridConfidence?: number;         // if grid applies
};

function overallConfidence(c: Confidence): number {
  return Math.min(c.groupingConfidence, c.canonicalConfidence);
}
```

Thresholds:
- `> 0.85` -> green, no warning.
- `0.7 - 0.85` -> amber, silent tooltip on hover.
- `< 0.7` -> red, explicit banner.

Compute grouping confidence in the worker at group-confirm time; compute canonical confidence during Phase 5 canonicalization.

### 2. Badge component (`components/ConfidenceBadge.tsx`)

Small circular indicator, 12 px. Colors match brand tokens (no red/green Material — use the existing palette with a warm red and a fabric-friendly green).

Hover tooltip shows the *dominant* component and a plain-English reason:

- Grouping weak -> "Some patches are far from the group average — try tightening pickiness."
- Canonical weak -> "This shape does not fit a standard pattern. Review or override."
- Grid weak -> "Patches do not align cleanly to the detected grid."

Mount on:
- Every `FabricGroupCard` in Phase 4.
- Every row in the Phase 5 canonical preview.
- The emit CTA in Phase 7 (aggregate over all groups).

### 3. Inline actions for low-confidence groups

For red-threshold groups, show one-click fixes:

- "Tighten pickiness" -> reduce `pickiness` by 0.03 and re-run `findSimilar`.
- "Try a different canonical" -> open override dropdown.
- "Split group" -> run HDBSCAN within the group; propose sub-groups.

### 4. Undo/redo stack

`src/stores/magicWandStore.ts`:

```ts
type Snapshot = Pick<MagicWandState,
  'stage' | 'patches' | 'groups' | 'grid' | 'pxPerInch'
>;

function currentSnapshot(s: MagicWandState): Snapshot {
  return {
    stage: s.stage,
    patches: s.patches,
    groups: s.groups,
    grid: s.grid,
    pxPerInch: s.pxPerInch,
  };
}

const MAX_HISTORY = 50;

function pushHistory(s: MagicWandState): Partial<MagicWandState> {
  const history = [...s.history, currentSnapshot(s)].slice(-MAX_HISTORY);
  return { history, future: [] };
}
```

Mutations that push a snapshot:
- `createGroup`, `deleteGroup`.
- `addPatchesToGroup`, `removePatchesFromGroup`.
- `setCanonical`, `overrideCanonical`.
- `setGrid`, `clearGrid`.
- `dismissPatch`, `restorePatch`.

Mutations that do NOT push:
- UI-only (hover, selection, slider intermediate values).
- `setStage`, `setError`.
- Calibration changes (those trigger a full downstream reset, not an undo entry).

### 5. Keyboard shortcuts

In `MagicWandApp.tsx`:

- `⌘Z` / `Ctrl+Z` -> undo.
- `⌘⇧Z` / `Ctrl+Y` -> redo.
- `Esc` -> cancel current in-progress group (Phase 4).
- `Space` -> confirm current group.

Respect `input:focus` / `textarea:focus` — do not hijack when editing a fabric name.

### 6. Session reset

Header button "Start over" with a confirmation modal. Wipes store state but keeps the model cache.

### 7. Worker cancellation on undo

If an undo unwinds past a worker operation that's still running:

- Main calls `client.cancel(requestId)`.
- Worker checks its cancel flag between prompt batches (Phase 3) or between patch comparisons (Phase 4) and bails with `PROCESS_CANCELLED`.
- Main discards any late-arriving response with a stale `requestId`.

### 8. Dev-only audit log

Under `NEXT_PUBLIC_MAGIC_WAND_DEBUG=1`, log every action to `console.debug` with timestamp and diff. Invaluable for debugging user bug reports without needing their exact photo. Off in production.

## Pitfalls

- **Snapshots too heavy.** `patches[]` can be 10+ MB per snapshot. Either (a) cap history at 50 and evict oldest, or (b) omit `patches[]` from snapshots and rerun AMG on upload-stage undo. Prefer (a).
- **Confidence inversion.** Weakest-link aggregation can mislead when one metric is unrelated. The tooltip must surface the dominating component, not just the score.
- **Undo during in-flight work.** Cancel the worker *and* discard the response. Two separate steps.
- **Keyboard shortcuts hijacking text input.** Always check `event.target` tag and focus state first.
- **User expectation of undo scope.** Undo covers grouping and canonicalization decisions only. It does not revert calibration, re-upload, or model download — those require explicit "Start over."

## Exit Criteria

- [ ] Undo/redo covers every group-mutating action with a 50-step history.
- [ ] Keyboard shortcuts work and respect input focus.
- [ ] Confidence badges render on every group, every canonical row, and the emit CTA.
- [ ] Red-threshold warnings block emit until explicitly acknowledged.
- [ ] Worker cancels cleanly mid-flight when undo unwinds its trigger.
- [ ] Session reset wipes state but keeps the model cache.
