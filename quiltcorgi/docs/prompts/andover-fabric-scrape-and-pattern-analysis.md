# Prompt: Andover Fabrics — Scrape Fabric Images + Analyze Pattern Format

## Context

You are working on QuiltCorgi (`/home/chrishoran/Desktop/Quilt/quiltcorgi/`), a Next.js quilting design app. The project already has:
- A fabric library with ~170 seeded solids (Kona Cotton, Bella Solids, etc.) in `src/db/seed/fabricDefinitions.ts`
- A block library with 659 blocks in `src/db/seed/block-generators/`
- PDF/SVG export via `src/lib/fpp-generator.ts` and `src/lib/cutting-chart-generator.ts`
- Print/export panel in `src/components/printlist/PrintlistPanel.tsx`

## Task 1: Download Fabric Images from Andover

Go to https://andoverfabrics.com/fabric-image-downloads/ and scrape/download all available fabric collection images. These are hi-res fabric swatches that manufacturers provide for designers to use in mockups and digital quilting tools.

For each collection found:
1. Download every fabric swatch image
2. Save to `/home/chrishoran/Downloads/quilting-graphics/andover-fabrics/<collection-name>/`
3. Name files using the SKU (e.g., `1463-G.jpg`, `CS-9692-WW.jpg`)
4. Create a `manifest.json` in each collection folder with:
   ```json
   {
     "collection": "Sugarberry",
     "manufacturer": "Andover Fabrics",
     "fabrics": [
       {
         "sku": "1463-G",
         "name": "Sugarberry",
         "colorway": "G",
         "filename": "1463-G.jpg",
         "colorFamily": "Green"
       }
     ]
   }
   ```

Also check https://andoverfabrics.com/free-patterns/ and download all available free pattern PDFs to `/home/chrishoran/Downloads/quilting-graphics/andover-patterns/`.

## Task 2: Analyze Pattern Format — Learn the Industry Standard

Read these two reference patterns carefully. They represent the standard format that fabric manufacturers use for free quilt patterns:

- `/home/chrishoran/Downloads/quilting-graphics/Turn of the Century Quilt - Century Solids.pdf` (17 pages, Advanced, paper-foundation piecing)
- `/home/chrishoran/Downloads/quilting-graphics/Winter Jewels Quilt - Sugarberry by Andover Fabrics.pdf` (5 pages, Confident Beginner, stitch-and-flip)

Also read any newly downloaded patterns from Task 1 for additional reference.

### What to Extract

**Document structure** — every pattern follows this layout:
1. **Cover page**: Collection name + "ANDOVER FABRICS" header, full quilt photo, designer credit line ("Quilt designed by [Name]"), finished dimensions ("Quilt finishes 66" x 85½""), skill level (Beginner / Confident Beginner / Intermediate / Advanced)
2. **Fabric Requirements box**: Table with fabric labels, purpose (background/blocks/border/binding/backing), yardage, and SKU numbers
3. **Cutting Directions**: Organized by fabric label, then by block type ("Cutting for ONE Rose Block", "Cutting for Entire Quilt"). All measurements include ¼" seam allowances. Uses standard notation: `Cut (4) squares 2"`, `Cut (2) strips 2½" x WOF`
4. **Making the Quilt**: Numbered step-by-step assembly instructions with diagrams
5. **Finishing the Quilt**: Always includes: layer with batting + backing, baste, quilt, bind
6. **Diagrams**: Block construction diagrams with dimensions, assembly diagrams, quilt layout diagram
7. **Fabric reference page**: Grid of fabric swatches with numbered labels and SKU codes

**Terminology glossary** — note the exact phrasing used (NOT paraphrased):
- "All measurements are cut sizes and include ¼" seam allowances"
- "A fat ¼ is an 18" x 20"-22" cut"
- "WOF designates the width of fabric from selvedge to selvedge (approximately 42" wide)"
- "Read assembly directions before cutting patches"
- "Cut (N) squares/strips/rectangles [dimension]"
- "Right sides together" / "wrong side"
- "Press the seam allowance open" / "Press the corner"
- "Stitch along the drawn/marked line"
- "Cut away the excess fabric" / "Trim and press"
- "Stitch in the ditch"
- "Layer the quilt with batting and backing and baste"
- "Bind to finish the quilt"
- "x WOF for binding" (binding strips always cut WOF)
- "pieced to fit quilt top with overlap on all sides" (backing)
- "Make [N] [Block Name] Blocks"

**Measurement conventions**:
- Fractions written as: ½", ¼", ⅜", ⅝", 2½", 3½", 10½"
- Dimensions as: `2" x 8"`, `3½" x 5"`, `4½" x 78"`
- "cut lengthwise" vs "cut crosswise"
- "strips crosswise from leftovers"
- Seam allowance is ALWAYS ¼" (never stated differently)

**Diagram conventions**:
- Dashed lines = seam/fold lines
- Solid lines = cutting lines
- Diagonal lines across corners = stitch-and-flip technique
- Fabric numbers written inside pieces
- Dimensions labeled with arrows
- "Make N for each block" captions
- 1" test square on foundation-piecing templates (for printer accuracy check)

## Task 3: Create a Style Guide for QuiltCorgi Exports

Based on your analysis, write a style guide to `/home/chrishoran/Desktop/Quilt/quiltcorgi/docs/pattern-style-guide.md` that QuiltCorgi should follow when generating:

