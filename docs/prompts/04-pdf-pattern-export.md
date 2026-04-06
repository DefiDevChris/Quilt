# Workstream 4: PDF Pattern Export

## Goal

Build the full PDF pattern export system that generates professional quilt pattern documents matching the format of commercial patterns (like Andover Fabrics and Fat Quarter Shop PDFs). The output should be a complete, printable pattern that a quilter can follow to make the quilt.

## Context

The project is a Next.js 16 quilt design app at `/home/chrishoran/Desktop/Quilt`. Read `CLAUDE.md` for architecture. PDF generation uses `pdf-lib` (client-side). The basic pattern-pieces PDF (`src/lib/pdf-generator.ts`) already exists.

## Reference PDFs

Study these commercial quilt patterns for the target format — they're on the local machine:
- `/home/chrishoran/Downloads/blue_sky_-_stargazer.pdf` — Andover Fabrics "Stargazer Quilt" by Edyta Sitar
- `/home/chrishoran/Downloads/fqfourpatch-patternfinal.pdf` — Fat Quarter Shop "Fat Quarter Four Patch"

**What these PDFs contain:**

### Stargazer (Andover) — 4 pages:
1. **Cover** — Collection name, quilt photo, designer credit, quilt size (72"x72"), branding, fabric preview images
2. **Pattern page** — "Stargazer Quilt" title, fabric requirements table (yardage per fabric with SKU), cutting directions (how to cut each fabric — "Cut (2) squares 10"x10", cut in half diagonally"), block assembly instructions with diagrams
3. **Quilt diagram** — Full quilt layout showing all 4 blocks assembled, individual block construction diagram (4 rows of HSTs), "Block — Make 4" label
4. **Fabric swatches** — All available fabrics in the collection with SKU numbers, shown at 25% actual size

### Fat Quarter Four Patch — 5 pages:
1. **Page 1** — Quilt photo, finished size (60½"x75½"), fabric requirements (fat quarters, accent, binding, backing), cutting instructions, block assembly with step-by-step diagrams and "Make 40" / "Make 20" counts
2. **Page 2** — Quilt center assembly diagram showing all blocks arranged in rows with row pressing direction arrows, finishing instructions
3. **Pages 3-5** — Extra quilt sizes (Crib, Throw, Queen) each with their own fabric requirements, cutting lists, and quilt assembly diagrams

## Tasks

### 1. Create PDF Drawing Utilities

**`src/lib/pdf-drawing-utils.ts`** — Shared utilities for all PDF modes:

```typescript
// Branding
export async function embedLogo(pdfDoc: PDFDocument, logoPng: Uint8Array | null): Promise<PDFImage | null>
export function drawCoverBranding(page: PDFPage, logo: PDFImage | null, projectName: string, quiltSize: string): void
export function drawPageHeader(page: PDFPage, title: string, pageNum: number, totalPages: number): void
export function drawBrandedFooter(page: PDFPage, pageNum: number, totalPages: number): void

// Drawing primitives
export function drawTable(page: PDFPage, headers: string[], rows: string[][], startY: number, options?: TableOptions): number  // returns Y after table
export function drawPolyline(page: PDFPage, points: {x:number,y:number}[], options: LineOptions): void
export function drawDashedLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number, dashLength?: number): void
export function drawValidationSquare(page: PDFPage, x: number, y: number, sizeInches: number): void
export function drawGrainLine(page: PDFPage, x: number, y: number, length: number, angle: number): void
```

### 2. Create Canvas Snapshot Utility

**`src/lib/canvas-snapshot.ts`** — Extract data from the Fabric.js canvas for PDF:

```typescript
export async function captureCanvasPng(fabricCanvas: unknown): Promise<Uint8Array>
export async function extractBlocksFromCanvas(fabricCanvas: unknown): Promise<BlockSnapshot[]>

interface BlockSnapshot {
  blockName: string | null;
  svgData: string;
  pieces: PieceSnapshot[];
  position: { x: number; y: number; width: number; height: number };
}

interface PieceSnapshot {
  shapeType: string;        // 'polygon', 'rect', 'triangle'
  svgData: string;
  fill: string;
  fabricId?: string;
  dimensions: { width: number; height: number };
  vertices: { x: number; y: number }[];  // for edge dimensions
}
```

### 3. Build the Full Pattern PDF Engine

**`src/lib/project-pdf-engine.ts`** — Generates a complete pattern document:

**Page structure (following the reference PDFs):**

