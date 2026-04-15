# Phase 0: Preflight

**Do not write feature code until this phase is done.** Six prior attempts died for reasons already in the repo. The cheapest way to not repeat them is to read the corpse.

## Goal

Recover institutional memory from prior photo-to-design attempts. Lock contracts. Set non-negotiables.

## Tasks

### 1. Audit prior commits

Run each and skim the diff. Write a one-sentence postmortem per commit in a scratch file (do NOT commit it — sharpening, not docs).

```bash
git log --all --oneline --grep="photo-to-design"
git log --all --oneline --grep="seam-engine"
git show b102966    # chore: remove photo-to-design feature
git show 1e5e660    # refactor: replace seam-engine with OpenCV/SAM
git show 51866f5    # refactor: replace block-grid with fabric-first
git show faf4a25    # refactor: perspective-first pipeline
git show 99ea1ec    # feat: quantize to inferred grid and canonical vocab
git show a7eb0ca    # fix: theme consistency and loading states
```

### 2. Read the leftover prompts

Commit `d5cf55e` (`docs: add photo-to-design feature prompts`) added prompt files. Locate them:

```bash
git show --stat d5cf55e
```

Read every prompt end to end. They represent the user's own thinking at the moment of the prior removal — the strongest design signal available.

### 3. Confirm the output contract

Open `src/types/printlist.ts`:

```ts
interface PrintlistItem {
  shapeId: string;
  shapeName: string;
  svgData: string;
  quantity: number;
  seamAllowance: number;
  seamAllowanceEnabled: boolean;
  unitSystem: 'imperial' | 'metric';
  calibratedPpi?: number;
}
```

The Magic Wand emits `PrintlistItem[]`. Nothing else. Studio handoff is a *bonus* path; skip it if it is not obviously clean.

### 4. Confirm the polygon contract

From `project_print_system_constraints` memory: block shapes must be **non-self-intersecting closed polygons** for the Clipper.js seam-allowance pipeline. Every canonical shape emitted by Phase 5 must pass a validator that checks:

- Closed (first vertex == last, or path explicitly closed with `Z`).
- Non-self-intersecting (segment-segment intersection test).
- Consistent winding (CCW preferred; polygon-boolean tools accept either with consistent orientation).
- Area > 0 (not degenerate).

Write the validator signature (`src/lib/magic-wand/engine/validators.ts`) before any shape-emitting code. Body can be stubbed; the shape of the contract is what matters now.

### 5. Lock non-goals

Write these somewhere visible. When scope creeps, re-read.

- No mobile.
- No server inference.
- No "magic Studio import" unless a clean grid is detected.
- No non-printed-fabric support.
- No rotation beyond 0° and 45° on-point.
- No auto-matching to retailer catalogs. User names their own fabrics.

### 6. Confirm success metric

On a ruler-calibrated, top-down photo of a 25-patch two-color quilt: ≥ 90% of patches assigned to the correct fabric group on first pass.

Stage at least three fixture quilt photos before Phase 1:

- `simple-grid.jpg` (top-down, 5×5, 2 solid fabrics, ruler in frame).
- `on-point.jpg` (45° rotated grid, 3 fabrics including a print).
- `log-cabin.jpg` (non-grid, 4-5 prints).

Store under `tests/fixtures/magic-wand/`. Gitignore if > 1 MB; include a README with sourcing.

### 7. Kill sacred cows

These ideas are **confirmed dead**. Do not revive without a written reason.

- Mandatory 4-corner perspective warp as step 1. (commit `faf4a25`)
- Edge-detection-first seam engine with no semantic prior. (commit `1e5e660` predecessor)
- Uniform grid assumption. (commit `51866f5`)
- LAB median + single `inRange` threshold as sole similarity metric. (general failure mode across attempts)
- One-click-per-fabric loops with per-click encoder runs. (tempting but O(n) encoder cost)

### 8. Write the design constraints file

Create `docs/magic-wand/DESIGN_CONSTRAINTS.md` (one-time, committed) capturing:

- Non-goals list (Task 5).
- Polygon contract (Task 4).
- Dead ideas list (Task 7) with commit references.

This is the single source of truth to quote when someone proposes reviving a dead path.

## Exit Criteria

- [ ] Postmortem notes drafted for each relevant prior commit (kept local).
- [ ] `docs/photo-to-design/` prompts (if present in `d5cf55e`) read end-to-end.
- [ ] Output contract confirmed: `PrintlistItem[]` with seam-allowance fields.
- [ ] Polygon validator signature exists (stub OK).
- [ ] At least three fixture quilt photos staged locally.
- [ ] `DESIGN_CONSTRAINTS.md` committed.
- [ ] No sacred cow smuggled back into the plan.

Proceed to Phase 1 only when all seven are checked.
