# Workstream 5: Photo-to-Design Pipeline

## Goal

Complete the Photo-to-Design feature: upload a photo of a quilt, extract individual pieces via OpenCV, and place them on the worktable as independent Fabric.js objects that the user can work with like any other design.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` for full architecture. The OpenCV web worker and 7-step wizard UI already exist.

**Feature rename**: This feature was called "Photo-to-Layout" and "Photo-to-Pattern" in various places. The correct name going forward is **"Photo-to-Design"**. Update all references.

## Current State

**Working:**
- `src/lib/piece-detection.worker.ts` — OpenCV.js web worker with 15-objective CV pipeline
- `src/lib/piece-detection-shared.ts` — Shared types and utilities
- `src/lib/piece-detection-utils.ts` — Detection helper functions
- `src/components/photo-layout/` — 7-step wizard UI components:
  - `PhotoToLayoutPromo.tsx` — Entry point promo/modal
  - `steps/UploadStep.tsx` — Photo upload
  - `steps/ImagePrepStep.tsx` — Rotation/flip adjustment
  - Various other step components in the directory
- `src/lib/photo-layout-utils.ts` — Utility functions for the pipeline
- `src/hooks/usePhotoLayoutImport.ts` — Hook for importing results to canvas

**Not yet built (planned engines):**
- `src/lib/grid-detection-engine.ts` — Detect block repeat grid from piece centroids
- `src/lib/sashing-detection-engine.ts` — Detect sashing strips and cornerstones
- `src/lib/border-detection-engine.ts` — Detect border layers
- `src/lib/structure-detection-engine.ts` — Orchestrator that assigns piece roles

## How Photo-to-Design Should Work

1. **Upload** — User selects a photo of a quilt
2. **Prep** — Adjust rotation, flip, brightness/contrast
3. **Perspective correction** — Drag corners to straighten the quilt
4. **CV Processing** — OpenCV extracts contours → individual piece shapes
5. **Structure detection** — Algorithms identify which pieces form blocks, which are sashing/borders
6. **Review** — User sees extracted pieces overlaid on the photo, can adjust sensitivity
7. **Import** — Pieces are placed on the worktable as individual Fabric.js polygon objects

**After import, the pieces are regular canvas objects.** Users can:
- Group pieces into blocks
- Assign fabrics to individual pieces
- Move, resize, rotate pieces
- Add them to the printlist for PDF export
- Modify the layout
- Everything the regular design studio supports

## Tasks

### 1. Rename "Photo-to-Layout" → "Photo-to-Design"

Search the entire codebase for "Photo-to-Layout", "photo-to-layout", "PhotoToLayout", "photo_to_layout" and rename to "Photo-to-Design" / "photo-to-design" / "PhotoToDesign" etc.

Key files to update:
- `src/components/photo-layout/PhotoToLayoutPromo.tsx` → rename component and file
- All wizard step components — update any user-facing text
- `src/hooks/usePhotoLayoutImport.ts` — keep filename but update internal naming
- CLAUDE.md already uses the new name

### 2. Build Grid Detection Engine

**`src/lib/grid-detection-engine.ts`** — Pure function, no DOM deps:

```typescript
interface GridDetectionResult {
  rows: number;
  cols: number;
  blockWidth: number;           // average block width in pixels
  blockHeight: number;
  gridOrigin: { x: number; y: number };
  blockCentroids: { row: number; col: number; x: number; y: number }[];
  confidence: number;           // 0-1
}

