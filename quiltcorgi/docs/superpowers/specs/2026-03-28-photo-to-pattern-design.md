# Photo to Pattern — Design Spec

**Date:** 2026-03-28
**Status:** Draft
**Scope:** Full-stack feature — dashboard card through project grid overlay

---

## Overview

A guided flow that lets users photograph a real quilt, automatically detect its block structure, and reconstruct it as an editable pattern in the design studio. Replaces the existing `QuiltPhotoImportWizard` (7-step) and upgrades the custom OCR sub-modules with OpenCV.js (WASM) for production-grade computer vision.

## User Flow

```
Dashboard card click
  → Upload modal (80% viewport)
    → Auto-correct / manual perspective + crop
      → "Render Pattern" button
        → Processing animation (OpenCV pipeline)
          → Results view: photo with seam-line overlays
            → Sensitivity slider + "Re-scan" if needed
              → "Add to Project" button
                → Dimension input (quilt size)
                  → Piece measurement calculation (quilter-friendly rounding)
                    → Studio grid: outlined pieces + opacity slider for original photo
```

**6 steps** — the first 5 are within a single full-screen modal (not the existing `WizardDialog` — too narrow at 600px for image editing). Step 6 exits the modal and navigates to the studio.

---

## 1. OpenCV.js Integration

### Package

**`@techstark/opencv-js`** v4.12.0 — precompiled OpenCV 4.12 WASM, npm installable, works in browser and Node.js.

```bash
npm install @techstark/opencv-js
```

### Loading Strategy

OpenCV.js is ~8MB. It must NOT be in the main bundle. Strategy:

