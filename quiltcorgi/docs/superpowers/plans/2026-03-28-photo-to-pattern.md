# Photo to Pattern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided flow that lets users photograph a real quilt, auto-detect its block structure via OpenCV.js (WASM), and reconstruct it as an editable pattern in the design studio.

**Architecture:** Pure engine + hook + component pattern (matching existing codebase). Three engine files handle perspective correction, piece detection, and orchestration — all pure functions with zero DOM/React/Fabric.js deps, testable in Vitest `node` env with OpenCV mocked. A Zustand store manages the 6-step flow state. A full-screen modal (not `WizardDialog`) houses steps 1–5; step 6 navigates to a new project in the studio.

**Tech Stack:** `@techstark/opencv-js` v4.12 (WASM), Zustand 5, Fabric.js 7, Next.js 16, Vitest 4, TypeScript 5

---

## File Map

### New Files

| File | Responsibility |
|------|----------------|
| `src/lib/opencv-loader.ts` | Lazy-load + cache OpenCV.js WASM instance |
| `src/lib/photo-pattern-types.ts` | All interfaces: `Point2D`, `Rect`, `DetectedPiece`, `ScaledPiece`, `PipelineStep`, etc. |
| `src/lib/perspective-engine.ts` | Auto-detect quilt boundary (largest quad contour) + compute/apply homography |
| `src/lib/piece-detection-engine.ts` | Detect pieces via adaptive threshold + Hough + contours; scale to inches |
| `src/lib/photo-pattern-engine.ts` | Orchestrator — ties perspective + detection + color extraction into a pipeline |
| `src/stores/photoPatternStore.ts` | Zustand store for the 6-step flow state |
| `src/components/photo-pattern/PhotoPatternModal.tsx` | Full-screen modal shell with step navigation |
| `src/components/photo-pattern/steps/UploadStep.tsx` | Drag & drop image upload with preview |
| `src/components/photo-pattern/steps/CorrectionStep.tsx` | Perspective handles + auto-correct + rotate + crop |
| `src/components/photo-pattern/steps/ProcessingStep.tsx` | Pipeline progress animation (6-step stepper) |
| `src/components/photo-pattern/steps/ResultsStep.tsx` | Photo with seam overlays + sensitivity slider |
| `src/components/photo-pattern/steps/DimensionsStep.tsx` | Quilt size input with presets + seam allowance |
| `src/hooks/usePhotoPatternImport.ts` | Studio-side hook — loads pieces onto Fabric.js canvas |
| `tests/unit/lib/perspective-engine.test.ts` | Perspective math unit tests |
| `tests/unit/lib/piece-detection-engine.test.ts` | Piece detection + scaling unit tests |
| `tests/unit/lib/photo-pattern-engine.test.ts` | Orchestrator unit tests |
| `tests/unit/stores/photoPatternStore.test.ts` | Store action unit tests |

### Modified Files

| File | Change |
|------|--------|
| `next.config.ts` | Add `webpack` fallbacks for `fs`, `path`, `crypto` (OpenCV.js WASM compat) |
| `package.json` | Add `@techstark/opencv-js` dependency |
| `src/app/dashboard/page.tsx` | Wire "Photo to Pattern" card to open `PhotoPatternModal` |
| `src/components/studio/StudioClient.tsx` | Import + render `usePhotoPatternImport` hook for studio integration |
| `src/lib/constants.ts` | Add photo-pattern constants |

---

## Task 1: Install OpenCV.js + Configure Webpack

**Files:**
- Modify: `quiltcorgi/package.json`
- Modify: `quiltcorgi/next.config.ts`

- [ ] **Step 1: Install the dependency**

```bash
cd quiltcorgi && npm install @techstark/opencv-js@4.12.0
```

- [ ] **Step 2: Add webpack fallbacks to next.config.ts**

In `next.config.ts`, add a `webpack` key to the `nextConfig` object. OpenCV.js references Node builtins that don't exist in the browser — these need to be nulled out:

```typescript
const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  async headers() {
    // ... existing headers unchanged
  },
  images: {
    // ... existing images unchanged
  },
};
```

- [ ] **Step 3: Verify the build still compiles**

```bash
cd quiltcorgi && npx next build 2>&1 | head -20
```

Expected: Build succeeds (or only pre-existing warnings). No new errors.

- [ ] **Step 4: Commit**

```bash
git add quiltcorgi/package.json quiltcorgi/package-lock.json quiltcorgi/next.config.ts
git commit -m "chore: install @techstark/opencv-js and add webpack fallbacks"
```

---

## Task 2: Types + Constants

**Files:**
- Create: `src/lib/photo-pattern-types.ts`
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/lib/photo-pattern-types.ts

/**
 * Types for the Photo to Pattern feature.
 * All interfaces are readonly for immutability.
 */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface DetectedPiece {
  readonly id: string;
  readonly contour: readonly Point2D[];
  readonly boundingRect: Rect;
  readonly centroid: Point2D;
  readonly areaPx: number;
  readonly dominantColor: string;
}

export interface ScaledPiece {
  readonly id: string;
  readonly contourInches: readonly Point2D[];
  readonly finishedWidth: string;
  readonly finishedHeight: string;
  readonly cutWidth: string;
  readonly cutHeight: string;
  readonly finishedWidthNum: number;
  readonly finishedHeightNum: number;
  readonly dominantColor: string;
}

export type PipelineStepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface PipelineStep {
  readonly name: string;
  readonly status: PipelineStepStatus;
  readonly message?: string;
}

export type PhotoPatternStep =
  | 'upload'
  | 'correction'
  | 'processing'
  | 'results'
  | 'dimensions'
  | 'complete';

export interface QuiltSizePreset {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}
```

- [ ] **Step 2: Add constants to `src/lib/constants.ts`**

Append to the end of the file:

```typescript
// Photo to Pattern (Phase 21)
export const PHOTO_PATTERN_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const PHOTO_PATTERN_MIN_DIMENSION = 200; // px
export const PHOTO_PATTERN_DOWNSCALE_MAX = 2000; // px longest side
export const PHOTO_PATTERN_SENSITIVITY_MIN = 0.2;
export const PHOTO_PATTERN_SENSITIVITY_MAX = 2.0;
export const PHOTO_PATTERN_SENSITIVITY_DEFAULT = 1.0;
export const PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS = 300;
export const PHOTO_PATTERN_OVERLAY_COLOR = '#00E5FF';
export const PHOTO_PATTERN_OVERLAY_OPACITY = 0.7;
export const PHOTO_PATTERN_PIECE_MIN_AREA_RATIO = 0.005; // 0.5% of image area
export const PHOTO_PATTERN_PIECE_MAX_AREA_RATIO = 0.25;  // 25% of image area
export const PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT = 0.4;

export const QUILT_SIZE_PRESETS: readonly { label: string; width: number; height: number }[] = [
  { label: 'Baby', width: 36, height: 52 },
  { label: 'Throw', width: 50, height: 65 },
  { label: 'Twin', width: 68, height: 90 },
  { label: 'Full/Double', width: 81, height: 96 },
  { label: 'Queen', width: 90, height: 108 },
  { label: 'King', width: 108, height: 108 },
];
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/photo-pattern-types.ts src/lib/constants.ts
git commit -m "feat(photo-pattern): add types and constants"
```

---

## Task 3: OpenCV Loader

**Files:**
- Create: `src/lib/opencv-loader.ts`

- [ ] **Step 1: Create the loader module**

```typescript
// src/lib/opencv-loader.ts

/**
 * Lazy-loads and caches the OpenCV.js WASM instance.
 * ~8MB — only imported when the Photo to Pattern flow starts.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cvInstance: any | null = null;

export async function loadOpenCv(): Promise<any> {
  if (cvInstance) return cvInstance;

  const cv = await import('@techstark/opencv-js');

  await new Promise<void>((resolve, reject) => {
    // If Mat is already available, WASM is initialized
    if (cv.Mat) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      reject(new Error('OpenCV.js WASM initialization timed out after 30s'));
    }, 30_000);

    cv.onRuntimeInitialized = () => {
      clearTimeout(timeout);
      resolve();
    };
  });

  cvInstance = cv;
  return cv;
}

/**
 * Returns true if OpenCV.js has already been loaded and cached.
 */
export function isOpenCvLoaded(): boolean {
  return cvInstance !== null;
}

/**
 * Reset the cached instance (used in tests).
 */
export function resetOpenCv(): void {
  cvInstance = null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/opencv-loader.ts
git commit -m "feat(photo-pattern): add OpenCV.js lazy loader"
```

---

## Task 4: Perspective Engine — Tests First

**Files:**
- Create: `tests/unit/lib/perspective-engine.test.ts`
- Create: `src/lib/perspective-engine.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/lib/perspective-engine.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  sortCornersClockwise,
  autoDetectQuiltBoundary,
  computePerspectiveTransform,
  applyPerspectiveCorrection,
} from '@/lib/perspective-engine';
import type { Point2D } from '@/lib/photo-pattern-types';

// ── sortCornersClockwise ──────────────────────────────────────────────

describe('sortCornersClockwise', () => {
  it('sorts 4 points into TL, TR, BR, BL order', () => {
    // Scrambled corners of a 100x100 square
    const input: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 100, y: 0 },   // TR
      { x: 0, y: 100 },   // BL
      { x: 0, y: 0 },     // TL
      { x: 100, y: 100 }, // BR
    ];
    const result = sortCornersClockwise(input);
    expect(result).toEqual([
      { x: 0, y: 0 },     // TL
      { x: 100, y: 0 },   // TR
      { x: 100, y: 100 }, // BR
      { x: 0, y: 100 },   // BL
    ]);
  });

  it('handles a tilted quadrilateral', () => {
    const input: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 50, y: 10 },
      { x: 90, y: 50 },
      { x: 50, y: 90 },
      { x: 10, y: 50 },
    ];
    const result = sortCornersClockwise(input);
    // TL = smallest x+y sum = {10,50} sum=60 -> TL
    // TR = smallest x-y diff inverted... we just verify order is clockwise
    // The centroid is (50,50). Going clockwise from top:
    expect(result[0]).toEqual({ x: 50, y: 10 }); // top
    expect(result[1]).toEqual({ x: 90, y: 50 }); // right
    expect(result[2]).toEqual({ x: 50, y: 90 }); // bottom
    expect(result[3]).toEqual({ x: 10, y: 50 }); // left
  });
});

