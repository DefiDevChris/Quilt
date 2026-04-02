# Code Duplication Cleanup Report
**Date:** 2026-04-02  
**Status:** Verified & Prioritized

## Executive Summary

Reviewed 16 reported duplication issues. **6 confirmed as real problems** requiring fixes. **10 are false positives** or intentional design decisions.

---

## ✅ CONFIRMED ISSUES (Action Required)

### CRITICAL Priority

#### 1. Bounding Box Computation — 4 Duplicate Implementations
**Impact:** High maintenance burden, inconsistent behavior risk

**Locations:**
- `src/lib/geometry-extraction.ts:19-38` — `boundingBoxFromPoints()`
- `src/lib/cutting-chart-generator.ts:98-116` — `boundingBox()` (standalone)
- `src/lib/piece-inspector-utils.ts:114-129` — `computeBoundingBox()` (standalone)
- `src/lib/bin-packer.ts` — `polylineBoundingBox()`

**Fix:**
```typescript
// Create src/lib/geometry-utils.ts
export interface Point { x: number; y: number; }
export interface BBox { x: number; y: number; width: number; height: number; minX?: number; minY?: number; }

export function boundingBoxFromPoints(points: ReadonlyArray<Point>): BBox {
  // Single canonical implementation
}
```

**Migration:**
1. Create `src/lib/geometry-utils.ts` with canonical implementation
2. Update all 4 files to import from `geometry-utils.ts`
3. Delete local implementations
4. Run tests to verify no regressions

---

### HIGH Priority

#### 2. Fraction Formatting — 2 Implementations
**Impact:** Inconsistent rounding behavior (eighths vs. arbitrary precision)

**Locations:**
- `src/lib/piece-detection-utils.ts:130-148` — `formatFraction()` (rounds to eighths)
- `src/lib/fraction-math.ts` — Full library with `decimalToFraction`, `toMixedNumberString`

**Issue:** `cutting-chart-generator.ts` re-exports `formatFraction` from `piece-detection-utils.ts`, creating unnecessary coupling.

**Fix:**
1. Delete `formatFraction()` from `piece-detection-utils.ts`
2. Update `cutting-chart-generator.ts` to import from `fraction-math.ts`
3. Update all callers to use `fraction-math.ts` functions

---

#### 3. Name Normalization — 3 Implementations
**Impact:** Inconsistent matching behavior across pattern import system

**Locations:**
- `src/lib/pattern-block-matcher.ts:61-63` — `normalizeBlockName()`
- `src/lib/pattern-fabric-matcher.ts:186-188` — `normalizeName()`
- `src/lib/pattern-branding-strip.ts:192-214` — `stripPatternName()`

**Fix:**
```typescript
// Create src/lib/string-utils.ts
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

export function normalizeBlockName(name: string): string {
  return normalizeString(name).replace(/\b(quilt|block|unit)$/, '').trim();
}
```

---

#### 4. GridSettings Interface — 4 Definitions
**Impact:** Type inconsistency, potential runtime errors

**Locations:**
- `src/lib/canvas-utils.ts:4-8` — `{ enabled, size, snapToGrid }`
- `src/stores/canvasStore.ts:50-56` — adds `snapToNodes?`, `showBlockGrid?`
- `src/lib/pattern-import-types.ts:24-30` — adds `rows`, `cols`
- `src/types/project.ts:27-31` — base definition

**Fix:**
```typescript
// src/types/grid.ts
export interface GridSettings {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
}

export interface CanvasGridSettings extends GridSettings {
  snapToNodes?: boolean;
  showBlockGrid?: boolean;
}

export interface PatternGridSettings extends GridSettings {
  rows: number;
  cols: number;
}
```

---

#### 5. Point / Point2D — Multiple Definitions
**Impact:** Type confusion, import inconsistency

**Locations:**
- `src/lib/seam-allowance.ts:14-17` — `Point`
- `src/lib/geometry-extraction.ts:1-4` — `Point2D`
- `src/lib/photo-pattern-types.ts:1-4` — `Point2D` (readonly variant)
- `src/lib/fussy-cut-utils.ts:27-30` — `Point`

