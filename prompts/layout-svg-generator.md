# Quilt Layout SVG Generator

You are creating 20 SVG layout templates for a quilt design application. Each SVG shows the STRUCTURE of a quilt layout — where blocks, sashing strips, borders, cornerstones, and setting triangles are placed. These are NOT finished quilts — they are structural diagrams showing empty slots where quilt blocks will later be inserted.

Each layout must be based on a **real, traditional quilting pattern**. Research the actual construction before drawing. Do NOT invent random arrangements.

**Create each SVG ONE AT A TIME.** Complete one, verify it, then move to the next. Do not batch them.

---

## Quilting Terminology

These terms have precise meanings. Use them exactly:

- **Block**: A square unit (typically 6"–12") that is the primary design element. In the SVG, blocks are empty placeholder slots shown as rectangles.
- **Sashing**: Narrow fabric strips between blocks that frame and separate them. Typically 1"–3" wide. Runs horizontally between rows and vertically between columns.
- **Cornerstones** (sashing squares): Small squares where horizontal and vertical sashing strips intersect. Often a contrasting color.
- **Border**: Fabric strips surrounding the entire quilt perimeter. A quilt can have 0–5 concentric borders. Drawn as 4 strips (top, bottom, left, right) per border layer.
- **Setting triangles**: Triangles that fill the jagged edges of an on-point layout to create straight rectangular edges.
  - **Side setting triangles (HST)**: Half-square triangles along the 4 edges.
  - **Corner setting triangles (QST)**: Quarter-square triangles at the 4 corners.
- **On-point (diagonal set)**: Blocks rotated 45° so they appear as diamonds. The quilt edges are filled with setting triangles.
- **Medallion**: A large center block surrounded by concentric border frames. The oldest quilt layout style.
- **Barn Raising**: Log Cabin blocks arranged so their light/dark halves form concentric diamond rings radiating from center.
- **Irish Chain**: Alternating pieced blocks and plain blocks that create diagonal chain lines across the quilt surface.
- **Flying Geese**: Rectangular units (2:1 ratio) made of one large triangle and two small triangles.
- **Bargello**: Vertical strip columns offset up/down to create a wave or flame illusion.
- **Courthouse Steps**: A Log Cabin variation where strips are added symmetrically to opposite sides (top+bottom, then left+right) rather than spiraling.
- **Brick set**: Rectangular blocks arranged like bricks in a wall — each row offset by half a block width.

---

## SVG Format Specification

Every SVG must follow these rules exactly:

### File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <!-- Background -->
  <rect x="0" y="0" width="{W}" height="{H}" fill="#FAFAF8" stroke="#383831" stroke-width="1.5"/>

  <!-- Borders (outermost layer first, working inward) -->
  <g data-role="borders">
    <!-- 4 rects per border layer: top, bottom, left, right -->
  </g>

  <!-- Setting triangles (on-point layouts only) -->
  <g data-role="setting-triangles">
    <!-- <polygon> elements -->
  </g>

  <!-- Sashing strips and cornerstones -->
  <g data-role="sashing">
    <!-- Horizontal strips, vertical strips, cornerstone squares -->
  </g>

  <!-- Block slots (the main content area) -->
  <g data-role="blocks">
    <!-- <rect> for square/rectangular blocks -->
    <!-- <polygon> for triangular units like flying geese -->
  </g>
