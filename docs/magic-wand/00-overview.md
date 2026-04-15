# Magic Wand: Photo to Printlist

## North Star

User uploads a photo of a physical quilt. They label fabric groups by clicking one patch per fabric. The system emits a validated `PrintlistItem[]` ready for the existing print pipeline.

This is **not** a quilt reconstruction tool. We do not rebuild the project in Studio. We generate a cut list.

## Product Decisions

- **Desktop-only.** Requires WebAssembly, SharedArrayBuffer, ~400 MB working RAM.
- **Single output contract**: `PrintlistItem[]` from `src/types/printlist.ts`. Studio handoff is an *optional* secondary path, only when a grid is inferred.
- **Destructive regularization**: raw SAM masks are discarded. We emit canonical shapes only — squares, HSTs, parallelograms, etc. Every output polygon must be non-self-intersecting and closed (Clipper.js contract, see `project_print_system_constraints` memory).
- **Click-to-group, not click-to-hunt.** One SAM pass finds all patches. The user groups; the system does not re-search per click.
- **Mandatory calibration.** No scale, no inches, no feature. Guess-inches is worse than no inches.

## Non-Goals

- Mobile support.
- Reconstructing quilt layouts precisely.
- Non-printed-fabric pipelines (embroidery, applique, foundation paper piecing).
- Server-side inference. Runs 100% in-browser.
- Rotation detection beyond 0° and 45° on-point.
- Fabric-identity against any retailer catalog. User names their own fabrics.

## Success Criteria

- On a ruler-calibrated, top-down photo of a 25-patch two-color quilt: ≥ 90% of patches assigned to the correct fabric group on first pass.
- User time from upload to exported printlist ≤ 3 minutes for a 50-patch quilt.
- Every emitted polygon passes the Clipper.js seam-allowance pipeline without error.
- No step silently loses data. Low-confidence outputs are flagged, not hidden.

## Why Previous Attempts Failed

Six prior attempts exist in git history. Common failure modes:

- **Perspective-warp-first pipelines** (commit `faf4a25`) forced a 4-corner warp on every photo. Real quilts drape; the warp distorted edge patches and poisoned size inference.
- **Block-grid-first pipelines** (commit `51866f5`) assumed all quilts are uniform grids. Medallion, on-point, and improv quilts broke it silently.
- **Seam-engine approaches** (commits `1e5e660` and prior) relied on edge detection with no semantic prior. Any seam inside a printed patch produced spurious patches.
- **Single-shot "place all fabrics" flows** without a calibration stage produced unitless numbers users could not trust.

All six ended in `chore: remove photo-to-design feature`. This plan exists to break the loop.

## Core Principles

1. **Semantic segmentation beats pixel analysis.** SAM gives us patches; CV only runs *after* we know what a patch is.
2. **User click = ground truth.** We never guess which blobs are the same fabric. User decides; we propose.
3. **Canonicalize or fail loudly.** Every patch becomes a named canonical shape or we flag it for review. No silent approximations.
4. **Scale exists or we don't ship inches.** Calibration is a required step.
5. **Output shapes must survive Clipper.js.** Validate at the boundary; warn at the source.

## Document Order

Execute phases in the order below. Each phase doc ends with **exit criteria**. Do not advance without meeting them.

1. `00-overview.md` — this file
2. `01-blueprint.md` — architecture + data flow
3. `02-scaffolding.md` — files, dependencies, config
4. `03-phase-0-preflight.md` — recover prior work
5. `04-phase-1-infrastructure.md` — worker, ORT, headers
6. `05-phase-2-upload-calibration.md` — upload + ruler
7. `06-phase-3-segment.md` — SAM AMG + feature vectors
8. `07-phase-4-group.md` — click-to-group UI
9. `08-phase-5-canonicalize.md` — shape library + Clipper validation
10. `09-phase-6-grid-inference.md` — optional grid detect
11. `10-phase-7-output.md` — PrintlistItem[] emit
12. `11-phase-8-confidence-undo.md` — confidence + undo/redo
13. `12-validation-rollout.md` — tests, metrics, rollout