1. **Cover page**
   - QuiltCorgi logo + branding
   - Project name (large title)
   - Quilt finished size (e.g., "72" x 72"")
   - Canvas overview image (captured from Fabric.js)
   - Date generated

2. **Fabric requirements page**
   - Table with columns: Fabric Name | Color/SKU | Usage | Yardage
   - Calculate yardage using existing `src/lib/yardage-utils.ts`
   - Group by role: blocks, sashing, borders, binding, backing
   - Include fat quarter / WOF cutting notes where applicable

3. **Cutting directions page**
   - Organized by fabric: "From Fabric A: Cut (4) squares 8"x8"..."
   - All measurements include seam allowance (note this at top: "All measurements include ¼" seam allowance")
   - Use `src/lib/cutting-chart-generator.ts` for the data

4. **Block assembly page(s)**
   - One section per unique block type
   - Block diagram showing piece arrangement with labels (A, B, C...)
   - Step-by-step construction order
   - "Make X" count for how many of each block

5. **Quilt diagram page**
   - Full quilt layout showing all blocks in position
   - Row/column labels if applicable
   - Arrow indicators for pressing directions (nice-to-have)
   - Shows sashing, borders, binding if present

6. **Cutting templates (final pages)**
   - One template per unique piece shape
   - Black outline = cut line (solid)
   - Dashed line = sew line (seam allowance inside)
   - Per-edge dimensions labeled
   - Grain line arrow
   - Piece label (e.g., "Piece A — Cut 16")
   - Printed at exact 1:1 scale
   - 1" validation square on the first template page

### 4. Build the Cut List PDF Engine

**`src/lib/cutlist-pdf-engine.ts`** — Focused on cutting templates only:

- Key block diagram page showing all shapes labeled
- Then one page per shape with:
  - Shape outline (solid = cut line)
  - Inner dashed line (sew line / seam allowance)
  - Per-edge dimensions (using `src/lib/edge-dimension-utils.ts` — create if missing)
  - Grain line with "GRAIN" text
  - Piece label and cut count
  - 1" validation square on first page

### 5. Wire Up PdfExportDialog

Update `src/components/export/PdfExportDialog.tsx`:
- The 4-mode selector already exists in the UI
- Wire each mode to its engine:
  - `'pattern-pieces'` → existing `generatePatternPdf` (already working)
  - `'cut-list'` → new `generateCutListPdf`
  - `'print-project'` → new `generateProjectPdf`
  - `'fpp-template'` → low priority, can remain stubbed with a "Coming soon" message
- Add a `downloadPdf` utility function (create in `pdf-generator.ts` or a shared util):
  ```typescript
  export function downloadPdf(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  ```

### 6. Create Edge Dimension Utilities

**`src/lib/edge-dimension-utils.ts`** — Calculate per-edge dimensions for cutting templates:

```typescript
export function calculateEdgeDimensions(vertices: {x:number, y:number}[], unitSystem: 'imperial' | 'metric'): EdgeDimension[]

interface EdgeDimension {
  startVertex: { x: number; y: number };
  endVertex: { x: number; y: number };
  length: number;              // in inches or mm
  formattedLength: string;     // "3½"" or "89mm"
  midpoint: { x: number; y: number };
  angle: number;               // for label placement
}
```

Use `formatFraction` from `src/lib/piece-detection-shared.ts` (or create it if missing) for imperial fractional display (e.g., 3.5 → "3½").

## Architecture Notes

- All PDF engines are pure functions — they take data and return `Uint8Array` (PDF bytes). No DOM or React dependencies.
- Use `pdf-lib` for all PDF generation. It's already a dependency.
- The existing `pdf-generator.ts` has the pattern for bin-packing shapes — study it for the pdf-lib API patterns (creating pages, drawing shapes, embedding images).
- Canvas snapshot functions need to handle the Fabric.js canvas being `unknown` — cast safely.
- All cutting templates must be at exact 1:1 scale. The 1" validation square lets the user verify their printer isn't scaling.
- Follow the commercial PDF format closely — quilters are used to this layout and will find it intuitive.

## Verification

```bash
npm run type-check    # 0 errors
npm run build         # succeeds
```

Test manually:
- Open a project with blocks on canvas → Export PDF → "Print Project" mode
- Generated PDF has: cover, fabric requirements table, cutting directions, block diagrams, quilt layout diagram, cutting templates
- Cutting templates have solid cut lines and dashed sew lines with edge dimensions
- Print a cutting template page → measure the 1" validation square with a ruler → should be exactly 1"
- Test with different quilt sizes and block configurations