</svg>
```

### Dimensions

- Use integer coordinates. No decimals except for stroke-width.
- ViewBox must match width/height attributes exactly.
- Scale so the SVG is readable at 300–600px on screen. Typical viewBox sizes:
  - Small layouts (2×2): `viewBox="0 0 240 240"`
  - Medium layouts (4×4, 5×5): `viewBox="0 0 400 400"`
  - Large layouts (6×6, 7×7): `viewBox="0 0 480 480"`
  - Rectangular layouts: adjust height proportionally (e.g., `viewBox="0 0 400 480"` for 4 cols × 5 rows)

### Color Palette

Use ONLY these colors. They match the application's design system:

| Element | Fill | Stroke | Stroke Width |
|---------|------|--------|-------------|
| Background | `#FAFAF8` | `#383831` | `1.5` |
| Block slot (standard) | `#E8E4DD` | `#C5C0B8` | `0.5` |
| Block slot (alternate — plain/solid blocks in Irish Chain etc.) | `#F5F0E8` | `#C5C0B8` | `0.5` |
| Block slot (accent — medallion center, feature block) | `#FFCBA4` | `#C5C0B8` | `0.5` |
| Sashing strip | `#F5F0E8` | none | none |
| Cornerstone square | `#E0DBD2` | none | none |
| Border (dark — typical outer border) | `#2D2D2D` | none | none |
| Border (medium — inner borders) | `#383831` | none | none |
| Setting triangle (side/HST) | `#FAF8F5` | `#C5C0B8` | `0.5` |
| Setting triangle (corner/QST) | `#F5F0E8` | `#C5C0B8` | `0.5` |

For layouts with **color zones** (barn-raising, diagonal-set, bargello), use this 5-step gradient:

| Zone | Name | Fill |
|------|------|------|
| 0 | Light | `#F5F0E8` |
| 1 | Medium-light | `#E8E4DD` |
| 2 | Medium | `#D4CFC6` |
| 3 | Medium-dark | `#B8B2A8` |
| 4 | Dark | `#8B8580` |

### Element Rules

- **Blocks**: Always `<rect>` elements. Add `data-role="block"` and `data-cell="{row},{col}"` attributes.
- **Sashing**: `<rect>` elements with `data-role="sashing"`.
- **Cornerstones**: `<rect>` elements with `data-role="cornerstone"`.
- **Borders**: `<rect>` elements with `data-role="border"` and `data-border-index="{0|1|2}"` and `data-side="{top|bottom|left|right}"`.
- **Setting triangles**: `<polygon>` elements with `data-role="setting-triangle"` and `data-triangle-type="{side|corner}"`.
- **Flying geese / triangular units**: `<polygon>` elements with `data-role="block"`.
- **No text, no labels, no annotations** inside the SVG.
- **No rounded corners** on blocks or sashing (these are fabric pieces, not UI elements). Only the outer background rect may have `rx`.

### Coordinate Math

**You must calculate coordinates precisely. Here are the formulas:**

**Grid layout** (no sashing):
- Block at row `r`, col `c`: `x = c * blockSize`, `y = r * blockSize`
- Total: `width = cols * blockSize`, `height = rows * blockSize`

**Sashing layout**:
- Cell stride = `blockSize + sashingWidth`
- Block at row `r`, col `c`: `x = c * stride`, `y = r * stride`
- Vertical sashing strip between col `c` and `c+1`: `x = (c+1) * stride - sashingWidth`, `y = 0`, `width = sashingWidth`, `height = rows * stride - sashingWidth`
- Horizontal sashing strip between row `r` and `r+1`: `x = 0`, `y = (r+1) * stride - sashingWidth`, `width = cols * stride - sashingWidth`, `height = sashingWidth`
- Cornerstone at intersection of row-gap `r` and col-gap `c`: `x = (c+1) * stride - sashingWidth`, `y = (r+1) * stride - sashingWidth`, size = `sashingWidth × sashingWidth`
- Total inner: `width = cols * blockSize + (cols-1) * sashingWidth`, `height = rows * blockSize + (rows-1) * sashingWidth`

**On-point layout**:
- Diagonal span of a rotated block = `blockSize × √2` (use 1.414)
- halfDiag = `diagonal / 2`
- Block center at row `r`, col `c`: `cx = c * diagonal + halfDiag`, `cy = r * diagonal + halfDiag`
- Each block is drawn as a rotated square (diamond): use `<rect>` with `transform="rotate(45, cx, cy)"` where cx/cy is the center, OR draw as a `<polygon>` with 4 points: top, right, bottom, left of the diamond.
- Side setting triangles: fill the V-shaped gaps along each edge between adjacent diamonds.
- Corner setting triangles: fill the triangular gap at each of the 4 corners.
- Total: `width = cols * diagonal`, `height = rows * diagonal`

