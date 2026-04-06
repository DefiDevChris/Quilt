# Workstream 3: Block Builder & Block Photo Upload

## Goal

Build the Block Builder tab for drafting custom quilt blocks with grid snapping, and implement the block photo upload feature where users upload photos of finished sewn blocks as non-editable image blocks in their library.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` in the repo root for full architecture. Fabric.js 7.2 canvas (always dynamic import). Zustand state.

**Block Builder** is a tab inside the `BlockDraftingShell` modal. Currently two tabs exist: Freeform (working) and BlockBuilder (stub from workstream 1). The Block Builder should provide a structured, grid-snapped drawing experience for constructing traditional quilt blocks.

**Block Photo Upload** is a separate feature: users upload a photo of a real sewn block, and it goes into their block library as a square image that can be placed in layouts. It's not piece-editable — just a square image block.

## Current State

- `src/components/blocks/BlockDraftingShell.tsx` — main modal with tabs, Freeform tab works
- `src/components/blocks/BlockBuilderTab.tsx` — stub (needs implementation)
- `src/components/blocks/SimplePhotoBlockUpload.tsx` — exists, check its current state
- `src/stores/blockStore.ts` — block library state
- Block API at `/api/blocks` — CRUD for user blocks
- `DraftTabProps` interface defined in `BlockDraftingShell.tsx`: `draftCanvasRef`, `fillColor`, `strokeColor`, `isOpen`, `activeOverlay?`, `overlayOpacity?`, `setOverlayOpacity?`
- Block SVGs use 300x300 viewBox, grayscale palette

## Tasks

### 1. Build the BlockBuilder Tab

**`src/components/blocks/BlockBuilderTab.tsx`** — A structured block drawing tool:

**Grid System:**
- The drafting canvas is already 400x400 with a 12-unit grid (from `BlockDraftingShell`)
- BlockBuilder mode should enforce strict grid snapping — all points snap to grid intersections
- Users click grid intersections to place polygon vertices

**Drawing Tools (toolbar above the canvas):**
- **Half-Square Triangle (HST)** — Click a grid cell, it splits diagonally
- **Quarter-Square Triangle (QST)** — Click a grid cell, it splits into 4 triangles
- **Rectangle** — Click-drag to define a rectangle snapped to grid
- **Flying Geese** — Click a grid cell, creates the flying geese unit (rectangle with two corner triangles)
- **Fill tool** — Click a shape to assign the current fill color

**Behavior:**
- Each shape is a Fabric.js polygon snapped to grid points
- Shapes should not overlap — new shapes subtract from existing ones or fill empty grid areas
- The grid is the block's unit grid (e.g., a 12-unit block = 12x12 grid squares)
- Common block unit sizes: 4x4 (Four Patch), 5x5 (Five Patch), 9-unit (Nine Patch), etc.

**Block Unit Selector:**
- Dropdown or segmented control at the top: "4-unit", "5-unit", "9-unit", "12-unit", "Custom"
- Changes the grid subdivision (4x4, 5x5, 3x3 for 9-unit, etc.)

### 2. Implement Block Photo Upload

Check `src/components/blocks/SimplePhotoBlockUpload.tsx` for current state and extend it:

**User Flow:**
1. User clicks "Upload Block Photo" in the block library
2. Selects an image file (JPEG/PNG)
3. Image is cropped/resized to a square (with a crop UI or auto-center-crop)
4. User names the block
5. Image is uploaded to S3 via `/api/blocks/upload` (or existing upload endpoint)
6. Block is saved to the DB with `type: 'photo'` and the image URL
7. Block appears in the user's block library alongside custom-drawn and SVG blocks

**In the block library:**
- Photo blocks show the actual photo as thumbnail
- When dragged into a layout block cell, the photo fills the cell as a square image
- Photo blocks are not editable (no piece breakdown) — they're for visualization only
- They can be resized proportionally (square aspect ratio maintained)

**On the worktable canvas:**
- Photo block renders as a Fabric.js Image object inside the block cell
- `scaleX === scaleY` always (square, locked aspect ratio)
- Can be moved between block cells but not edited

### 3. Block Library Enhancements

Update the block library UI (`src/components/blocks/BlockLibrary.tsx`) to show:
- **System blocks** — The 35 SVG blocks from `/quilt_blocks/`
- **Custom blocks** — User-drawn blocks from the block builder
- **Photo blocks** — Uploaded block photos (show image thumbnail, labeled as "Photo Block")

Add a section separator or filter: "All | SVG Blocks | My Blocks | Photo Blocks"

### 4. Fabric Assignment in Block Builder

When a block is being constructed in the Block Builder:
- Each piece/shape in the block can have a fabric assigned
- Click a shape → opens fabric picker (same as worktable fabric picker)
- The shape's fill changes to the selected fabric color (or a tiny swatch pattern)
- Fabric assignments are saved as part of the block data

When the same block is placed on the worktable:
- It renders with its assigned fabrics
- User can also override fabric assignments from the worktable (per-instance)

## Architecture Notes

- BlockBuilder drawing logic should be in a pure engine: `src/lib/block-builder-engine.ts`
  - Grid snapping calculations
  - Shape subdivision (HST, QST, Flying Geese)
  - Overlap detection
- The hook `src/hooks/useBlockBuilder.ts` bridges the engine to Fabric.js
- Photo block upload uses the existing S3 upload infrastructure
- Block data model may need a `type` field: `'svg' | 'custom' | 'photo'` — check `src/db/schema/blocks.ts` and `src/types/block.ts`

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
```

Test manually:
- Open block builder → select "BlockBuilder" tab → grid appears
- Select HST tool → click grid cell → triangle pair appears
- Fill shapes with colors → save block → appears in library
- Upload a photo of a block → appears in library as photo block
- Drag photo block into a layout cell → renders as square image
- Photo block maintains square aspect when resized