1. **Dynamic import** — `const cv = await import('@techstark/opencv-js')` only when the user opens the Photo to Pattern flow.
2. **Wrapper module** — `src/lib/opencv-loader.ts` handles initialization, caches the instance, and provides a typed API surface. Returns a promise that resolves when WASM is ready.
3. **Loading UI** — while WASM loads (~2-4s on broadband), show a skeleton with "Loading computer vision engine..." message and a progress indicator.
4. **Next.js config** — add webpack fallbacks for `fs`, `path`, `crypto` (Node builtins that OpenCV.js references but doesn't need in browser). Configure as external/null in `next.config.ts`.

```typescript
// src/lib/opencv-loader.ts
let cvInstance: typeof import('@techstark/opencv-js') | null = null;

export async function loadOpenCv() {
  if (cvInstance) return cvInstance;
  const cv = await import('@techstark/opencv-js');
  // Wait for WASM initialization
  await new Promise<void>((resolve) => {
    if (cv.Mat) { resolve(); return; }
    cv.onRuntimeInitialized = () => resolve();
  });
  cvInstance = cv;
  return cv;
}
```

### OpenCV APIs Used

| API | Purpose |
|-----|---------|
| `cv.imread(canvas)` | Load image from canvas element |
| `cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY)` | Grayscale conversion |
| `cv.GaussianBlur(src, dst, ksize, sigma)` | Noise reduction |
| `cv.adaptiveThreshold(src, dst, ...)` | Shadow-robust binarization |
| `cv.Canny(src, dst, t1, t2)` | Edge detection (replaces custom Sobel) |
| `cv.HoughLinesP(edges, lines, ...)` | Probabilistic Hough (replaces custom Hough) |
| `cv.findContours(src, contours, hierarchy, ...)` | Boundary detection |
| `cv.approxPolyDP(contour, approx, epsilon, closed)` | Polygon approximation |
| `cv.minAreaRect(contour)` | Bounding rectangle |
| `cv.getPerspectiveTransform(src4, dst4)` | Homography matrix from 4 points |
| `cv.warpPerspective(src, dst, M, dsize)` | Apply perspective correction |
| `cv.imshow(canvas, mat)` | Render result to canvas |

### Memory Management

OpenCV.js uses C++ memory through WASM. Every `cv.Mat` must be explicitly freed with `.delete()`. The engine module will use a cleanup pattern:

```typescript
function withMats<T>(fn: (...mats: cv.Mat[]) => T, ...mats: cv.Mat[]): T {
  try {
    return fn(...mats);
  } finally {
    mats.forEach(m => m.delete());
  }
}
```

---

## 2. Architecture

### New Files

| File | Type | Purpose |
|------|------|---------|
| `src/lib/opencv-loader.ts` | Utility | Lazy-load + cache OpenCV.js instance |
| `src/lib/photo-pattern-engine.ts` | Engine | Pure orchestrator — perspective correction, grid detection, piece extraction, measurement scaling |
| `src/lib/photo-pattern-types.ts` | Types | All interfaces for the feature |
| `src/lib/perspective-engine.ts` | Engine | Auto-detect quilt boundary + compute homography |
| `src/lib/piece-detection-engine.ts` | Engine | Detect individual pieces along seam lines using OpenCV contours |
| `src/components/photo-pattern/PhotoPatternModal.tsx` | Component | Full-screen modal shell with step navigation |
| `src/components/photo-pattern/steps/UploadStep.tsx` | Component | Drag & drop image upload |
| `src/components/photo-pattern/steps/CorrectionStep.tsx` | Component | Perspective handles, crop, rotate, auto-correct |
| `src/components/photo-pattern/steps/ProcessingStep.tsx` | Component | Pipeline progress animation |
| `src/components/photo-pattern/steps/ResultsStep.tsx` | Component | Photo with seam overlays, sensitivity slider |
| `src/components/photo-pattern/steps/DimensionsStep.tsx` | Component | Quilt size input with presets |
| `src/hooks/usePhotoPatternImport.ts` | Hook | Studio-side hook — loads pieces onto Fabric.js canvas when project has photo-pattern data |
| `src/stores/photoPatternStore.ts` | Store | Zustand store for flow state |
| `tests/unit/lib/perspective-engine.test.ts` | Test | Perspective math tests |
| `tests/unit/lib/piece-detection-engine.test.ts` | Test | Piece detection tests |
| `tests/unit/lib/photo-pattern-engine.test.ts` | Test | Orchestrator tests |

### Modified Files

| File | Change |
|------|--------|
| `src/app/dashboard/page.tsx` | "Photo to Pattern" card opens `PhotoPatternModal` |
| `next.config.ts` | Webpack fallbacks for OpenCV.js |
| `package.json` | Add `@techstark/opencv-js` dependency |

### Relationship to Existing Code

- **Replaces:** `QuiltPhotoImportWizard.tsx` (the existing 7-step wizard) — can be removed once this ships.
- **Reuses:** `measurement.ts` (`computeCutDimension`, `roundToEighth`, `computeScaleFactor`), `color-math.ts` (LAB color space), `wizard-engine.ts` (step navigation logic).
- **Supersedes:** Custom Sobel/Hough/HOG in `src/lib/ocr/` — OpenCV.js handles edge detection, line detection, and contour finding. The existing sub-modules stay as fallback but the primary path uses OpenCV.
- **Pattern:** Follows the existing engine + hook + component architecture (pure engine, zero DOM deps, testable in Vitest node env for math — OpenCV functions mocked in unit tests).

---

## 3. Step-by-Step Flow

### Step 1: Upload

- Full-screen modal (80vh height, max-width 1000px, centered)
- Drag & drop zone with "or click to browse" text
- Accepts: `.jpg`, `.jpeg`, `.png`, `.webp` — max 20MB
- Shows image preview immediately on upload
- "Continue" button at bottom right
- OpenCV.js starts loading in the background when modal opens (not when user uploads)

### Step 2: Correction & Crop

- Canvas showing the uploaded image at maximum fit
- **Auto-correct button** (top toolbar): runs perspective detection pipeline:
  1. `cv.cvtColor` → grayscale
  2. `cv.GaussianBlur` → noise reduction
  3. `cv.Canny` → edge detection
  4. `cv.findContours` → find largest quadrilateral contour
  5. `cv.approxPolyDP` → simplify to 4 corners
  6. `cv.getPerspectiveTransform` + `cv.warpPerspective` → flatten
  7. If no 4-corner contour found, show toast "Couldn't auto-detect edges — drag the corners manually"
- **4 draggable corner handles** (always visible): user can manually position the perspective crop corners. Initialized to image corners, or to auto-detected corners if auto-correct succeeded.
- **Rotate buttons**: 90 CW, 90 CCW, flip horizontal
- **Crop handles**: drag edges to trim
- Live preview updates as user adjusts
- "Render Pattern" button (primary action, bottom right)

### Step 3: Processing

- Non-interactive screen with progress animation
- Pipeline steps shown as a vertical stepper:
  1. "Preprocessing image..." (grayscale, blur, enhance)
  2. "Detecting grid structure..." (adaptive threshold + probabilistic Hough)
  3. "Finding seam lines..." (contour detection along grid intersections)
  4. "Identifying pieces..." (segment individual patches)
  5. "Extracting colors..." (dominant color per piece)
  6. "Finalizing..." (build output data structure)
- Each step shows a checkmark when done, spinner when running
- Total time estimate: 2-8 seconds depending on image resolution
- Auto-advances to results when complete

### Step 4: Results

- Shows the corrected photo with **thin colored outlines on every detected seam/stitch line**
  - Outline color: semi-transparent cyan (`#00E5FF` at 70% opacity) — high contrast against fabric
  - Line width: 2px, rendered as SVG overlay on top of the photo
- **Sensitivity slider** (bottom toolbar): range 0.2 to 2.0, default 1.0
  - Adjusts `cannyThreshold1`, `cannyThreshold2`, and `houghThreshold` proportionally
  - Lower = more lines detected (for quilts with similar-colored adjacent pieces)
  - Higher = fewer lines (for quilts with high contrast)
  - **Re-scan happens automatically** when slider value changes (debounced 300ms)
  - Processing overlay shows briefly during re-scan
- **Piece count** displayed: "42 pieces detected"
- "Add to Project" button (primary action, bottom right)
- "Re-scan" manual button as alternative to slider

### Step 5: Dimensions

- Clean form asking for target quilt size
- **Preset buttons** for common sizes:
  - Baby: 36" x 52"
  - Throw: 50" x 65"
  - Twin: 68" x 90"
  - Full/Double: 81" x 96"
  - Queen: 90" x 108"
  - King: 108" x 108"
- **Custom inputs**: width and height in inches, with lock aspect ratio toggle
- Preview showing the detected grid scaled to the chosen dimensions
- **Seam allowance selector**: 1/4" (standard, default) or 3/8" (alternate)
- "Calculate Pieces" button (primary action)

### Step 6: Grid Overlay (Final — routes to studio)

This step always creates a **new project** (v1 scope — adding to existing projects is a future enhancement). It navigates to the studio, which opens with:

- The original quilt photo loaded as a **background reference image** on the canvas
- All detected pieces rendered as **outlined shapes** (SVG paths) on the grid, positioned to match
- **Opacity slider** (in a floating toolbar): controls the background photo opacity from 0% to 100%, default 40%
  - At 0%: only the outlined pieces visible (clean pattern view)
  - At 100%: photo fully visible with pieces overlaid
- Each piece has:
  - Exact dimensions in quilter-friendly fractions (nearest 1/8")
  - Seam allowance included in cut size
  - Color extracted from the photo mapped to the piece
- The project is saved with all piece data, so the user can close and return

**Measurement Rounding Rules:**

| Context | Rounding |
|---------|----------|
| Finished piece size | Nearest 1/8" (`Math.round(value * 8) / 8`) |
| Cut size (with seam allowance) | Round UP to nearest 1/8" (`Math.ceil(value * 8) / 8`) |
| Total quilt dimensions | Nearest 1/4" (`Math.round(value * 4) / 4`) |
| Seam allowance | Exact (1/4" or 3/8", no rounding) |

These match the existing `roundToEighth()` and `roundToQuarter()` functions in `measurement.ts`.

---

## 4. Perspective Engine

`src/lib/perspective-engine.ts` — pure functions, depends only on OpenCV.js types.

### `autoDetectQuiltBoundary(cv, imageMat)`

1. Convert to grayscale
2. Apply Gaussian blur (5x5 kernel)
3. Canny edge detection (threshold1: 50, threshold2: 150)
4. Find contours (`RETR_EXTERNAL`, `CHAIN_APPROX_SIMPLE`)
5. Sort by area descending, take largest
6. Approximate to polygon (`approxPolyDP`, epsilon = 2% of arc length)
7. If result has 4 vertices → return corners sorted clockwise (TL, TR, BR, BL)
8. If not → return `null` (auto-detect failed, user must place corners manually)

### `computePerspectiveTransform(cv, srcCorners, destWidth, destHeight)`

- Build source and destination point matrices
- Call `cv.getPerspectiveTransform`
- Return the 3x3 transformation matrix

### `applyPerspectiveCorrection(cv, imageMat, transformMatrix, width, height)`

- Call `cv.warpPerspective` with `INTER_LINEAR` interpolation
- Return the corrected `cv.Mat`

All `cv.Mat` objects created inside these functions are deleted before return (except the output mat, which the caller owns).

---

## 5. Piece Detection Engine

`src/lib/piece-detection-engine.ts` — the core pattern extraction.

### `detectPieces(cv, correctedImage, sensitivity)`

**Input:** Perspective-corrected image mat, sensitivity multiplier (0.2–2.0)

**Pipeline:**

1. **Grayscale + blur** — `cvtColor` + `GaussianBlur(7,7)`
2. **Adaptive threshold** — `cv.adaptiveThreshold(gray, binary, 255, ADAPTIVE_THRESH_GAUSSIAN_C, THRESH_BINARY_INV, blockSize, C)` where `blockSize` and `C` are scaled by sensitivity
3. **Morphological close** — `cv.morphologyEx(binary, closed, MORPH_CLOSE, kernel3x3)` to connect broken seam lines
4. **Canny edge detection** — thresholds scaled by sensitivity: `threshold1 = 30 / sensitivity`, `threshold2 = 90 / sensitivity`
5. **Probabilistic Hough lines** — `cv.HoughLinesP(edges, lines, 1, PI/180, threshold, minLineLength, maxLineGap)` where threshold scales with sensitivity
6. **Find contours** — `cv.findContours` on the thresholded image
7. **Filter contours** — remove too-small (noise) and too-large (entire image) contours. Min area: 0.5% of image area. Max area: 25% of image area.
8. **Approximate contours to polygons** — `cv.approxPolyDP` for clean piece outlines
9. **Extract piece data** — for each valid contour: bounding rect, centroid, area, vertex list, dominant color (sample center pixels)

**Output:** `DetectedPiece[]`

```typescript
interface DetectedPiece {
  readonly id: string;                    // uuid
  readonly contour: readonly Point2D[];   // polygon vertices (px)
  readonly boundingRect: Rect;            // bounding box (px)
  readonly centroid: Point2D;             // center point (px)
  readonly areaPx: number;               // area in pixels
  readonly dominantColor: string;         // hex color
}
```

### `scalePiecesToDimensions(pieces, imageWidth, imageHeight, targetWidthInches, targetHeightInches, seamAllowanceInches)`

Takes detected pieces in pixel coordinates and scales to real-world quilter-friendly dimensions:

1. Compute scale factors: `scaleX = targetWidthInches / imageWidth`, `scaleY = targetHeightInches / imageHeight`
2. For each piece:
   - Scale all vertices by (scaleX, scaleY)
   - Compute finished width/height from bounding rect, round to nearest 1/8"
   - Compute cut dimensions: `finishedSize + 2 * seamAllowance`, round UP to nearest 1/8"
3. Return `ScaledPiece[]` with both finished and cut dimensions as fractional strings (e.g., "3 1/2\"", "4 7/8\"")

```typescript
interface ScaledPiece {
  readonly id: string;                       // matches DetectedPiece.id
  readonly contourInches: readonly Point2D[]; // vertices in inches
  readonly finishedWidth: string;            // e.g., "3 1/2"
  readonly finishedHeight: string;           // e.g., "4 7/8"
  readonly cutWidth: string;                 // finished + 2 * seam allowance, rounded up
  readonly cutHeight: string;
  readonly finishedWidthNum: number;         // numeric for canvas positioning
  readonly finishedHeightNum: number;
  readonly dominantColor: string;            // hex, carried from DetectedPiece
}
```

---

## 6. Zustand Store

`src/stores/photoPatternStore.ts`

```typescript
interface PhotoPatternState {
  // Flow state
  step: 'upload' | 'correction' | 'processing' | 'results' | 'dimensions' | 'complete';
  isModalOpen: boolean;

  // Image data
  originalImage: HTMLImageElement | null;
  correctedImageData: ImageData | null;
  perspectiveCorners: [Point2D, Point2D, Point2D, Point2D] | null;

  // Detection results
  detectedPieces: DetectedPiece[];
  sensitivity: number; // 0.2–2.0, default 1.0

  // Dimensions
  targetWidth: number;  // inches
  targetHeight: number; // inches
  seamAllowance: 0.25 | 0.375;
  lockAspectRatio: boolean;

  // Scaled output
  scaledPieces: ScaledPiece[];

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setStep: (step: PhotoPatternState['step']) => void;
  setOriginalImage: (img: HTMLImageElement) => void;
  setCorrectedImage: (data: ImageData) => void;
  setPerspectiveCorners: (corners: [Point2D, Point2D, Point2D, Point2D]) => void;
  setDetectedPieces: (pieces: DetectedPiece[]) => void;
  setSensitivity: (value: number) => void;
  setTargetDimensions: (width: number, height: number) => void;
  setSeamAllowance: (value: 0.25 | 0.375) => void;
  setScaledPieces: (pieces: ScaledPiece[]) => void;
  reset: () => void;
}
```

---

## 7. Studio Integration

When the user clicks "Add to Project" on the dimensions step:

1. Create a new project via `POST /api/projects` with name "Photo Import — [date]"
2. Navigate to `/studio/[projectId]`
3. On studio mount, detect the `photoPatternStore` has `scaledPieces` data
4. Load the corrected image as a background reference on the Fabric.js canvas (locked, not selectable)
5. Create Fabric.js polygon objects for each scaled piece, positioned on the grid
6. Set canvas dimensions to the target quilt size
7. Apply the reference image opacity (default 40%)
8. Store reference to the photo pattern data in the project metadata for persistence

The **opacity slider** is added to the studio toolbar (only visible when a reference image is active). It controls `canvas.backgroundImage.opacity`.

---

## 8. Error Handling

| Scenario | Behavior |
|----------|----------|
| OpenCV.js fails to load | Show error with retry button, fallback text: "Computer vision engine couldn't load. Check your connection." |
| Auto-detect finds no quilt boundary | Toast: "Couldn't auto-detect edges — drag the corners manually." Corners default to image edges. |
| No pieces detected | Show message: "No pieces detected. Try lowering the sensitivity slider." Prevent advancing. |
| Image too large (>20MB) | Reject at upload with message. |
| Image too small (<200px either dimension) | Warning: "Image may be too small for accurate detection." Allow proceeding. |
| Pipeline crashes | Catch at orchestrator level, show "Something went wrong. Try a different photo or adjust sensitivity." with retry. |
| WASM out of memory | Detect via try/catch on OpenCV calls, suggest reducing image resolution. |

---

## 9. Performance

- **Image downscaling:** Before OpenCV processing, downscale images larger than 2000px on the longest side. Perspective correction is applied at full resolution, but detection pipeline runs on the downscaled version for speed.
- **Debounced sensitivity slider:** 300ms debounce on re-scan to prevent hammering the pipeline while sliding.
- **Web Worker consideration:** The OpenCV pipeline is CPU-intensive. For v1, run on the main thread with a processing overlay. If jank is unacceptable, move to a Web Worker in v2 (OpenCV.js supports Worker contexts).
- **Memory cleanup:** Aggressive `mat.delete()` after every OpenCV operation. No leaked mats.

---

## 10. What Stays, What Goes

| Existing Module | Decision |
|----------------|----------|
| `quilt-ocr-engine.ts` | **Keep as fallback.** New `photo-pattern-engine.ts` is the primary path. |
| `ocr/image-preprocess.ts` | **Keep.** Still useful for non-OpenCV contexts and tests. |
| `ocr/grid-detection.ts` | **Superseded** by OpenCV Hough. Keep file, mark as legacy. |
| `ocr/block-segmentation.ts` | **Superseded** by OpenCV contours. Keep file, mark as legacy. |
| `ocr/block-recognition.ts` | **Keep.** HOG matching still useful for matching detected pieces against the block library. |
| `ocr/color-extraction.ts` | **Keep.** Used to extract dominant colors per piece. |
| `ocr/measurement.ts` | **Keep and reuse.** `computeCutDimension`, `roundToEighth`, `computeScaleFactor` are all needed. |
| `QuiltPhotoImportWizard.tsx` | **Remove** once Photo to Pattern ships. |
| `PhotoPatchworkDialog.tsx` | **Keep.** Different feature (photo → pixelated grid, not OCR). |
| `WizardDialog.tsx` | **Keep.** Used by other features. Not used by Photo to Pattern (modal is custom). |

---

## 11. Testing Strategy

**Unit tests (Vitest, node env):**
- `perspective-engine.test.ts` — test corner sorting, transform matrix computation with mock OpenCV
- `piece-detection-engine.test.ts` — test contour filtering logic, scaling math, rounding
- `photo-pattern-engine.test.ts` — test orchestration flow, error handling

**OpenCV mocking:** In unit tests, mock `opencv-loader.ts` to return a fake `cv` object with stub methods. The math-heavy functions (scaling, rounding, dimension calculation) are tested with real values.

**Integration tests:** Manual testing with sample quilt photos of varying complexity. Build a test fixture set of 5 representative images:
1. Flat, well-lit grid quilt (easy)
2. Angled photo of a quilt on a bed (perspective correction test)
3. Quilt with low-contrast adjacent pieces (sensitivity slider test)
4. Small blocks / complex pattern (high piece count)
5. Non-rectangular / art quilt (edge case)

---

## 12. Quilting Measurement Reference

Standard quilter measurements used throughout:

- **Seam allowance:** 1/4" is the universal standard. All quilt patterns assume 1/4" seam allowance unless noted. A "scant 1/4"" accounts for thread width and fold, but 1/4" is the default.
- **Cutting increment:** Round to nearest **1/8"** — this is the smallest marking on a standard quilting ruler. Cut dimensions round UP (never down) to ensure pieces aren't too small after seaming.
- **Finished dimensions:** Round to nearest **1/8"** (standard) or **1/4"** (for overall quilt size).
- **Common block sizes:** 3", 4", 5", 6", 8", 10", 12" (finished). All divisible by common fractions.
- **Seam math:** Cut size = finished size + (2 x seam allowance). For 1/4" SA: cut = finished + 1/2".