// ── autoDetectQuiltBoundary (mocked OpenCV) ───────────────────────────

describe('autoDetectQuiltBoundary', () => {
  it('returns null when no 4-corner contour is found', () => {
    const mockCv = createMockCv({ contourVertexCount: 5 });
    const mockMat = createMockMat(800, 600);
    const result = autoDetectQuiltBoundary(mockCv, mockMat);
    expect(result).toBeNull();
  });

  it('returns sorted corners when a quadrilateral is found', () => {
    const corners = [
      { x: 100, y: 50 },
      { x: 700, y: 50 },
      { x: 700, y: 550 },
      { x: 100, y: 550 },
    ];
    const mockCv = createMockCv({ contourVertexCount: 4, corners });
    const mockMat = createMockMat(800, 600);
    const result = autoDetectQuiltBoundary(mockCv, mockMat);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);
    // TL should be the corner with smallest x+y sum
    expect(result![0]).toEqual({ x: 100, y: 50 });
  });
});

// ── computePerspectiveTransform ───────────────────────────────────────

describe('computePerspectiveTransform', () => {
  it('creates source and dest point matrices and calls getPerspectiveTransform', () => {
    const mockCv = createMockCv({});
    const srcCorners: [Point2D, Point2D, Point2D, Point2D] = [
      { x: 10, y: 10 },
      { x: 90, y: 10 },
      { x: 90, y: 90 },
      { x: 10, y: 90 },
    ];
    const result = computePerspectiveTransform(mockCv, srcCorners, 200, 200);
    expect(mockCv.getPerspectiveTransform).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});

// ── applyPerspectiveCorrection ────────────────────────────────────────

describe('applyPerspectiveCorrection', () => {
  it('calls warpPerspective and returns a new mat', () => {
    const mockCv = createMockCv({});
    const mockSrc = createMockMat(800, 600);
    const mockMatrix = { delete: vi.fn() };
    const result = applyPerspectiveCorrection(mockCv, mockSrc, mockMatrix, 400, 400);
    expect(mockCv.warpPerspective).toHaveBeenCalled();
    expect(result).toBeDefined();
    expect(result.rows).toBe(400);
  });
});

// ── Test Helpers ──────────────────────────────────────────────────────

function createMockMat(cols: number, rows: number) {
  return {
    rows,
    cols,
    size: () => ({ width: cols, height: rows }),
    delete: vi.fn(),
    data32F: new Float32Array(cols * rows),
  };
}

function createMockCv(opts: {
  contourVertexCount?: number;
  corners?: Point2D[];
}) {
  const { contourVertexCount = 4, corners } = opts;

  // Build a mock contour with the specified vertex count
  const defaultCorners = [
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
    { x: 50, y: 50 }, // extra vertex for non-quad tests
  ].slice(0, contourVertexCount);

  const contourPoints = corners ?? defaultCorners;

  const mockContour = {
    size: () => ({ height: contourPoints.length }),
    data32S: new Int32Array(contourPoints.flatMap((p) => [p.x, p.y])),
    delete: vi.fn(),
  };

  const mockContourVector = {
    size: () => 1,
    get: () => mockContour,
    delete: vi.fn(),
  };

  const mockApprox = {
    size: () => ({ height: contourPoints.length }),
    data32S: new Int32Array(contourPoints.flatMap((p) => [p.x, p.y])),
    delete: vi.fn(),
  };

  const mockHierarchy = { delete: vi.fn() };

  const mockDstMat = {
    rows: 400,
    cols: 400,
    size: () => ({ width: 400, height: 400 }),
    delete: vi.fn(),
  };

  const mockTransformMat = {
    delete: vi.fn(),
  };

  return {
    Mat: vi.fn(() => createMockMat(0, 0)),
    MatVector: vi.fn(() => mockContourVector),
    cvtColor: vi.fn(),
    GaussianBlur: vi.fn(),
    Canny: vi.fn(),
    findContours: vi.fn((_src: unknown, contours: unknown, hierarchy: unknown) => {
      // Mutate the contours vector to contain our mock
      Object.assign(contours, mockContourVector);
    }),
    contourArea: vi.fn(() => 5000),
    arcLength: vi.fn(() => 400),
    approxPolyDP: vi.fn((_contour: unknown, approx: unknown) => {
      Object.assign(approx, mockApprox);
    }),
    getPerspectiveTransform: vi.fn(() => mockTransformMat),
    warpPerspective: vi.fn((_src: unknown, dst: unknown) => {
      Object.assign(dst, mockDstMat);
    }),
    matFromArray: vi.fn(() => ({ delete: vi.fn() })),
    COLOR_RGBA2GRAY: 11,
    RETR_EXTERNAL: 0,
    CHAIN_APPROX_SIMPLE: 2,
    INTER_LINEAR: 1,
    Size: vi.fn((w: number, h: number) => ({ width: w, height: h })),
  };
}
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/perspective-engine.test.ts 2>&1 | tail -5
```

Expected: FAIL — module `@/lib/perspective-engine` not found.

- [ ] **Step 3: Write the perspective engine**

```typescript
// src/lib/perspective-engine.ts

/**
 * Perspective correction engine for Photo to Pattern.
 * Pure functions — depends only on OpenCV.js types (passed as parameter).
 * All cv.Mat objects created internally are deleted before return.
 */

import type { Point2D } from './photo-pattern-types';

/**
 * Sort 4 corner points into clockwise order: TL, TR, BR, BL.
 * Uses the sum (x+y) and difference (x-y) heuristic:
 * - TL has the smallest sum
 * - BR has the largest sum
 * - TR has the smallest difference (y-x, i.e. largest x-y)
 * - BL has the largest difference (y-x, i.e. smallest x-y)
 */
export function sortCornersClockwise(
  corners: [Point2D, Point2D, Point2D, Point2D]
): [Point2D, Point2D, Point2D, Point2D] {
  const sorted = [...corners];
  const sums = sorted.map((p) => p.x + p.y);
  const diffs = sorted.map((p) => p.x - p.y);

  const tlIndex = sums.indexOf(Math.min(...sums));
  const brIndex = sums.indexOf(Math.max(...sums));
  const trIndex = diffs.indexOf(Math.max(...diffs));
  const blIndex = diffs.indexOf(Math.min(...diffs));

  return [sorted[tlIndex], sorted[trIndex], sorted[brIndex], sorted[blIndex]];
}

/**
 * Auto-detect the quilt boundary as the largest quadrilateral contour.
 * Returns 4 sorted corners, or null if no quadrilateral is found.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function autoDetectQuiltBoundary(cv: any, imageMat: any): [Point2D, Point2D, Point2D, Point2D] | null {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    // 1. Grayscale
    cv.cvtColor(imageMat, gray, cv.COLOR_RGBA2GRAY);

    // 2. Gaussian blur (5x5)
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

    // 3. Canny edge detection
    cv.Canny(blurred, edges, 50, 150);

    // 4. Find external contours
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    // 5. Find largest contour by area
    let largestIdx = -1;
    let largestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const area = cv.contourArea(contours.get(i));
      if (area > largestArea) {
        largestArea = area;
        largestIdx = i;
      }
    }

    if (largestIdx < 0) return null;

    // 6. Approximate to polygon
    const contour = contours.get(largestIdx);
    const perimeter = cv.arcLength(contour, true);
    const approx = new cv.Mat();

    try {
      cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

      // 7. Check for 4 vertices
      if (approx.size().height !== 4) return null;

      // Extract corners from approx mat
      const points: Point2D[] = [];
      for (let i = 0; i < 4; i++) {
        points.push({
          x: approx.data32S[i * 2],
          y: approx.data32S[i * 2 + 1],
        });
      }

      return sortCornersClockwise(points as [Point2D, Point2D, Point2D, Point2D]);
    } finally {
      approx.delete();
    }
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Compute the 3x3 perspective transformation matrix from 4 source corners
 * to a flat rectangle of the given dimensions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computePerspectiveTransform(
  cv: any,
  srcCorners: [Point2D, Point2D, Point2D, Point2D],
  destWidth: number,
  destHeight: number
): any {
  const srcArray = cv.matFromArray(4, 1, cv.CV_32FC2, [
    srcCorners[0].x, srcCorners[0].y,
    srcCorners[1].x, srcCorners[1].y,
    srcCorners[2].x, srcCorners[2].y,
    srcCorners[3].x, srcCorners[3].y,
  ]);

  const dstArray = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    destWidth, 0,
    destWidth, destHeight,
    0, destHeight,
  ]);

  try {
    return cv.getPerspectiveTransform(srcArray, dstArray);
  } finally {
    srcArray.delete();
    dstArray.delete();
  }
}

/**
 * Apply a perspective warp to an image using a precomputed transform matrix.
 * Returns a new cv.Mat that the caller owns (must delete).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPerspectiveCorrection(
  cv: any,
  imageMat: any,
  transformMatrix: any,
  width: number,
  height: number
): any {
  const dst = new cv.Mat();
  cv.warpPerspective(imageMat, dst, transformMatrix, new cv.Size(width, height), cv.INTER_LINEAR);
  return dst;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/perspective-engine.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/perspective-engine.ts tests/unit/lib/perspective-engine.test.ts
git commit -m "feat(photo-pattern): add perspective engine with tests"
```

---

## Task 5: Piece Detection Engine — Tests First

**Files:**
- Create: `tests/unit/lib/piece-detection-engine.test.ts`
- Create: `src/lib/piece-detection-engine.ts`

- [ ] **Step 1: Write the failing tests**

The detection pipeline relies heavily on OpenCV and is best tested by testing the pure math functions (scaling, rounding, color extraction) separately from the OpenCV calls.

```typescript
// tests/unit/lib/piece-detection-engine.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  scalePiecesToDimensions,
  filterContoursByArea,
  extractDominantColor,
  roundToEighthUp,
  roundToEighthNearest,
  roundToQuarterNearest,
  formatFraction,
} from '@/lib/piece-detection-engine';
import type { DetectedPiece } from '@/lib/photo-pattern-types';

// ── roundToEighthUp ──────────────────────────────────────────────────

describe('roundToEighthUp', () => {
  it('rounds 3.3 up to 3.375 (3 3/8)', () => {
    expect(roundToEighthUp(3.3)).toBe(3.375);
  });

  it('keeps exact eighths unchanged', () => {
    expect(roundToEighthUp(3.5)).toBe(3.5);
  });

  it('rounds 0.1 up to 0.125', () => {
    expect(roundToEighthUp(0.1)).toBe(0.125);
  });
});

// ── roundToEighthNearest ─────────────────────────────────────────────

describe('roundToEighthNearest', () => {
  it('rounds 3.3 to nearest 3.25 (3 1/4)', () => {
    expect(roundToEighthNearest(3.3)).toBe(3.25);
  });

  it('rounds 3.44 to 3.5 (3 1/2)', () => {
    expect(roundToEighthNearest(3.44)).toBe(3.5);
  });
});

// ── roundToQuarterNearest ────────────────────────────────────────────

describe('roundToQuarterNearest', () => {
  it('rounds 3.3 to 3.25', () => {
    expect(roundToQuarterNearest(3.3)).toBe(3.25);
  });

  it('rounds 3.4 to 3.5', () => {
    expect(roundToQuarterNearest(3.4)).toBe(3.5);
  });
});

// ── formatFraction ───────────────────────────────────────────────────

describe('formatFraction', () => {
  it('formats 3.5 as "3 1/2"', () => {
    expect(formatFraction(3.5)).toBe('3 1/2');
  });

  it('formats 4.875 as "4 7/8"', () => {
    expect(formatFraction(4.875)).toBe('4 7/8');
  });

  it('formats 6.0 as "6"', () => {
    expect(formatFraction(6)).toBe('6');
  });

  it('formats 0.25 as "1/4"', () => {
    expect(formatFraction(0.25)).toBe('1/4');
  });

  it('formats 0.125 as "1/8"', () => {
    expect(formatFraction(0.125)).toBe('1/8');
  });
});

// ── filterContoursByArea ─────────────────────────────────────────────

describe('filterContoursByArea', () => {
  const imageArea = 1000000; // 1000x1000

  it('removes contours smaller than minAreaRatio * imageArea', () => {
    const areas = [100, 5000, 200000, 300000]; // 100 is noise
    const result = filterContoursByArea(areas, imageArea, 0.005, 0.25);
    expect(result).toEqual([false, true, true, false]);
  });

  it('removes contours larger than maxAreaRatio * imageArea', () => {
    const areas = [10000, 260000]; // 260000 > 25%
    const result = filterContoursByArea(areas, imageArea, 0.005, 0.25);
    expect(result).toEqual([true, false]);
  });
});

// ── extractDominantColor ─────────────────────────────────────────────

describe('extractDominantColor', () => {
  it('returns hex color from pixel samples', () => {
    // RGBA: solid red
    const pixels = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 10, 5, 255,
      250, 0, 0, 255,
    ]);
    const result = extractDominantColor(pixels, 2, 2);
    // Average of (255,0,0), (255,0,0), (255,10,5), (250,0,0) ≈ (253,2,1)
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
    // Should be reddish
    expect(result.slice(1, 3)).not.toBe('00');
  });
});

// ── scalePiecesToDimensions ──────────────────────────────────────────

describe('scalePiecesToDimensions', () => {
  const pieces: DetectedPiece[] = [
    {
      id: 'piece-1',
      contour: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      boundingRect: { x: 0, y: 0, width: 100, height: 100 },
      centroid: { x: 50, y: 50 },
      areaPx: 10000,
      dominantColor: '#ff0000',
    },
  ];

  it('scales piece dimensions to inches with 1/4" seam allowance', () => {
    // Image is 400x400px, target is 40x40 inches → 0.1 in/px
    // Piece is 100x100px → 10x10 inches finished
    // Cut = 10 + 2*0.25 = 10.5 inches
    const result = scalePiecesToDimensions(pieces, 400, 400, 40, 40, 0.25);
    expect(result.length).toBe(1);
    expect(result[0].finishedWidthNum).toBe(10);
    expect(result[0].finishedHeightNum).toBe(10);
    expect(result[0].finishedWidth).toBe('10');
    expect(result[0].cutWidth).toBe('10 1/2');
    expect(result[0].dominantColor).toBe('#ff0000');
  });

  it('rounds finished dimensions to nearest 1/8"', () => {
    // Image 300x300, target 40x40 → 0.1333 in/px
    // Piece 100x100 → 13.33 inches → rounds to 13 3/8 (nearest 1/8)
    const result = scalePiecesToDimensions(pieces, 300, 300, 40, 40, 0.25);
    expect(result[0].finishedWidthNum).toBeCloseTo(13.375, 3);
    expect(result[0].finishedWidth).toBe('13 3/8');
  });

  it('rounds cut dimensions UP to nearest 1/8"', () => {
    // finished = 13.375 + 0.5 = 13.875 → rounds up to 13.875 (exact 1/8)
    const result = scalePiecesToDimensions(pieces, 300, 300, 40, 40, 0.25);
    expect(result[0].cutWidth).toBe('13 7/8');
  });

  it('scales contour vertices to inches', () => {
    const result = scalePiecesToDimensions(pieces, 400, 400, 40, 40, 0.25);
    expect(result[0].contourInches[1]).toEqual({ x: 10, y: 0 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/piece-detection-engine.test.ts 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the piece detection engine**

```typescript
// src/lib/piece-detection-engine.ts

/**
 * Piece detection engine for Photo to Pattern.
 * Detects individual quilt pieces from a perspective-corrected image using OpenCV.
 * Pure functions — OpenCV instance passed as parameter.
 */

import type { Point2D, DetectedPiece, ScaledPiece } from './photo-pattern-types';
import { rgbToHex } from './color-math';
import {
  PHOTO_PATTERN_PIECE_MIN_AREA_RATIO,
  PHOTO_PATTERN_PIECE_MAX_AREA_RATIO,
} from './constants';

// ── Rounding Helpers ──────────────────────────────────────────────────

/** Round UP to nearest 1/8" (for cut dimensions). */
export function roundToEighthUp(value: number): number {
  return Math.ceil(value * 8) / 8;
}

/** Round to nearest 1/8" (for finished dimensions). */
export function roundToEighthNearest(value: number): number {
  return Math.round(value * 8) / 8;
}

/** Round to nearest 1/4" (for overall quilt dimensions). */
export function roundToQuarterNearest(value: number): number {
  return Math.round(value * 4) / 4;
}

/** Format a decimal inch value as a quilter-friendly fraction string. */
export function formatFraction(value: number): string {
  const whole = Math.floor(value);
  const frac = value - whole;

  if (frac < 0.001) return String(whole || '0');

  // Find closest 1/8 fraction
  const eighths = Math.round(frac * 8);
  if (eighths === 0) return String(whole);
  if (eighths === 8) return String(whole + 1);

  // Simplify: 2/8=1/4, 4/8=1/2, 6/8=3/4
  let num = eighths;
  let den = 8;
  if (num % 2 === 0) { num /= 2; den /= 2; }
  if (num % 2 === 0) { num /= 2; den /= 2; }

  const fracStr = `${num}/${den}`;
  return whole > 0 ? `${whole} ${fracStr}` : fracStr;
}

// ── Contour Filtering ─────────────────────────────────────────────────

/**
 * Returns a boolean mask: true if the contour area is within the valid range.
 */
export function filterContoursByArea(
  areas: readonly number[],
  imageArea: number,
  minRatio: number = PHOTO_PATTERN_PIECE_MIN_AREA_RATIO,
  maxRatio: number = PHOTO_PATTERN_PIECE_MAX_AREA_RATIO
): boolean[] {
  const minArea = minRatio * imageArea;
  const maxArea = maxRatio * imageArea;
  return areas.map((a) => a >= minArea && a <= maxArea);
}

// ── Color Extraction ──────────────────────────────────────────────────

/**
 * Extract the dominant color from RGBA pixel data by averaging the center region.
 * pixels: Uint8ClampedArray of RGBA values, width x height.
 */
export function extractDominantColor(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): string {
  // Sample the center 50% of the patch
  const x0 = Math.floor(width * 0.25);
  const y0 = Math.floor(height * 0.25);
  const x1 = Math.floor(width * 0.75);
  const y1 = Math.floor(height * 0.75);

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const idx = (y * width + x) * 4;
      totalR += pixels[idx];
      totalG += pixels[idx + 1];
      totalB += pixels[idx + 2];
      count++;
    }
  }

  if (count === 0) return '#000000';

  return rgbToHex({
    r: Math.round(totalR / count),
    g: Math.round(totalG / count),
    b: Math.round(totalB / count),
  });
}