### PDF Pattern Exports
- Page layout and section ordering
- Typography hierarchy (title, section headers, body text, measurements)
- How to format the Fabric Requirements table
- How to format Cutting Directions (group by fabric, then by block)
- How to write assembly instructions (numbered steps, imperative voice, exact terminology from glossary)
- How to format the Finishing section (it's nearly identical across all patterns)
- Diagram labeling conventions

### SVG/PDF Cutting Templates
- Line styles: solid = cut line, dashed = seam line / fold line
- 1" test square for printer accuracy verification
- Grain line arrows
- Piece labeling (fabric name/number, quantity, dimensions)
- Seam allowance indication (¼" default, shown as dashed offset)
- Foundation paper piecing template format (numbered piecing order, fabric labels per section)

### Language Rules
- Always use imperial measurements (inches) with fraction notation
- Always state "All measurements include ¼" seam allowances" at top of cutting directions
- Use "Cut (N)" not "Cut N" — quantity always in parentheses
- Use "x" not "by" for dimensions: `2" x 8"` not `2" by 8"`
- Spell out technique names: "stitch-and-flip", "paper-foundation piecing"
- Skill levels: Beginner, Confident Beginner, Intermediate, Advanced
- Block names capitalized: "Rose Block", "Trellis Block", "Nine Patch"
- Always define WOF on first use
- "fat ¼" and "fat ⅛" are standard cut sizes — define them

## Important Notes

- Andover Fabrics provides these images and patterns explicitly for free download/use by quilters and designers. The fabric image download page is specifically for this purpose.
- Focus on collecting PRINT fabrics (patterns/designs), not just solids — we already have ~170 solids seeded.
- The SKU naming convention: `[4-digit number]-[colorway letter]` (e.g., 1463-G = green colorway, 1463-R = red colorway, 1463-L = light colorway). Century Solids use `CS-[number]-[colorway]`.
- Fabric swatches on the reference page are noted as "50% of actual size" — record this metadata.
- Color families to use: White, Neutral, Yellow, Orange, Red, Pink, Purple, Blue, Green, Brown, Black, Grey, Multi. These match the existing `colorFamily` values in `fabricDefinitions.ts`.
- When determining `colorFamily` for print fabrics, use the dominant background color of the swatch — not the accent/design color.

## Task 4: Seed Downloaded Fabrics Into QuiltCorgi

Once the fabric images are downloaded and manifests are created, generate a seed file that integrates them into the existing fabric library.

### Database Schema (for reference)

The `fabrics` table (`src/db/schema/fabrics.ts`) has:
- `id` — UUID, auto-generated
- `userId` — `null` for system-provided default fabrics
- `name` — fabric display name (e.g., "Sugarberry — Green Floral")
- `imageUrl` — full URL to the fabric swatch image (S3/CloudFront)
- `thumbnailUrl` — optional smaller version
- `manufacturer` — "Andover Fabrics"
- `sku` — e.g., "1463-G"
- `collection` — e.g., "Sugarberry"
- `colorFamily` — e.g., "Green"
- `scaleX`, `scaleY`, `rotation` — defaults (1.0, 1.0, 0.0)
- `ppi`, `calibrated` — leave as defaults (null, false)
- `isDefault` — `true` for system-provided fabrics

### Seed File Structure

Create `src/db/seed/andoverFabricDefinitions.ts` following the same pattern as `fabricDefinitions.ts`:

```typescript
import { FabricDefinition } from './fabricDefinitions';

export function generateAndoverPrintFabrics(): FabricDefinition[] {
  return [
    {
      name: 'Sugarberry — Green Floral',
      manufacturer: 'Andover Fabrics',
      sku: '1463-G',
      collection: 'Sugarberry',
      colorFamily: 'Green',
    },
    // ... all downloaded fabrics
  ];
}
```

### Naming Convention for Print Fabrics

Format: `{Collection} — {Descriptive Color/Pattern Name}`

Examples:
- "Sugarberry — Green Floral"
- "Sugarberry — Pink Berries"
- "Century Solids — Warm White" (solids keep the simple format)

Keep names concise but distinguishable within a collection. A quilter browsing the library should be able to tell fabrics apart by name alone.

### Image Hosting

The swatch images need to be uploaded to the QuiltCorgi S3 bucket under `fabrics/andover/{collection}/{sku}.jpg`. The `imageUrl` in the seed should reference the CloudFront distribution URL:
```
https://{CLOUDFRONT_DOMAIN}/fabrics/andover/sugarberry/1463-G.jpg
```

Create a script at `scripts/upload-andover-fabrics.ts` that:
1. Reads each collection's `manifest.json` from the download directory
2. Uploads each image to S3 with the correct key
3. Outputs the final seed data with resolved CloudFront URLs

## Expected Deliverables

| # | Deliverable | Location |
|---|------------|----------|
| 1 | Downloaded fabric swatch images | `~/Downloads/quilting-graphics/andover-fabrics/<collection>/` |
| 2 | Collection manifest files | `~/Downloads/quilting-graphics/andover-fabrics/<collection>/manifest.json` |
| 3 | Downloaded free pattern PDFs | `~/Downloads/quilting-graphics/andover-patterns/` |
| 4 | Pattern style guide | `quiltcorgi/docs/pattern-style-guide.md` |
| 5 | Andover fabric seed definitions | `quiltcorgi/src/db/seed/andoverFabricDefinitions.ts` |
| 6 | S3 upload script | `quiltcorgi/scripts/upload-andover-fabrics.ts` |

## Running This Prompt

This prompt is designed to be run in a Claude Code session with `agent-browser` available for web scraping. The recommended approach:

1. **Task 1** — Use `agent-browser` to navigate the Andover site, discover collections, and download images. Fall back to `curl`/`wget` for bulk downloads if direct links are extractable.
2. **Task 2** — Use the `Read` tool on the reference PDFs. Claude can read PDFs natively.
3. **Task 3** — Write the style guide based on the analysis. This is a pure writing task.
4. **Task 4** — Generate the seed file from the manifests. This is a code generation task.

Tasks 2 and 3 can run in parallel with Task 1. Task 4 depends on Task 1 completing first.