**Borders** (wrap around the inner layout):
- For border index `i` with width `bw`, accumulated offset = sum of all previous border widths:
  - Top: `x = -offset`, `y = -offset - bw`, `width = innerWidth + 2*offset`, `height = bw`
  - Bottom: `x = -offset`, `y = innerHeight + offset`, same width/height
  - Left: `x = -offset - bw`, `y = -offset - bw`, `width = bw`, `height = innerHeight + 2*offset + 2*bw`
  - Right: `x = innerWidth + offset`, same y/width/height as left
- When borders exist, shift the entire inner content so coordinates start at (totalBorderWidth, totalBorderWidth) instead of (0,0). Adjust viewBox accordingly.

---

## The 20 Layouts

### Group 1: Grid Layouts (no sashing, no borders)

**Layout 1 — `grid-2x2.svg`**
- 2 rows × 2 columns = 4 blocks
- Block size: 100px in SVG. ViewBox: `0 0 200 200`
- The simplest possible quilt layout. Just 4 square blocks touching edge to edge.

**Layout 2 — `grid-6x6.svg`**
- 6 rows × 6 columns = 36 blocks
- Block size: 70px. ViewBox: `0 0 420 420`
- A large working grid. Common for sampler quilts where every block is different.

**Layout 3 — `grid-7x7.svg`**
- 7 rows × 7 columns = 49 blocks
- Block size: 60px. ViewBox: `0 0 420 420`
- Extra-large grid. Popular for charm quilts and block-of-the-month projects.

### Group 2: Sashing Layouts

**Layout 4 — `sashing-2x2.svg`**
- 2 rows × 2 columns = 4 blocks, sashing width: 14px
- Block size: 90px, stride = 104px. ViewBox: `0 0 194 194`
- 1 vertical strip, 1 horizontal strip, 1 cornerstone.

**Layout 5 — `sashing-6x6.svg`**
- 6 rows × 6 columns = 36 blocks, sashing width: 10px
- Block size: 60px, stride = 70px. ViewBox: `0 0 410 410`
- 5 vertical strips, 5 horizontal strips, 25 cornerstones.
- Verify: (6-1)=5 strips per direction, (6-1)×(6-1)=25 cornerstones.

**Layout 6 — `sashing-4x5-cornerstones.svg`**
- 5 rows × 4 columns = 20 blocks, sashing width: 14px, one 18px border
- Block size: 70px, stride = 84px. ViewBox: `0 0 298 384` (adjust for border padding)
- Rectangular layout. Wider sashing emphasizes the cornerstones.
- Add 18px border on all 4 sides. Shift inner content by 18px.
- Adjusted viewBox: `0 0 334 420`
- Border fills: `#2D2D2D`

### Group 3: On-Point Layouts

**Layout 7 — `on-point-2x2.svg`**
- 2 rows × 2 columns = 4 blocks rotated 45°
- Block side: 70px. Diagonal = 99px (70 × 1.414). halfDiag = 49px.
- ViewBox: `0 0 198 198` (2 × 99)
- 4 diamonds, side setting triangles between adjacent diamonds on each edge, corner triangles at each corner.
- Side triangles: 1 per edge-gap (top: 1, bottom: 1, left: 1, right: 1 = 4 total).
- Corner triangles: 4.
- Total triangles: 8.

**Layout 8 — `on-point-6x6.svg`**
- 6 rows × 6 columns = 36 blocks rotated 45°
- Block side: 50px. Diagonal = 71px (round to 71). halfDiag = 35px.
- ViewBox: `0 0 426 426`
- Side triangles: 5 per edge × 4 edges = 20.
- Corner triangles: 4.
- Total triangles: 24.