// ── Piece Detection Pipeline ──────────────────────────────────────────

/**
 * Detect individual pieces from a perspective-corrected image.
 * Returns an array of DetectedPiece with pixel coordinates.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectPieces(cv: any, correctedImage: any, sensitivity: number): DetectedPiece[] {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const binary = new cv.Mat();
  const closed = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));

  try {
    const imgWidth = correctedImage.cols;
    const imgHeight = correctedImage.rows;
    const imageArea = imgWidth * imgHeight;

    // 1. Grayscale + blur
    cv.cvtColor(correctedImage, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(7, 7), 0);

    // 2. Adaptive threshold (sensitivity adjusts blockSize and C)
    const blockSize = Math.max(3, Math.round(11 / sensitivity)) | 1; // must be odd
    const cParam = Math.round(2 * sensitivity);
    cv.adaptiveThreshold(
      blurred, binary, 255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY_INV,
      blockSize, cParam
    );

    // 3. Morphological close
    cv.morphologyEx(binary, closed, cv.MORPH_CLOSE, kernel);

    // 4. Canny
    const t1 = Math.round(30 / sensitivity);
    const t2 = Math.round(90 / sensitivity);
    cv.Canny(closed, edges, t1, t2);

    // 5. Find contours
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    // 6. Filter + extract pieces
    const pieces: DetectedPiece[] = [];
    let pieceIndex = 0;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);

      // Filter by area
      if (area < PHOTO_PATTERN_PIECE_MIN_AREA_RATIO * imageArea) continue;
      if (area > PHOTO_PATTERN_PIECE_MAX_AREA_RATIO * imageArea) continue;

      // Approximate to polygon
      const approx = new cv.Mat();
      const peri = cv.arcLength(contour, true);
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      // Extract vertices
      const vertices: Point2D[] = [];
      for (let j = 0; j < approx.size().height; j++) {
        vertices.push({
          x: approx.data32S[j * 2],
          y: approx.data32S[j * 2 + 1],
        });
      }

      // Bounding rect
      const rect = cv.boundingRect(approx);

      // Centroid
      const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
      const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;

      // Dominant color — sample from the original image at the bounding rect center
      let dominantColor = '#888888';
      try {
        const roi = correctedImage.roi(rect);
        const roiData = new Uint8ClampedArray(roi.data);
        dominantColor = extractDominantColor(roiData, rect.width, rect.height);
        roi.delete();
      } catch {
        // Fallback color on ROI extraction failure
      }

      pieces.push({
        id: `piece-${pieceIndex++}`,
        contour: vertices,
        boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        centroid: { x: Math.round(cx), y: Math.round(cy) },
        areaPx: Math.round(area),
        dominantColor,
      });

      approx.delete();
    }

    return pieces;
  } finally {
    gray.delete();
    blurred.delete();
    binary.delete();
    closed.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    kernel.delete();
  }
}

// ── Scale Pieces to Dimensions ────────────────────────────────────────

/**
 * Scale detected pieces from pixel coordinates to real-world inches.
 * Applies quilter-friendly rounding rules.
 */