**Fix:**
```typescript
// src/types/geometry.ts
export interface Point {
  x: number;
  y: number;
}

export type Point2D = Point; // Alias for backward compatibility
```

---

### MEDIUM Priority

#### 6. ColorThemeTool vs ColorwayTool — Naming Inconsistency
**Impact:** Confusing API, potential bugs

**Location:** `src/stores/canvasStore.ts`
- Line 39: defines `ColorThemeTool`
- Lines 83, 104, 142: references `ColorwayTool`

**Fix:**
1. Search codebase for all `ColorwayTool` references
2. Rename to `ColorThemeTool` consistently
3. Update type definitions and function signatures

---

## ❌ FALSE POSITIVES (No Action Needed)

### 1. OpenCV Pipeline Duplication
**Reported:** 12+ functions duplicated between `piece-detection-utils.ts` and `piece-detection.worker.ts`

**Verdict:** **CANNOT FIX** — Web Workers cannot import ES modules. The duplication is a necessary workaround for browser limitations.

**Reason:** Workers run in isolated contexts without access to the main thread's module system.

---

### 2. SVG Vertex Extraction — 3 Implementations
**Reported:** Duplicate regex `/points="([^"]+)"/` in 3 files

**Verdict:** **NOT DUPLICATES** — Different use cases:
- `cutting-chart-generator.ts:70-96` — Extracts vertices for shape classification
- `piece-inspector-utils.ts:73-79` — Extracts for dimension calculation
- `seam-allowance.ts:79-243` — Full SVG path parser with curve support

**Reason:** Each has domain-specific logic beyond the shared regex.

---

### 3. Pattern Import System — Over-layered
**Reported:** 7 files with circular re-exports

**Verdict:** **INTENTIONAL ARCHITECTURE** — Layered design for separation of concerns:
- `pattern-parser-types.ts` — Type definitions
- `pattern-import-types.ts` — Import-specific types
- `pattern-import-helpers.ts` — Pure functions
- `pattern-import-layouts.ts` — Layout algorithms
- `pattern-import-canvas.ts` — Canvas integration
- `pattern-import-printlist.ts` — Print list generation
- `pattern-import-utils.ts` — Public API facade

**Reason:** Each layer has a clear responsibility. The re-export pattern is a deliberate API design.

---

### 4-10. Color Maps, Normalization, Store Coupling
**Verdict:** **DIFFERENT SCOPES** — Each serves a distinct purpose:
- Color maps: Database seeding vs. runtime matching
- Normalization: Hex parsing vs. color classification
- Store coupling: Acceptable for viewport calculations

---

## Action Plan

### Phase 1: Critical Fixes (Week 1)
1. Create `src/lib/geometry-utils.ts` with canonical bounding box implementation
2. Migrate all 4 bounding box call sites
3. Run full test suite

### Phase 2: High Priority (Week 2)
4. Consolidate fraction formatting to `fraction-math.ts`
5. Create `src/lib/string-utils.ts` for name normalization
6. Unify `GridSettings` type hierarchy

### Phase 3: Medium Priority (Week 3)
7. Resolve `ColorThemeTool` vs `ColorwayTool` naming
8. Consolidate `Point` / `Point2D` types

### Phase 4: Documentation (Week 4)
9. Update architecture docs with canonical import paths
10. Add ESLint rule to prevent future duplication

---

## Testing Strategy

For each fix:
1. **Unit Tests:** Verify behavior matches original
2. **Integration Tests:** Check all call sites
3. **Visual Regression:** Screenshot comparison for UI changes
4. **Performance:** Benchmark critical paths (bounding box, fraction formatting)

---

## Metrics

- **Total Issues Reported:** 16
- **Confirmed Real Issues:** 6 (37.5%)
- **False Positives:** 10 (62.5%)
- **Estimated LOC Reduction:** ~300 lines
- **Estimated Effort:** 2-3 weeks (1 developer)

---

## Conclusion

The codebase has **6 legitimate duplication issues** that should be addressed. The remaining 10 reports are either false positives or intentional design decisions that should be preserved.

Priority should be given to the **bounding box consolidation** (CRITICAL) as it affects multiple core systems and poses the highest maintenance risk.