**Layout 9 — `on-point-4x4-border.svg`**
- 4 rows × 4 columns = 16 blocks on-point, one 20px border
- Block side: 60px. Diagonal = 85px. halfDiag = 42px.
- Inner area: 340 × 340. Border: 20px each side. ViewBox: `0 0 380 380`
- Side triangles: 3 per edge × 4 = 12. Corner triangles: 4. Total: 16.

### Group 4: Specialty Layouts

For each of these, first explain the traditional quilting pattern, then draw the SVG.

**Layout 10 — `barn-raising.svg`**
- Traditional pattern: Log Cabin blocks have a light half and dark half divided diagonally. In Barn Raising, blocks are oriented so that light halves face the center, creating concentric diamond rings of light and dark. The effect looks like light radiating outward from the center.
- 6 rows × 6 columns = 36 block slots.
- Block size: 65px. ViewBox: `0 0 390 390`
- **Color zone assignment**: Each block's zone = the minimum distance from that block to any edge of the grid (Chebyshev distance from the nearest edge). For a 6×6 grid:
  - Zone 0 (outermost ring): all blocks on the perimeter (row 0, row 5, col 0, col 5) → fill `#F5F0E8`
  - Zone 1: blocks one step in → fill `#E8E4DD`
  - Zone 2 (center ring): the 4 center blocks (rows 2-3, cols 2-3) → fill `#D4CFC6`
- Draw each block as a `<rect>` filled with its zone color. This shows the concentric diamond pattern.
- Additionally, draw a thin diagonal line (stroke `#C5C0B8`, stroke-width 0.5) from top-left to bottom-right corner of each block to indicate the Log Cabin light/dark split.

**Layout 11 — `irish-chain-single.svg`**
- Traditional pattern: Single Irish Chain alternates pieced 9-patch blocks with plain solid blocks in a checkerboard. Where the 9-patches touch diagonally, their corner squares align to form a continuous chain running diagonally across the quilt.
- 5 rows × 5 columns = 25 positions.
- Block size: 70px. ViewBox: `0 0 350 350`
- Blocks where `(row + col)` is even: standard block slots (fill `#E8E4DD`) — these are the 9-patch positions (13 blocks).
- Blocks where `(row + col)` is odd: alternate block slots (fill `#F5F0E8`) — these are the plain blocks (12 blocks).
- Use `data-cell-role="block"` for 9-patch positions, `data-cell-role="alternate"` for plain.

**Layout 12 — `irish-chain-double.svg`**
- Traditional pattern: Double Irish Chain uses two different pieced blocks that alternate. Block A has a prominent center cross pattern; Block B is mostly plain with small colored squares in the corners. Together they create a wider, bolder diagonal chain than the single version.
- 7 rows × 7 columns = 49 positions.
- Block size: 55px. ViewBox: `0 0 385 385`
- Same checkerboard rule: `(row+col) % 2 === 0` → Block A (fill `#E8E4DD`), odd → Block B (fill `#F5F0E8`).
- To distinguish from single Irish Chain, draw a small 9px × 9px accent square (fill `#FFCBA4`) centered in each Block A position, representing the center cross.
- Draw 4 small 5px × 5px accent squares (fill `#FFCBA4`) in the corners of each Block B position, representing the connecting chain squares.

**Layout 13 — `flying-geese-chevron.svg`**
- Traditional pattern: Flying Geese are rectangular units where one large triangle (the "goose") points in a direction and two small triangles (the "sky") fill the remaining space. In a chevron arrangement, columns of geese alternate between pointing left and right, creating a zigzag pattern.
- 8 rows × 6 columns of rectangular units.
- Each unit: width 60px, height 30px (2:1 ratio).
- ViewBox: `0 0 360 240`
- For each unit, draw 3 triangles:
  - Even columns (0, 2, 4): goose triangle points RIGHT. Goose = large triangle filling the right half (fill `#E8E4DD`). Two sky triangles on the left (fill `#F5F0E8`).
  - Odd columns (1, 3, 5): goose triangle points LEFT. Mirror of the above.