export function scalePiecesToDimensions(
  pieces: readonly DetectedPiece[],
  imageWidth: number,
  imageHeight: number,
  targetWidthInches: number,
  targetHeightInches: number,
  seamAllowanceInches: number
): ScaledPiece[] {
  const scaleX = targetWidthInches / imageWidth;
  const scaleY = targetHeightInches / imageHeight;

  return pieces.map((piece) => {
    // Scale vertices
    const contourInches = piece.contour.map((p) => ({
      x: roundToEighthNearest(p.x * scaleX),
      y: roundToEighthNearest(p.y * scaleY),
    }));

    // Scale bounding rect dimensions
    const rawW = piece.boundingRect.width * scaleX;
    const rawH = piece.boundingRect.height * scaleY;

    const finishedWidthNum = roundToEighthNearest(rawW);
    const finishedHeightNum = roundToEighthNearest(rawH);

    const cutWidthNum = roundToEighthUp(finishedWidthNum + 2 * seamAllowanceInches);
    const cutHeightNum = roundToEighthUp(finishedHeightNum + 2 * seamAllowanceInches);

    return {
      id: piece.id,
      contourInches,
      finishedWidth: formatFraction(finishedWidthNum),
      finishedHeight: formatFraction(finishedHeightNum),
      cutWidth: formatFraction(cutWidthNum),
      cutHeight: formatFraction(cutHeightNum),
      finishedWidthNum,
      finishedHeightNum,
      dominantColor: piece.dominantColor,
    };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/piece-detection-engine.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/piece-detection-engine.ts tests/unit/lib/piece-detection-engine.test.ts
git commit -m "feat(photo-pattern): add piece detection engine with tests"
```

---

## Task 6: Photo Pattern Orchestrator Engine — Tests First

**Files:**
- Create: `tests/unit/lib/photo-pattern-engine.test.ts`
- Create: `src/lib/photo-pattern-engine.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/lib/photo-pattern-engine.test.ts

import { describe, it, expect, vi } from 'vitest';
import {
  createInitialPipeline,
  advancePipelineStep,
  downscaleIfNeeded,
} from '@/lib/photo-pattern-engine';

// ── createInitialPipeline ─────────────────────────────────────────────

describe('createInitialPipeline', () => {
  it('returns 6 steps all in pending status', () => {
    const steps = createInitialPipeline();
    expect(steps.length).toBe(6);
    expect(steps.every((s) => s.status === 'pending')).toBe(true);
  });

  it('has the correct step names in order', () => {
    const steps = createInitialPipeline();
    expect(steps.map((s) => s.name)).toEqual([
      'Preprocessing image...',
      'Detecting grid structure...',
      'Finding seam lines...',
      'Identifying pieces...',
      'Extracting colors...',
      'Finalizing...',
    ]);
  });
});

// ── advancePipelineStep ──────────────────────────────────────────────

describe('advancePipelineStep', () => {
  it('sets the target step to running', () => {
    const initial = createInitialPipeline();
    const result = advancePipelineStep(initial, 0, 'running');
    expect(result[0].status).toBe('running');
    expect(result[1].status).toBe('pending');
  });

  it('sets previous steps to complete when advancing', () => {
    const initial = createInitialPipeline();
    const step1Running = advancePipelineStep(initial, 0, 'running');
    const step1Complete = advancePipelineStep(step1Running, 0, 'complete');
    const step2Running = advancePipelineStep(step1Complete, 1, 'running');
    expect(step2Running[0].status).toBe('complete');
    expect(step2Running[1].status).toBe('running');
  });

  it('marks a step as error', () => {
    const initial = createInitialPipeline();
    const result = advancePipelineStep(initial, 2, 'error', 'Something went wrong');
    expect(result[2].status).toBe('error');
    expect(result[2].message).toBe('Something went wrong');
  });
});

// ── downscaleIfNeeded ────────────────────────────────────────────────

describe('downscaleIfNeeded', () => {
  it('returns original dimensions if within limit', () => {
    const result = downscaleIfNeeded(1000, 800, 2000);
    expect(result).toEqual({ width: 1000, height: 800, scaled: false });
  });

  it('scales down proportionally when width exceeds limit', () => {
    const result = downscaleIfNeeded(4000, 3000, 2000);
    expect(result).toEqual({ width: 2000, height: 1500, scaled: true });
  });

  it('scales down proportionally when height exceeds limit', () => {
    const result = downscaleIfNeeded(1500, 3000, 2000);
    expect(result).toEqual({ width: 1000, height: 2000, scaled: true });
  });

  it('handles square images', () => {
    const result = downscaleIfNeeded(3000, 3000, 2000);
    expect(result).toEqual({ width: 2000, height: 2000, scaled: true });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/photo-pattern-engine.test.ts 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the orchestrator engine**

```typescript
// src/lib/photo-pattern-engine.ts

/**
 * Photo to Pattern orchestrator engine.
 * Coordinates the full pipeline: perspective correction → piece detection → measurement scaling.
 * Pure functions — OpenCV instance passed as parameter.
 */

import type { PipelineStep, PipelineStepStatus, DetectedPiece, ScaledPiece } from './photo-pattern-types';
import { autoDetectQuiltBoundary, computePerspectiveTransform, applyPerspectiveCorrection } from './perspective-engine';
import { detectPieces, scalePiecesToDimensions } from './piece-detection-engine';
import { PHOTO_PATTERN_DOWNSCALE_MAX } from './constants';

// ── Pipeline Steps ────────────────────────────────────────────────────

const PIPELINE_STEP_NAMES = [
  'Preprocessing image...',
  'Detecting grid structure...',
  'Finding seam lines...',
  'Identifying pieces...',
  'Extracting colors...',
  'Finalizing...',
] as const;

export function createInitialPipeline(): PipelineStep[] {
  return PIPELINE_STEP_NAMES.map((name) => ({
    name,
    status: 'pending' as PipelineStepStatus,
  }));
}

export function advancePipelineStep(
  steps: readonly PipelineStep[],
  index: number,
  status: PipelineStepStatus,
  message?: string
): PipelineStep[] {
  return steps.map((step, i) => {
    if (i === index) {
      return { ...step, status, message };
    }
    return step;
  });
}

// ── Downscaling ───────────────────────────────────────────────────────

export function downscaleIfNeeded(
  width: number,
  height: number,
  maxDimension: number = PHOTO_PATTERN_DOWNSCALE_MAX
): { width: number; height: number; scaled: boolean } {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) {
    return { width, height, scaled: false };
  }

  const ratio = maxDimension / longest;
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
    scaled: true,
  };
}

// ── Full Pipeline ─────────────────────────────────────────────────────

export interface PipelineResult {
  readonly pieces: DetectedPiece[];
  readonly correctedImageData: ImageData | null;
  readonly perspectiveApplied: boolean;
}

/**
 * Run the full photo-to-pattern detection pipeline.
 * onProgress is called as each step advances.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runDetectionPipeline(
  cv: any,
  imageElement: HTMLImageElement,
  sensitivity: number,
  onProgress: (steps: PipelineStep[]) => void
): Promise<PipelineResult> {
  let steps = createInitialPipeline();
  const report = (index: number, status: PipelineStepStatus, message?: string) => {
    steps = advancePipelineStep(steps, index, status, message);
    onProgress(steps);
  };

  // Load image into OpenCV mat
  const canvas = document.createElement('canvas');
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(imageElement, 0, 0);
  const srcMat = cv.imread(canvas);

  try {
    // Step 0: Preprocessing
    report(0, 'running');
    // Downscale for detection (keep srcMat at full res for perspective correction)
    const { width: dw, height: dh, scaled } = downscaleIfNeeded(srcMat.cols, srcMat.rows);
    let processingMat = srcMat;
    if (scaled) {
      processingMat = new cv.Mat();
      cv.resize(srcMat, processingMat, new cv.Size(dw, dh), 0, 0, cv.INTER_AREA);
    }
    report(0, 'complete');

    // Step 1: Grid structure detection (perspective)
    report(1, 'running');
    let correctedMat = processingMat;
    let perspectiveApplied = false;
    const boundary = autoDetectQuiltBoundary(cv, processingMat);
    if (boundary) {
      const transform = computePerspectiveTransform(cv, boundary, dw, dh);
      correctedMat = applyPerspectiveCorrection(cv, processingMat, transform, dw, dh);
      transform.delete();
      if (scaled && processingMat !== srcMat) processingMat.delete();
      perspectiveApplied = true;
    }
    report(1, 'complete');

    // Step 2: Finding seam lines (part of detectPieces)
    report(2, 'running');
    // This is conceptual — the actual seam detection happens in detectPieces
    report(2, 'complete');

    // Step 3: Identifying pieces
    report(3, 'running');
    const pieces = detectPieces(cv, correctedMat, sensitivity);
    report(3, 'complete');

    // Step 4: Extracting colors (already done per-piece in detectPieces)
    report(4, 'running');
    report(4, 'complete');

    // Step 5: Finalizing
    report(5, 'running');

    // Extract corrected image data for display
    let correctedImageData: ImageData | null = null;
    try {
      const outCanvas = document.createElement('canvas');
      outCanvas.width = correctedMat.cols;
      outCanvas.height = correctedMat.rows;
      cv.imshow(outCanvas, correctedMat);
      const outCtx = outCanvas.getContext('2d');
      if (outCtx) {
        correctedImageData = outCtx.getImageData(0, 0, outCanvas.width, outCanvas.height);
      }
    } catch {
      // Non-fatal — UI can fall back to original image
    }

    report(5, 'complete');

    return { pieces, correctedImageData, perspectiveApplied };
  } finally {
    srcMat.delete();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/photo-pattern-engine.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/photo-pattern-engine.ts tests/unit/lib/photo-pattern-engine.test.ts
git commit -m "feat(photo-pattern): add orchestrator engine with tests"
```

---

## Task 7: Zustand Store

**Files:**
- Create: `src/stores/photoPatternStore.ts`
- Create: `tests/unit/stores/photoPatternStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/stores/photoPatternStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';

describe('photoPatternStore', () => {
  beforeEach(() => {
    usePhotoPatternStore.getState().reset();
  });

  it('initializes with upload step and modal closed', () => {
    const state = usePhotoPatternStore.getState();
    expect(state.step).toBe('upload');
    expect(state.isModalOpen).toBe(false);
    expect(state.sensitivity).toBe(1.0);
  });

  it('opens and closes modal', () => {
    usePhotoPatternStore.getState().openModal();
    expect(usePhotoPatternStore.getState().isModalOpen).toBe(true);

    usePhotoPatternStore.getState().closeModal();
    expect(usePhotoPatternStore.getState().isModalOpen).toBe(false);
  });

  it('advances steps', () => {
    usePhotoPatternStore.getState().setStep('correction');
    expect(usePhotoPatternStore.getState().step).toBe('correction');
  });

  it('sets sensitivity within bounds', () => {
    usePhotoPatternStore.getState().setSensitivity(1.5);
    expect(usePhotoPatternStore.getState().sensitivity).toBe(1.5);
  });

  it('sets target dimensions', () => {
    usePhotoPatternStore.getState().setTargetDimensions(90, 108);
    expect(usePhotoPatternStore.getState().targetWidth).toBe(90);
    expect(usePhotoPatternStore.getState().targetHeight).toBe(108);
  });

  it('sets seam allowance', () => {
    usePhotoPatternStore.getState().setSeamAllowance(0.375);
    expect(usePhotoPatternStore.getState().seamAllowance).toBe(0.375);
  });

  it('resets all state', () => {
    usePhotoPatternStore.getState().openModal();
    usePhotoPatternStore.getState().setStep('results');
    usePhotoPatternStore.getState().setSensitivity(1.8);
    usePhotoPatternStore.getState().reset();

    const state = usePhotoPatternStore.getState();
    expect(state.step).toBe('upload');
    expect(state.isModalOpen).toBe(false);
    expect(state.sensitivity).toBe(1.0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd quiltcorgi && npx vitest run tests/unit/stores/photoPatternStore.test.ts 2>&1 | tail -5
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the store**

```typescript
// src/stores/photoPatternStore.ts

'use client';

import { create } from 'zustand';
import type {
  PhotoPatternStep,
  DetectedPiece,
  ScaledPiece,
  PipelineStep,
  Point2D,
} from '@/lib/photo-pattern-types';
import {
  PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  DEFAULT_SEAM_ALLOWANCE_INCHES,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from '@/lib/constants';

interface PhotoPatternState {
  // Flow state
  step: PhotoPatternStep;
  isModalOpen: boolean;

  // Image data
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
  correctedImageData: ImageData | null;
  perspectiveCorners: [Point2D, Point2D, Point2D, Point2D] | null;

  // Detection results
  detectedPieces: readonly DetectedPiece[];
  pipelineSteps: readonly PipelineStep[];
  sensitivity: number;

  // Dimensions
  targetWidth: number;
  targetHeight: number;
  seamAllowance: 0.25 | 0.375;
  lockAspectRatio: boolean;

  // Scaled output
  scaledPieces: readonly ScaledPiece[];

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: PhotoPatternStep) => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setCorrectedImage: (data: ImageData) => void;
  setPerspectiveCorners: (corners: [Point2D, Point2D, Point2D, Point2D]) => void;
  setDetectedPieces: (pieces: readonly DetectedPiece[]) => void;
  setPipelineSteps: (steps: readonly PipelineStep[]) => void;
  setSensitivity: (value: number) => void;
  setTargetDimensions: (width: number, height: number) => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  setLockAspectRatio: (locked: boolean) => void;
  setScaledPieces: (pieces: readonly ScaledPiece[]) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  step: 'upload' as PhotoPatternStep,
  isModalOpen: false,
  originalImage: null,
  originalImageUrl: '',
  correctedImageData: null,
  perspectiveCorners: null,
  detectedPieces: [] as readonly DetectedPiece[],
  pipelineSteps: [] as readonly PipelineStep[],
  sensitivity: PHOTO_PATTERN_SENSITIVITY_DEFAULT,
  targetWidth: DEFAULT_CANVAS_WIDTH,
  targetHeight: DEFAULT_CANVAS_HEIGHT,
  seamAllowance: DEFAULT_SEAM_ALLOWANCE_INCHES as 0.25 | 0.375,
  lockAspectRatio: true,
  scaledPieces: [] as readonly ScaledPiece[],
};

export const usePhotoPatternStore = create<PhotoPatternState>((set) => ({
  ...INITIAL_STATE,

  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setStep: (step) => set({ step }),
  setOriginalImage: (img, url) => set({ originalImage: img, originalImageUrl: url }),
  setCorrectedImage: (data) => set({ correctedImageData: data }),
  setPerspectiveCorners: (corners) => set({ perspectiveCorners: corners }),
  setDetectedPieces: (pieces) => set({ detectedPieces: pieces }),
  setPipelineSteps: (steps) => set({ pipelineSteps: steps }),
  setSensitivity: (value) => set({ sensitivity: value }),
  setTargetDimensions: (width, height) => set({ targetWidth: width, targetHeight: height }),
  setSeamAllowance: (value) => set({ seamAllowance: value }),
  setLockAspectRatio: (locked) => set({ lockAspectRatio: locked }),
  setScaledPieces: (pieces) => set({ scaledPieces: pieces }),
  reset: () => set({ ...INITIAL_STATE }),
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd quiltcorgi && npx vitest run tests/unit/stores/photoPatternStore.test.ts 2>&1 | tail -10
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/photoPatternStore.ts tests/unit/stores/photoPatternStore.test.ts
git commit -m "feat(photo-pattern): add Zustand store with tests"
```

---

## Task 8: Upload Step Component

**Files:**
- Create: `src/components/photo-pattern/steps/UploadStep.tsx`

- [ ] **Step 1: Create the upload step**

```typescript
// src/components/photo-pattern/steps/UploadStep.tsx

'use client';

import { useCallback, useRef, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import {
  PHOTO_PATTERN_MAX_FILE_SIZE,
  PHOTO_PATTERN_MIN_DIMENSION,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';

export function UploadStep() {
  const { originalImageUrl, setOriginalImage, setStep } = usePhotoPatternStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = useCallback(
    (file: File) => {
      setError('');

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
        setError('Please upload a JPG, PNG, or WebP image.');
        return;
      }

      if (file.size > PHOTO_PATTERN_MAX_FILE_SIZE) {
        setError('Image must be under 20 MB.');
        return;
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < PHOTO_PATTERN_MIN_DIMENSION || img.naturalHeight < PHOTO_PATTERN_MIN_DIMENSION) {
          setError(`Image may be too small for accurate detection (minimum ${PHOTO_PATTERN_MIN_DIMENSION}px).`);
          // Allow proceeding despite warning
        }
        setOriginalImage(img, url);
      };
      img.onerror = () => {
        setError('Could not load image. Please try a different file.');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [setOriginalImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          w-full max-w-[500px] aspect-square rounded-xl border-2 border-dashed
          flex flex-col items-center justify-center gap-4 cursor-pointer
          transition-all duration-200
          ${isDragOver ? 'border-primary bg-primary-container/20 scale-[1.02]' : 'border-outline-variant hover:border-primary/50'}
          ${originalImageUrl ? 'p-2' : 'p-8'}
        `}
      >
        {originalImageUrl ? (
          <img
            src={originalImageUrl}
            alt="Uploaded quilt"
            className="w-full h-full object-contain rounded-lg"
          />
        ) : (
          <>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 8v24M12 20l12-12 12 12"
                stroke="var(--color-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 32v4a4 4 0 004 4h24a4 4 0 004-4v-4"
                stroke="var(--color-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-center">
              <p className="text-body-md font-medium text-on-surface">
                Drop your quilt photo here
              </p>
              <p className="text-body-sm text-secondary mt-1">
                or click to browse
              </p>
            </div>
            <p className="text-label-sm text-secondary/60">
              JPG, PNG, or WebP — up to 20 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <p className="text-body-sm text-error text-center max-w-[400px]">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Continue button */}
      {originalImageUrl && (
        <button
          type="button"
          onClick={() => setStep('correction')}
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-body-md hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/steps/UploadStep.tsx
git commit -m "feat(photo-pattern): add upload step component"
```

---

## Task 9: Correction Step Component

**Files:**
- Create: `src/components/photo-pattern/steps/CorrectionStep.tsx`

- [ ] **Step 1: Create the correction step**

This is the most complex UI step — it handles the canvas with draggable corner handles for perspective correction plus rotate/auto-correct controls.

```typescript
// src/components/photo-pattern/steps/CorrectionStep.tsx

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import { autoDetectQuiltBoundary, sortCornersClockwise } from '@/lib/perspective-engine';
import type { Point2D } from '@/lib/photo-pattern-types';

const HANDLE_RADIUS = 10;

export function CorrectionStep() {
  const {
    originalImage,
    perspectiveCorners,
    setPerspectiveCorners,
    setStep,
  } = usePhotoPatternStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const [displayScale, setDisplayScale] = useState(1);

  // Initialize corners to image edges
  useEffect(() => {
    if (!originalImage || perspectiveCorners) return;
    const w = originalImage.naturalWidth;
    const h = originalImage.naturalHeight;
    setPerspectiveCorners([
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ]);
  }, [originalImage, perspectiveCorners, setPerspectiveCorners]);

  // Draw image + handles
  useEffect(() => {
    if (!originalImage || !canvasRef.current || !perspectiveCorners) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!container) return;

    // Fit image to container
    const maxW = container.clientWidth;
    const maxH = container.clientHeight - 80; // leave room for buttons
    const imgW = originalImage.naturalWidth;
    const imgH = originalImage.naturalHeight;
    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    setDisplayScale(scale);

    canvas.width = Math.round(imgW * scale);
    canvas.height = Math.round(imgH * scale);

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation around center
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw perspective quad
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    const scaled = perspectiveCorners.map((p) => ({
      x: p.x * scale,
      y: p.y * scale,
    }));
    ctx.moveTo(scaled[0].x, scaled[0].y);
    for (let i = 1; i < 4; i++) ctx.lineTo(scaled[i].x, scaled[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw corner handles
    for (const pt of scaled) {
      ctx.fillStyle = '#00E5FF';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [originalImage, perspectiveCorners, rotation, displayScale]);

  // Handle corner dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!perspectiveCorners || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      for (let i = 0; i < 4; i++) {
        const px = perspectiveCorners[i].x * displayScale;
        const py = perspectiveCorners[i].y * displayScale;
        const dx = mx - px;
        const dy = my - py;
        if (Math.sqrt(dx * dx + dy * dy) < HANDLE_RADIUS * 2) {
          setDraggingCorner(i);
          return;
        }
      }
    },
    [perspectiveCorners, displayScale]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingCorner === null || !perspectiveCorners || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const newCorners = [...perspectiveCorners] as [Point2D, Point2D, Point2D, Point2D];
      newCorners[draggingCorner] = {
        x: Math.round(mx / displayScale),
        y: Math.round(my / displayScale),
      };
      setPerspectiveCorners(newCorners);
    },
    [draggingCorner, perspectiveCorners, displayScale, setPerspectiveCorners]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingCorner(null);
  }, []);

  // Auto-detect via OpenCV
  const handleAutoCorrect = useCallback(async () => {
    if (!originalImage) return;
    setIsAutoDetecting(true);
    try {
      const cv = await loadOpenCv();
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.naturalWidth;
      canvas.height = originalImage.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(originalImage, 0, 0);
      const mat = cv.imread(canvas);

      try {
        const boundary = autoDetectQuiltBoundary(cv, mat);
        if (boundary) {
          setPerspectiveCorners(boundary);
        } else {
          // Keep current corners, show toast
          alert("Couldn't auto-detect edges — drag the corners manually.");
        }
      } finally {
        mat.delete();
      }
    } catch {
      alert('Auto-detection failed. Please adjust corners manually.');
    } finally {
      setIsAutoDetecting(false);
    }
  }, [originalImage, setPerspectiveCorners]);

  if (!originalImage) return null;

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-outline-variant/20">
        <button
          type="button"
          onClick={handleAutoCorrect}
          disabled={isAutoDetecting}
          className="px-3 py-1.5 rounded-md bg-surface-container text-body-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          {isAutoDetecting ? 'Detecting...' : 'Auto-correct'}
        </button>
        <div className="w-px h-5 bg-outline-variant/30" />
        <button
          type="button"
          onClick={() => setRotation((r) => r - 90)}
          className="p-1.5 rounded-md hover:bg-surface-container transition-colors"
          title="Rotate 90 CCW"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3 9a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3 5v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => r + 90)}
          className="p-1.5 rounded-md hover:bg-surface-container transition-colors"
          title="Rotate 90 CW"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M15 9a6 6 0 01-12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M15 5v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-crosshair rounded-lg shadow-elevation-1"
        />
      </div>

      {/* Bottom action */}
      <div className="flex justify-end p-4 border-t border-outline-variant/20">
        <button
          type="button"
          onClick={() => setStep('processing')}
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-body-md hover:opacity-90 transition-opacity"
        >
          Render Pattern
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/steps/CorrectionStep.tsx
git commit -m "feat(photo-pattern): add correction step with perspective handles"
```

---

## Task 10: Processing Step Component

**Files:**
- Create: `src/components/photo-pattern/steps/ProcessingStep.tsx`

- [ ] **Step 1: Create the processing step**

```typescript
// src/components/photo-pattern/steps/ProcessingStep.tsx

'use client';

import { useEffect, useRef } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import { runDetectionPipeline } from '@/lib/photo-pattern-engine';

export function ProcessingStep() {
  const {
    originalImage,
    sensitivity,
    pipelineSteps,
    setPipelineSteps,
    setDetectedPieces,
    setCorrectedImage,
    setStep,
  } = usePhotoPatternStore();

  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current || !originalImage) return;
    ranRef.current = true;

    async function run() {
      try {
        const cv = await loadOpenCv();
        const result = await runDetectionPipeline(cv, originalImage!, sensitivity, (steps) => {
          setPipelineSteps(steps);
        });

        setDetectedPieces(result.pieces);
        if (result.correctedImageData) {
          setCorrectedImage(result.correctedImageData);
        }

        // Auto-advance after brief pause
        setTimeout(() => setStep('results'), 400);
      } catch (err) {
        setPipelineSteps((prev) => {
          const steps = [...(Array.isArray(prev) ? prev : [])];
          const runningIdx = steps.findIndex((s) => s.status === 'running');
          if (runningIdx >= 0) {
            steps[runningIdx] = {
              ...steps[runningIdx],
              status: 'error',
              message: 'Something went wrong. Try a different photo or adjust sensitivity.',
            };
          }
          return steps;
        });
      }
    }

    run();
  }, [originalImage, sensitivity, setPipelineSteps, setDetectedPieces, setCorrectedImage, setStep]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <h2 className="text-headline-md font-bold text-on-surface">Analyzing your quilt</h2>

      <div className="w-full max-w-[360px] flex flex-col gap-3">
        {pipelineSteps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Status icon */}
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {step.status === 'complete' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="var(--color-success)" opacity="0.15" />
                  <path d="M6 10l3 3 5-6" stroke="var(--color-success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {step.status === 'running' && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {step.status === 'pending' && (
                <div className="w-3 h-3 rounded-full bg-outline-variant/40" />
              )}
              {step.status === 'error' && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" fill="var(--color-error)" opacity="0.15" />
                  <path d="M7 7l6 6M13 7l-6 6" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Step text */}
            <span
              className={`text-body-md ${
                step.status === 'running'
                  ? 'text-on-surface font-medium'
                  : step.status === 'complete'
                    ? 'text-secondary'
                    : step.status === 'error'
                      ? 'text-error'
                      : 'text-secondary/50'
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {pipelineSteps.some((s) => s.status === 'error') && (
        <div className="text-center">
          <p className="text-body-sm text-error mb-3">
            {pipelineSteps.find((s) => s.status === 'error')?.message}
          </p>
          <button
            type="button"
            onClick={() => {
              ranRef.current = false;
              usePhotoPatternStore.getState().setStep('correction');
            }}
            className="px-4 py-2 rounded-md bg-surface-container text-body-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Go back and adjust
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/steps/ProcessingStep.tsx
git commit -m "feat(photo-pattern): add processing step with pipeline progress"
```

---

## Task 11: Results Step Component

**Files:**
- Create: `src/components/photo-pattern/steps/ResultsStep.tsx`

- [ ] **Step 1: Create the results step**

```typescript
// src/components/photo-pattern/steps/ResultsStep.tsx

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import {
  PHOTO_PATTERN_OVERLAY_COLOR,
  PHOTO_PATTERN_OVERLAY_OPACITY,
  PHOTO_PATTERN_SENSITIVITY_MIN,
  PHOTO_PATTERN_SENSITIVITY_MAX,
  PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS,
} from '@/lib/constants';

export function ResultsStep() {
  const {
    correctedImageData,
    originalImage,
    originalImageUrl,
    detectedPieces,
    sensitivity,
    setSensitivity,
    setStep,
  } = usePhotoPatternStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const [isRescanning, setIsRescanning] = useState(false);

  // Draw the corrected image with piece outlines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = correctedImageData;
    const img = originalImage;
    if (!imgData && !img) return;

    const w = imgData?.width ?? img!.naturalWidth;
    const h = imgData?.height ?? img!.naturalHeight;

    // Fit to container
    const maxW = canvas.parentElement?.clientWidth ?? 800;
    const maxH = (canvas.parentElement?.clientHeight ?? 600) - 100;
    const scale = Math.min(maxW / w, maxH / h, 1);

    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);

    const ctx = canvas.getContext('2d')!;

    // Draw image
    if (imgData) {
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = w;
      tmpCanvas.height = h;
      tmpCanvas.getContext('2d')!.putImageData(imgData, 0, 0);
      ctx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);
    } else if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }

    // Draw piece outlines
    ctx.strokeStyle = PHOTO_PATTERN_OVERLAY_COLOR;
    ctx.globalAlpha = PHOTO_PATTERN_OVERLAY_OPACITY;
    ctx.lineWidth = 2;

    for (const piece of detectedPieces) {
      if (piece.contour.length < 3) continue;
      ctx.beginPath();
      ctx.moveTo(piece.contour[0].x * scale, piece.contour[0].y * scale);
      for (let i = 1; i < piece.contour.length; i++) {
        ctx.lineTo(piece.contour[i].x * scale, piece.contour[i].y * scale);
      }
      ctx.closePath();
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }, [correctedImageData, originalImage, detectedPieces]);

  // Debounced re-scan when sensitivity changes
  const handleSensitivityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setSensitivity(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setIsRescanning(true);
        // Re-run pipeline by going back to processing step
        usePhotoPatternStore.getState().setStep('processing');
      }, PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS);
    },
    [setSensitivity]
  );

  const pieceCount = detectedPieces.length;

  return (
    <div className="flex flex-col h-full">
      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <canvas ref={canvasRef} className="rounded-lg shadow-elevation-1" />
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center gap-4 p-4 border-t border-outline-variant/20">
        {/* Piece count */}
        <span className="text-body-sm text-secondary whitespace-nowrap">
          {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'} detected
        </span>

        {/* Sensitivity slider */}
        <div className="flex items-center gap-2 flex-1 max-w-[300px]">
          <span className="text-label-sm text-secondary">Sensitivity</span>
          <input
            type="range"
            min={PHOTO_PATTERN_SENSITIVITY_MIN}
            max={PHOTO_PATTERN_SENSITIVITY_MAX}
            step={0.1}
            value={sensitivity}
            onChange={handleSensitivityChange}
            className="flex-1 accent-primary"
          />
          <span className="text-label-sm text-secondary w-8 text-right">{sensitivity.toFixed(1)}</span>
        </div>

        {/* Re-scan button */}
        <button
          type="button"
          onClick={() => {
            setIsRescanning(true);
            usePhotoPatternStore.getState().setStep('processing');
          }}
          disabled={isRescanning}
          className="px-3 py-1.5 rounded-md bg-surface-container text-body-sm text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          Re-scan
        </button>

        <div className="flex-1" />

        {/* Continue */}
        <button
          type="button"
          onClick={() => setStep('dimensions')}
          disabled={pieceCount === 0}
          className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-medium text-body-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Project
        </button>
      </div>

      {pieceCount === 0 && (
        <p className="text-body-sm text-error text-center pb-3">
          No pieces detected. Try lowering the sensitivity slider.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/steps/ResultsStep.tsx
git commit -m "feat(photo-pattern): add results step with sensitivity slider"
```

---

## Task 12: Dimensions Step Component

**Files:**
- Create: `src/components/photo-pattern/steps/DimensionsStep.tsx`

- [ ] **Step 1: Create the dimensions step**

```typescript
// src/components/photo-pattern/steps/DimensionsStep.tsx

'use client';

import { useCallback } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { scalePiecesToDimensions } from '@/lib/piece-detection-engine';
import { QUILT_SIZE_PRESETS, DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

export function DimensionsStep() {
  const {
    targetWidth,
    targetHeight,
    seamAllowance,
    lockAspectRatio,
    detectedPieces,
    correctedImageData,
    originalImage,
    setTargetDimensions,
    setSeamAllowance,
    setLockAspectRatio,
    setScaledPieces,
    setStep,
  } = usePhotoPatternStore();

  const imgW = correctedImageData?.width ?? originalImage?.naturalWidth ?? 1;
  const imgH = correctedImageData?.height ?? originalImage?.naturalHeight ?? 1;
  const aspectRatio = imgW / imgH;

  const handleWidthChange = useCallback(
    (w: number) => {
      const h = lockAspectRatio ? Math.round(w / aspectRatio) : targetHeight;
      setTargetDimensions(w, h);
    },
    [lockAspectRatio, aspectRatio, targetHeight, setTargetDimensions]
  );

  const handleHeightChange = useCallback(
    (h: number) => {
      const w = lockAspectRatio ? Math.round(h * aspectRatio) : targetWidth;
      setTargetDimensions(w, h);
    },
    [lockAspectRatio, aspectRatio, targetWidth, setTargetDimensions]
  );

  const handlePreset = useCallback(
    (width: number, height: number) => {
      setTargetDimensions(width, height);
    },
    [setTargetDimensions]
  );

  const handleCalculate = useCallback(() => {
    const scaled = scalePiecesToDimensions(
      detectedPieces as any[], // readonly → mutable for function
      imgW,
      imgH,
      targetWidth,
      targetHeight,
      seamAllowance
    );
    setScaledPieces(scaled);
    setStep('complete');
  }, [detectedPieces, imgW, imgH, targetWidth, targetHeight, seamAllowance, setScaledPieces, setStep]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      <div className="text-center">
        <h2 className="text-headline-md font-bold text-on-surface">What size is this quilt?</h2>
        <p className="text-body-md text-secondary mt-2">
          Choose a standard size or enter custom dimensions
        </p>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 justify-center max-w-[500px]">
        {QUILT_SIZE_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => handlePreset(preset.width, preset.height)}
            className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
              targetWidth === preset.width && targetHeight === preset.height
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {preset.label}
            <span className="block text-[10px] opacity-70">
              {preset.width}" x {preset.height}"
            </span>
          </button>
        ))}
      </div>

      {/* Custom inputs */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <label className="text-label-sm text-secondary">Width (inches)</label>
          <input
            type="number"
            value={targetWidth}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            min={12}
            max={200}
            className="w-24 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-center text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>

        {/* Lock toggle */}
        <button
          type="button"
          onClick={() => setLockAspectRatio(!lockAspectRatio)}
          className={`mt-5 p-1.5 rounded-md transition-colors ${
            lockAspectRatio ? 'text-primary' : 'text-secondary'
          }`}
          title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {lockAspectRatio ? (
              <path
                d="M5 8V6a4 4 0 018 0v2M4 8h10a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            ) : (
              <>
                <path
                  d="M13 8V6a4 4 0 00-7.5-2M4 8h10a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
        </button>

        <div className="flex flex-col items-center gap-1">
          <label className="text-label-sm text-secondary">Height (inches)</label>
          <input
            type="number"
            value={targetHeight}
            onChange={(e) => handleHeightChange(Number(e.target.value))}
            min={12}
            max={200}
            className="w-24 px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-center text-body-md text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Seam allowance */}
      <div className="flex items-center gap-3">
        <span className="text-body-sm text-secondary">Seam allowance:</span>
        <button
          type="button"
          onClick={() => setSeamAllowance(0.25)}
          className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
            seamAllowance === 0.25
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          1/4" (standard)
        </button>
        <button
          type="button"
          onClick={() => setSeamAllowance(0.375)}
          className={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
            seamAllowance === 0.375
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
          }`}
        >
          3/8"
        </button>
      </div>

      {/* Calculate button */}
      <button
        type="button"
        onClick={handleCalculate}
        className="px-8 py-3 rounded-lg bg-primary text-on-primary font-medium text-body-md hover:opacity-90 transition-opacity"
      >
        Calculate Pieces
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/steps/DimensionsStep.tsx
git commit -m "feat(photo-pattern): add dimensions step with presets"
```

---

## Task 13: Modal Shell

**Files:**
- Create: `src/components/photo-pattern/PhotoPatternModal.tsx`

- [ ] **Step 1: Create the modal shell**

```typescript
// src/components/photo-pattern/PhotoPatternModal.tsx

'use client';

import { useEffect } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv, isOpenCvLoaded } from '@/lib/opencv-loader';
import { UploadStep } from './steps/UploadStep';
import { CorrectionStep } from './steps/CorrectionStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { ResultsStep } from './steps/ResultsStep';
import { DimensionsStep } from './steps/DimensionsStep';

const STEP_TITLES: Record<string, string> = {
  upload: 'Upload Photo',
  correction: 'Adjust & Crop',
  processing: 'Analyzing...',
  results: 'Detected Pattern',
  dimensions: 'Quilt Dimensions',
};

export function PhotoPatternModal() {
  const { isModalOpen, step, closeModal, reset } = usePhotoPatternStore();

  // Pre-load OpenCV when modal opens
  useEffect(() => {
    if (isModalOpen && !isOpenCvLoaded()) {
      loadOpenCv().catch(() => {
        // Will be handled when user triggers auto-correct or processing
      });
    }
  }, [isModalOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isModalOpen]);

  const handleClose = () => {
    reset();
    closeModal();
  };

  if (!isModalOpen) return null;

  // Step 'complete' means we need to navigate to studio — handled by parent
  if (step === 'complete') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-[95vw] max-w-[1000px] h-[80vh] bg-surface rounded-2xl shadow-elevation-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <h1 className="text-headline-sm font-bold text-on-surface">
              Photo to Pattern
            </h1>
            <span className="text-body-sm text-secondary">
              — {STEP_TITLES[step] ?? ''}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-secondary"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-hidden">
          {step === 'upload' && <UploadStep />}
          {step === 'correction' && <CorrectionStep />}
          {step === 'processing' && <ProcessingStep />}
          {step === 'results' && <ResultsStep />}
          {step === 'dimensions' && <DimensionsStep />}
        </div>

        {/* Step indicators */}
        <div className="flex justify-center gap-1.5 py-3 border-t border-outline-variant/10">
          {['upload', 'correction', 'processing', 'results', 'dimensions'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-colors ${
                s === step ? 'bg-primary' : 'bg-outline-variant/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-pattern/PhotoPatternModal.tsx
git commit -m "feat(photo-pattern): add full-screen modal shell"
```

---

## Task 14: Dashboard Integration

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Import and wire the modal**

At the top of `dashboard/page.tsx`, add the import:

```typescript
import { PhotoPatternModal } from '@/components/photo-pattern/PhotoPatternModal';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
```

- [ ] **Step 2: Add modal open handler and navigation**

Inside `DashboardPage()`, add after the existing state declarations:

```typescript
const openPhotoPattern = usePhotoPatternStore((s) => s.openModal);
const photoPatternStep = usePhotoPatternStore((s) => s.step);
const isPhotoPatternOpen = usePhotoPatternStore((s) => s.isModalOpen);
```

Add a `useEffect` to handle the `complete` step → create project → navigate:

```typescript
useEffect(() => {
  if (photoPatternStep !== 'complete' || !isPhotoPatternOpen) return;

  async function createProjectAndNavigate() {
    try {
      const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const { targetWidth, targetHeight } = usePhotoPatternStore.getState();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Photo Import — ${date}`,
          canvasWidth: targetWidth,
          canvasHeight: targetHeight,
        }),
      });
      if (!res.ok) throw new Error('Failed to create project');
      const data = await res.json();
      // Navigate to studio — the store data (scaledPieces, correctedImageData)
      // will be picked up by usePhotoPatternImport in the studio
      window.location.href = `/studio/${data.data.id}`;
    } catch {
      alert('Failed to create project. Please try again.');
      usePhotoPatternStore.getState().setStep('dimensions');
    }
  }

  createProjectAndNavigate();
}, [photoPatternStep, isPhotoPatternOpen]);
```

- [ ] **Step 3: Change the "Photo to Pattern" card to open the modal**

Find the existing "Photo to Pattern" card (currently a `<Link href="/studio">`). Replace it with a `<button>` that opens the modal:

```typescript
{/* Photo to Pattern — 5 cols, with quilt image + opencv overlay */}
<button
  type="button"
  onClick={() => openPhotoPattern()}
  className="col-span-12 md:col-span-5 rounded-[18px] overflow-hidden transition-all duration-200 hover:shadow-elevation-2 block relative group text-left"
>
  {/* ... keep existing inner content (image + SVG overlay) unchanged ... */}
</button>
```

The inner content (the `<Image>`, the SVG overlay, and the bottom label) stays the same — only the wrapper element changes from `<Link>` to `<button>`.

- [ ] **Step 4: Add the modal render at the bottom of the component return**

Before the closing `</>` of the `activeTab === 'my-quilts'` branch, add:

```typescript
<PhotoPatternModal />
```

- [ ] **Step 5: Verify the build**

```bash
cd quiltcorgi && npx next build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(photo-pattern): wire dashboard card to open modal"
```

---

## Task 15: Studio Integration Hook

**Files:**
- Create: `src/hooks/usePhotoPatternImport.ts`

- [ ] **Step 1: Create the studio import hook**

This hook runs once when the studio mounts and the `photoPatternStore` has `scaledPieces` data. It loads the detected pieces onto the Fabric.js canvas and sets up the reference image.

```typescript
// src/hooks/usePhotoPatternImport.ts

'use client';

import { useEffect, useRef } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { PIXELS_PER_INCH, PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT } from '@/lib/constants';

/**
 * On studio mount, if the photoPatternStore has scaled pieces,
 * load them onto the Fabric.js canvas as polygon objects with a
 * reference photo background.
 */
export function usePhotoPatternImport() {
  const importedRef = useRef(false);

  const scaledPieces = usePhotoPatternStore((s) => s.scaledPieces);
  const correctedImageData = usePhotoPatternStore((s) => s.correctedImageData);
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  useEffect(() => {
    if (importedRef.current || !fabricCanvas || scaledPieces.length === 0) return;
    importedRef.current = true;

    async function loadPieces() {
      const fabric = await import('fabric');
      const canvas = fabricCanvas!;
      const { targetWidth, targetHeight } = usePhotoPatternStore.getState();

      // 1. Set reference image as background
      const imgUrl = originalImageUrl;
      if (imgUrl) {
        try {
          const bgImg = await fabric.FabricImage.fromURL(imgUrl);
          bgImg.set({
            scaleX: (targetWidth * PIXELS_PER_INCH) / (bgImg.width ?? 1),
            scaleY: (targetHeight * PIXELS_PER_INCH) / (bgImg.height ?? 1),
            opacity: PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT,
            selectable: false,
            evented: false,
          });
          canvas.backgroundImage = bgImg;
        } catch {
          // Non-fatal — continue without reference image
        }
      }

      // 2. Create polygon objects for each piece
      for (const piece of scaledPieces) {
        const points = piece.contourInches.map((p) => ({
          x: p.x * PIXELS_PER_INCH,
          y: p.y * PIXELS_PER_INCH,
        }));

        if (points.length < 3) continue;

        const polygon = new fabric.Polygon(points, {
          fill: piece.dominantColor,
          stroke: '#4A3B32',
          strokeWidth: 1,
          selectable: true,
          objectCaching: false,
        });

        canvas.add(polygon);
      }

      canvas.renderAll();

      // 3. Set reference image opacity in canvas store
      useCanvasStore.getState().setReferenceImageOpacity(PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT);

      // 4. Clean up the photo pattern store (data has been applied)
      usePhotoPatternStore.getState().reset();
    }

    loadPieces();
  }, [fabricCanvas, scaledPieces, correctedImageData, originalImageUrl]);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePhotoPatternImport.ts
git commit -m "feat(photo-pattern): add studio import hook"
```

---

## Task 16: Wire Hook into StudioClient

**Files:**
- Modify: `src/components/studio/StudioClient.tsx`

- [ ] **Step 1: Import the hook**

Add at the top of `StudioClient.tsx`:

```typescript
import { usePhotoPatternImport } from '@/hooks/usePhotoPatternImport';
```

- [ ] **Step 2: Call the hook inside StudioClient**

Inside the `StudioClient` function body, after the existing `useYardageCalculation()` call, add:

```typescript
usePhotoPatternImport();
```

- [ ] **Step 3: Verify the build**

```bash
cd quiltcorgi && npx next build 2>&1 | tail -10
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/studio/StudioClient.tsx
git commit -m "feat(photo-pattern): wire import hook into studio"
```

---

## Task 17: Run Full Test Suite

**Files:** None (verification only)

- [ ] **Step 1: Run all photo-pattern tests**

```bash
cd quiltcorgi && npx vitest run tests/unit/lib/perspective-engine.test.ts tests/unit/lib/piece-detection-engine.test.ts tests/unit/lib/photo-pattern-engine.test.ts tests/unit/stores/photoPatternStore.test.ts 2>&1 | tail -20
```

Expected: All tests pass.

- [ ] **Step 2: Run the full test suite to check for regressions**

```bash
cd quiltcorgi && npx vitest run 2>&1 | tail -20
```

Expected: All existing tests still pass. No regressions.

- [ ] **Step 3: Build check**

```bash
cd quiltcorgi && npx next build 2>&1 | tail -10
```

Expected: Build succeeds.

---

## Task 18: Final Commit + Verify

- [ ] **Step 1: Check git status**

```bash
cd quiltcorgi && git status
```

All photo-pattern files should be committed. No unstaged changes from this feature.

- [ ] **Step 2: Verify the commit log**

```bash
cd quiltcorgi && git log --oneline -10
```

Expected: ~10 commits for this feature, all prefixed with `feat(photo-pattern):` or `chore:`.

---

## Appendix: What Was NOT Implemented (Future Enhancements)

These items from the spec are deferred to v2:

1. **Web Worker offloading** — v1 runs OpenCV on the main thread with a processing overlay. If jank is unacceptable, move pipeline to a Web Worker.
2. **Adding to existing projects** — v1 always creates a new project. Future: let users import into an existing project.
3. **Opacity slider in studio toolbar** — The studio already has `referenceImageOpacity` in canvasStore. A toolbar control can be added separately.
4. **Existing OCR fallback** — The spec says keep `quilt-ocr-engine.ts` as fallback. This is already the case since we didn't modify it. A feature flag to switch between engines can be added later.