export function detectBlockGrid(
  pieces: DetectedPiece[],
  imageWidth: number,
  imageHeight: number
): GridDetectionResult | null
```

**Algorithm approach:**
- Cluster piece centroids into rows (by Y) and columns (by X) using histogram binning or k-means
- Find the most consistent grid spacing
- Validate that the grid accounts for most pieces
- Return null if no clear grid pattern (e.g., art quilts, crazy quilts)

### 3. Build Sashing Detection Engine

**`src/lib/sashing-detection-engine.ts`** — Detect strips between blocks:

```typescript
interface SashingDetectionResult {
  hasSashing: boolean;
  sashingWidth: number;          // pixels
  orientation: 'horizontal' | 'vertical' | 'both';
  hasCornerstones: boolean;
  cornerstoneSize: number;       // pixels
  sashingPieces: string[];       // piece IDs classified as sashing
  cornerstonePieces: string[];   // piece IDs classified as cornerstones
}

export function detectSashing(
  pieces: DetectedPiece[],
  grid: GridDetectionResult
): SashingDetectionResult
```

**Algorithm approach:**
- Look for elongated rectangular pieces between grid cells
- Sashing pieces have high aspect ratio and align with grid gaps
- Cornerstones are small squares at sashing intersections

### 4. Build Border Detection Engine

**`src/lib/border-detection-engine.ts`** — Detect border layers:

```typescript
interface BorderDetectionResult {
  borders: BorderLayer[];
  bindingDetected: boolean;
  bindingWidth: number;
}

interface BorderLayer {
  index: number;                 // 0 = outermost
  width: number;                 // pixels
  pieces: string[];              // piece IDs in this border
}

export function detectBorders(
  pieces: DetectedPiece[],
  imageWidth: number,
  imageHeight: number,
  grid: GridDetectionResult | null
): BorderDetectionResult
```

**Algorithm approach:**
- Find pieces along the image edges that don't belong to the block grid
- Group edge pieces into border layers by distance from edge
- Innermost layer closest to the block grid, outermost closest to image edge

### 5. Build Structure Detection Orchestrator

**`src/lib/structure-detection-engine.ts`** — Combines all detectors:

```typescript
interface QuiltStructure {
  grid: GridDetectionResult | null;
  sashing: SashingDetectionResult;
  borders: BorderDetectionResult;
  pieceRoles: Map<string, PieceRole>;  // piece ID → role
}

type PieceRole = 'block' | 'sashing' | 'cornerstone' | 'border' | 'binding' | 'setting-triangle' | 'unknown';

export function detectQuiltStructure(
  pieces: DetectedPiece[],
  imageWidth: number,
  imageHeight: number
): QuiltStructure
```

This orchestrator calls grid → sashing → border detection in sequence, then assigns a role to every piece.

### 6. Wire Detection into the Wizard

Update the wizard's processing step to call `detectQuiltStructure` after OpenCV piece extraction:

- After CV pipeline extracts raw pieces, run structure detection
- In the review step, color-code pieces by role (blocks = blue, sashing = green, borders = orange, etc.)
- Let users override piece roles by clicking (dropdown: block/sashing/border/unknown)
- Show the detected grid overlay on the preview image

### 7. Import to Worktable

Update `src/hooks/usePhotoLayoutImport.ts`:

- When importing, create Fabric.js objects for each piece
- Tag each object with its role via custom property: `(obj as any).__pieceRole = 'block'`
- Group pieces that share a grid cell into a Fabric.js Group (the "block")
- Position pieces according to the detected grid layout
- Apply a generic grayscale palette to pieces (user assigns real fabrics later)

## Architecture Notes

- All detection engines must be pure functions — no DOM, React, or Fabric.js imports
- They operate on arrays of `DetectedPiece` (centroids, contours, bounding boxes)
- The structure detection is optional — if it fails or returns low confidence, pieces are just placed as ungrouped objects (role = 'unknown')
- The feature should degrade gracefully: even without structure detection, the basic "extract pieces from photo" flow should work

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
```

Test with real quilt photos:
- Simple grid quilt (3x3 nine patch) → should detect grid, blocks, no sashing
- Quilt with sashing → should detect sashing strips and cornerstones
- Quilt with borders → should detect border layers
- Art quilt / irregular → should gracefully return pieces with 'unknown' role
- Import to canvas → pieces are positioned, grouped by block, role-tagged