- Each goose triangle is a `<polygon>` with 3 points. Each sky triangle is a `<polygon>` with 3 points.
- The alternating direction creates the chevron/zigzag visual.

**Layout 14 — `medallion-center.svg`**
- Traditional pattern: Medallion quilts are the oldest quilt layout, originating in 18th-century England. A single large center block is the focal point, surrounded by concentric border frames that radiate outward. Each border can be plain fabric or pieced.
- 1 center block: 120px × 120px (accent fill `#FFCBA4`).
- Border 1 (inner): 20px wide, fill `#F5F0E8`
- Border 2 (middle): 30px wide, fill `#E8E4DD`
- Border 3 (outer): 40px wide, fill `#2D2D2D`
- Total: 120 + 2×(20+30+40) = 300. ViewBox: `0 0 300 300`
- Draw borders as 4 rects each (top, bottom, left, right), working from outermost in.

**Layout 15 — `medallion-on-point.svg`**
- Traditional pattern: A variation of the medallion where the center block is set on-point (rotated 45°), creating a diamond center. Setting triangles fill out to a square, then borders frame the whole thing.
- Center block side: 80px. Diamond diagonal: 113px (80 × 1.414).
- Setting triangles fill corners to make a ~113px × 113px inner square.
- Border 1: 25px, fill `#F5F0E8`
- Border 2: 20px, fill `#E8E4DD`
- Border 3: 35px, fill `#2D2D2D`
- Total = 113 + 2×(25+20+35) = 273. ViewBox: `0 0 273 273`
- Center diamond: `<polygon>` with 4 points (top, right, bottom, left of diamond), fill `#FFCBA4`.
- 4 corner setting triangles filling the gaps between diamond and inner square boundary.

