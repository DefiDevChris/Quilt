# Validation and Rollout

## Goal

Prove the feature works on real photos before enabling it for real users. Ship behind a flag; graduate on evidence.

## Tasks

### 1. Unit tests

Engine modules are pure functions. Target per `testing.md`: 80% line coverage.

- `engine/features.ts`: LAB conversion round-trip, k-means stability on known input, LBP histogram for synthetic patterns.
- `engine/grouping.ts`: distance monotonicity, bounded [0, 1] range, weight sum invariance.
- `engine/canonicalize.ts`: one test per canonical kind with a synthetic contour; assert matched kind and dimensions within 0.5%.
- `engine/grid-inference.ts`: 5×5 axis grid, 4×4 on-point grid, medallion (expect null), improv (expect null).
- `engine/validators.ts`: rejects degenerate / self-intersecting / open / CW inputs; accepts valid CCW polygons.

### 2. Integration tests (worker <-> main)

- `__tests__/worker.integration.test.ts`: load a fixture, run `init` + `loadImage` + `runAMG`, assert patch count within expected band.
- Run under real Puppeteer / Playwright rather than mocked WASM. Mocks hide the real failure modes (threading, memory).

### 3. E2E tests (Playwright)

- Viewport 1440×900. Upload fixture -> calibrate -> segment -> group -> emit -> assert `usePrintlistStore` contains N items.
- Mobile viewport: assert desktop-only gate renders and feature does not load.
- Interrupt test: upload, undo, re-upload. Assert no leaked worker or state.
- Cache test: load once (cold), reload page, load again — second load completes within 3 s.

### 4. Fixtures

Three minimum, stored in `tests/fixtures/magic-wand/`. Gitignore > 1 MB blobs with a README linking sourcing.

- `simple-grid.jpg`: 5×5 uniform blocks, 2 solid fabrics, ruler in frame.
- `on-point.jpg`: 45° layout, 3 fabrics including a print.
- `log-cabin.jpg`: non-grid layout, 4-5 prints, known to have no grid.

Each fixture has a hand-labeled JSON ground truth:

```ts
// tests/fixtures/magic-wand/simple-grid.expected.json
{
  "pxPerInch": 120,
  "groups": [
    { "name": "Fabric A", "kind": "square", "sideIn": 2.5, "count": 13 },
    { "name": "Fabric B", "kind": "square", "sideIn": 2.5, "count": 12 }
  ],
  "grid": { "pitchIn": 2.5, "rotationDeg": 0 }
}
```

Compare automated output against ground truth with tolerance on confidence but strict on group count and canonical kind.

### 5. Manual QA checklist

`docs/magic-wand/QA-checklist.md` (create during this phase):

- [ ] Upload 25 MB image: accepted, downscaled.
- [ ] Upload HEIC: rejected with helpful message.
- [ ] Upload EXIF-rotated PNG: displayed with correct orientation.
- [ ] Calibrate with < 100 px line: blocked with explanation.
- [ ] Calibrate with 0.25–120" range: accepted; outside rejected.
- [ ] Run AMG, watch progress bar ticks and ETA.
- [ ] Group with default pickiness: reasonable result.
- [ ] Slide pickiness to 0.05 (strict) and 0.35 (loose): ghost count changes.
- [ ] Manually add, remove, and dismiss patches.
- [ ] Auto-group remainder: clusters make sense.
- [ ] Canonicalize: every group has a canonical or explicit custom.
- [ ] Override canonical kind: dimensions re-fit.
- [ ] Accept grid (or none).
- [ ] Emit printlist: printlist view loads with correct items.
- [ ] Undo 10 steps: state restored exactly.
- [ ] Close tab mid-AMG: reopen clean, no leaked workers.
- [ ] Download JSON: re-imports and reproduces output.

### 6. Performance benchmarks

Record on three target machines (capture `navigator.userAgent`):

- **Mid desktop** (16 GB, integrated GPU): target AMG < 45 s.
- **Low-end laptop** (8 GB, no GPU): target AMG < 120 s.
- **High-end desktop** (32 GB, discrete GPU): target AMG < 20 s.

Budgets:
- Worker init: < 10 s first run, < 2 s cached.
- Calibration round-trip: < 1 s.
- `findSimilar` per click: < 300 ms for 500 patches.
- `canonicalize` per group: < 100 ms.

### 7. Metrics to capture

With user consent (reuse existing analytics consent):

- Image dimensions + downscale ratio.
- AMG patch count.
- Group count, mean patches per group.
- Grid detected (yes/no, pitch).
- Time from upload to emit.
- Errors by code.
- User correction rate: proportion of auto-proposed ghost candidates the user removed.

Push to existing analytics pipeline. No new service.

### 8. Rollout plan

1. **Internal dogfooding** (Week 1). Flag `magic_wand_internal`. Admin role only. Team tests with their own quilts.
2. **Closed beta** (Weeks 2-3). Flag `magic_wand_beta`. Opt-in Pro users. Collect feedback via existing community channel.
3. **General release** (Week 4+). Flag removed. Desktop Pro users see it by default. Feature card added to `/studio`.

Graduation gates at each step:
- Error rate < 5% per session.
- Median time-to-emit < 3 minutes on the fixture set.
- User correction rate < 30%.
- Zero Clipper-validation failures slipping to the print pipeline.

If any metric fails a gate, roll back to the prior stage and iterate.

### 9. Known limitations (document in user-facing help)

- Works best on flat, top-down photos with even lighting.
- Printed fabrics with busy patterns may segment into sub-regions; manual merging may be needed.
- Non-standard shapes (applique, irregular curves outside Drunkard's Path) fall back to "custom" — manual review required.
- On-point and axis-aligned grids only.
- Desktop only. Does not work on mobile or tablet.
- First use on a new device downloads ~30 MB of model weights.

### 10. Feature flag integration

Use the existing feature-flag mechanism (check `authStore` or session role for `magic_wand_beta`). If no flag exists, guard by role only: `session.user.role === 'admin'` for internal, `isPro && flagSet` for beta.

### 11. Rollback plan

If a critical bug ships:

- Flip the feature flag off — no code deploy needed.
- Banner on `/magic-wand`: "Feature temporarily disabled — [status link]".
- No user data is persisted outside the printlist emit, so rollback is clean.

## Exit Criteria

- [ ] All unit, integration, and E2E test suites green in CI.
- [ ] QA checklist passes on a fresh machine with no cached models.
- [ ] Performance benchmarks meet targets on the two weaker machines.
- [ ] Metrics dashboard populated from a dogfooding week.
- [ ] Rollout plan approved and first gate (internal) enabled.
- [ ] Help/documentation page live under `/help/magic-wand`.
- [ ] Rollback plan tested by flipping the flag in staging.