**Layout 16 — `staggered-brick.svg`**
- Traditional pattern: Brick quilts arrange rectangular blocks like a brick wall. Each row offsets by half a block width (running bond pattern). Simple but creates strong horizontal movement. Popular for strip quilts and jelly roll projects.
- 7 rows of rectangular blocks. Block size: 80px wide × 40px tall (2:1 ratio).
- Even rows (0, 2, 4, 6): 5 full blocks starting at x=0.
- Odd rows (1, 3, 5): half-block at x=0 (40px wide), then 4 full blocks, then half-block at end.
- ViewBox: `0 0 400 280` (5 blocks wide × 7 rows tall)
- All blocks: fill `#E8E4DD`. Half-blocks at row edges: fill `#F5F0E8` (they'd be cut from a full block).

**Layout 17 — `diagonal-set.svg`**
- Traditional pattern: Diagonal set (also called "diagonal bands" or "streak of lightning") organizes blocks so that each diagonal line from top-left to bottom-right shares a color family. Creates a gradient or rainbow effect sweeping across the quilt.
- 5 rows × 5 columns = 25 blocks.
- Block size: 70px. ViewBox: `0 0 350 350`
- Color zone for block at (row, col) = `row + col`. Range: 0 to 8 (9 diagonals).
- Map zone to the 5-color gradient, wrapping or interpolating:
  - Zone 0: `#F5F0E8`, Zone 1: `#EBE7DF`, Zone 2: `#E8E4DD`, Zone 3: `#DDD9D0`, Zone 4: `#D4CFC6`, Zone 5: `#C6C1B7`, Zone 6: `#B8B2A8`, Zone 7: `#A19B91`, Zone 8: `#8B8580`
- Each block is a `<rect>` filled with its diagonal zone color.

**Layout 18 — `pinwheel-whirl.svg`**
- Traditional pattern: Pinwheel blocks contain triangles that create a spinning effect. When arranged in a 4×4 grid with coordinated rotation (each quadrant rotated differently), the individual pinwheels combine to create one large spinning motion across the entire quilt surface.
- 4 rows × 4 columns = 16 blocks.
- Block size: 80px. ViewBox: `0 0 320 320`
- All blocks: fill `#E8E4DD`.
- Inside each block, draw a rotation indicator: a small triangle (12px) in one corner showing the block's orientation:
  - Top-left quadrant (rows 0-1, cols 0-1): triangle in top-left corner (rotation 0°)
  - Top-right quadrant (rows 0-1, cols 2-3): triangle in top-right corner (rotation 90°)
  - Bottom-right quadrant (rows 2-3, cols 2-3): triangle in bottom-right corner (rotation 180°)
  - Bottom-left quadrant (rows 2-3, cols 0-1): triangle in bottom-left corner (rotation 270°)
- Indicator triangle fill: `#FFCBA4`

**Layout 19 — `bargello-wave.svg`**
- Traditional pattern: Bargello quilts are made of vertical strips of fabric sewn together then cut and re-sewn with offsets to create a wave or flame pattern. The vertical offset of each column follows a curve, and colors grade from light to dark, creating an undulating optical illusion.
- 12 columns × 8 rows of rectangular strips.
- Strip size: 36px wide × 20px tall.
- ViewBox: `0 0 432 160`
- Column vertical offsets (in units of strip height, applied as y-shift): `[0, -1, -2, -3, -3, -2, -1, 0, 1, 2, 2, 1]`
- Each column's strips shift up or down by `offset × 20px`. Strips that shift off the top reappear at the bottom (wrap around).
- Color zone per row (0=top to 7=bottom), mapped to 5-zone palette:
  - Rows 0-1: Zone 0 (`#F5F0E8`), Rows 2-3: Zone 1 (`#E8E4DD`), Rows 4-5: Zone 2 (`#D4CFC6`), Row 6: Zone 3 (`#B8B2A8`), Row 7: Zone 4 (`#8B8580`)
- After offset, each strip keeps its original row's color. This creates the wave pattern where dark and light bands undulate across the quilt.

**Layout 20 — `courthouse-steps.svg`**
- Traditional pattern: Courthouse Steps is a Log Cabin block variation. Instead of adding strips in a spiral, strips are added symmetrically — identical strips on top and bottom first, then identical strips on left and right. This creates a cross-like or bullseye symmetry (horizontal/vertical mirror) rather than the diagonal symmetry of traditional Log Cabin.
- 4 rows × 4 columns = 16 blocks.
- Block size: 80px. ViewBox: `0 0 320 320`
- Inside each block, show the Courthouse Steps internal structure with concentric rectangles:
  - Center square: 16px × 16px centered in the block, fill `#FFCBA4`
  - Ring 1 (top+bottom strips): 16px wide × 8px tall strips above and below center, fill `#E8E4DD`. Then left+right strips: 8px wide × 32px tall, fill `#F5F0E8`
  - Ring 2 (top+bottom strips): 32px wide × 8px tall, fill `#D4CFC6`. Then left+right strips: 8px wide × 48px tall, fill `#B8B2A8`
  - Ring 3 (top+bottom): 48px wide × 8px tall, fill `#D4CFC6`. Left+right: 8px wide × 64px tall, fill `#B8B2A8`
  - Outermost fills to 80px × 80px, fill `#8B8580`
- This internal detail distinguishes it from a plain grid. All 16 blocks show identical internal structure.

---

## Output Format

For each layout, output:

1. **The filename** (e.g., `grid-2x2.svg`)
2. **Quilting reference** — 1 sentence on what this pattern is in real quilting
3. **The complete SVG** — valid XML, copy-paste ready, following all format rules above
4. **Self-check** — Confirm:
   - Total block count is correct
   - Sashing strip count = `(rows-1)` horizontal + `(cols-1)` vertical sets (for sashing layouts)
   - Cornerstone count = `(rows-1) × (cols-1)` (for sashing layouts)
   - Setting triangle count correct (for on-point layouts)
   - All coordinates are integers (except stroke-width)
   - ViewBox dimensions match the calculated total size
   - Every `<rect>` and `<polygon>` has the correct `data-role` attribute

Start with Layout 1 now.
