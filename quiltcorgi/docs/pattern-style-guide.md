# QuiltCorgi Pattern Export Style Guide

This style guide defines the formatting, terminology, and conventions QuiltCorgi must follow when generating PDF pattern exports, SVG/PDF cutting templates, and foundation paper piecing templates. All rules are derived from industry-standard quilt patterns published by Andover Fabrics (specifically the _Turn of the Century Quilt_ by Jennifer Strauser and the _Winter Jewels Quilt_ by Janet Houts).

---

## 1. PDF Pattern Export -- Document Structure

Every exported pattern PDF follows this exact section order:

### Page 1: Cover Page

| Element | Format | Example |
|---------|--------|---------|
| Collection name | Large bold serif/display heading, top of page | **Century Solids** |
| Subtitle | All-caps tracking beneath collection name | ANDOVER FABRICS |
| Quilt photo | Full-color image of finished quilt, centered, with thin black border | -- |
| Backing indicator | Corner fold on bottom-right of quilt photo, labeled "BACKING" | -- |
| Designer credit | Below photo: `[Pattern Name] designed by: **[Designer Name]**` | `Turn of the Century Quilt designed by: **Jennifer Strauser**` |
| Quilt dimensions | Below credit: `Quilt Size: **60" x 60"**` | -- |
| Skill level | Same line or next: `Skill Level: **Advanced**` | -- |
| Branding footer | Company logo, address, phone, website, date | -- |

The bullet separator between dimensions and skill level is a centered dot: `Quilt Size: **66" x 85-1/2"** . Skill Level: **Confident Beginner**`

### Page 2: Pattern Overview + Cutting Directions + Fabric Requirements

This page is dense and combines multiple sections. Layout is two-column or full-width depending on content volume.

**Header**: Pattern name as bold heading (e.g., **Turn of the Century Quilt** or **Winter Jewels Quilt**).

**Intro paragraph** (italic): A 2-3 sentence description of the quilt design and techniques. Example:
> _This wall quilt is a swirling color wheel that seems to be spinning off into space. What a dynamic contemporary design this is, made with paper-foundation-piecing methods to ensure piecing success._

**Key stats** directly beneath intro:
```
Quilt finishes 66" x 85-1/2"
32 Rose Blocks: 6" x 10-1/2"
31 Trellis Blocks: 6" x 10-1/2"
```

**Fabric Requirements box**: Rendered as a boxed/shaded table with a bold header.

**Cutting Directions**: Organized by fabric label, then by block type within each fabric.

**Making the Quilt** callout: If a cross-reference to assembly is needed before cutting, include:
> **Note:** Read assembly directions before cutting patches.

### Pages 3+: Making the Quilt / Assembly Instructions

Numbered step-by-step instructions with inline diagram references. Diagrams placed in the right column or interspersed with text.

### Finishing Section

Always its own headed section, continuing the step numbering from Making the Quilt.

### Diagram Pages

Block construction diagrams, quilt assembly layout, and (for PFP patterns) full-page foundation piecing templates.

### Final Page: Fabric Reference

Grid of fabric swatches with numeric labels and SKU codes beneath each swatch. Organized by collection.

---

## 2. Fabric Requirements Table

### Format

Render as a boxed region with a bold heading: **Fabric Requirements**

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Fabric label (bold) | Purpose/role | Yardage | SKU (if applicable) |

### Examples from Reference Patterns

**Turn of the Century (simple):**
```
Fabric Requirements
                              Yardage   Fabric
Fabric A      background      8 yards   CS-9692-WW
100 Fabrics   set              5" x 5" ea.  Century Solids
Binding                       1/2 yard  CS-9692-K
Backing                       8 yards   CS-9692-WW
```

**Winter Jewels (grouped by role):**
```
Fabric Requirements                    Yardage
Fabric 14     border                   2-1/2 yards
Fabric 17     blocks                   1/2 yard
Fabric 25     border                   3-1/2 yards
7 Greens      blocks                   fat 1/4 each
              Fabrics 1, 4, 7, 12, 16, 19, 22
7 Reds        blocks                   fat 1/4 each
              Fabrics 3, 6, 9, 11, 18, 21, 24
5 Lights      blocks                   fat 1/4 each
              Fabrics 5, 8, 10, 20, 23
Binding (24)                           5/8 yard
Backing (2)                            5-1/2 yards
```

### Rules

- Yardage uses fraction notation: `1/2 yard`, `2-1/2 yards`, `fat 1/4 each`
- When a fabric serves dual purpose, note both: `Background and Backing`
- If fabrics are grouped (e.g., "7 Greens"), list the individual fabric numbers on the next line indented
- Include optional materials callout when relevant:
  > Optional: Paper for paper-foundation piecing, such as tracing or parchment paper, or paper sold for this technique

---

## 3. Cutting Directions

### Opening Disclaimer

Always begin the Cutting Directions section with this exact note (or close paraphrase):

> **Note:** Read assembly directions before cutting patches. All measurements are cut sizes and include 1/4" seam allowances. A fat 1/4 is an 18" x 20"-22" cut. Borders are cut the exact lengths required plus 1/4" seam allowances. WOF designates the width of fabric from selvedge to selvedge (approximately 42" wide).

Key phrases that must appear verbatim or near-verbatim:
- "All measurements are cut sizes and include 1/4" seam allowances"
- "WOF designates the width of fabric from selvedge to selvedge"
- "Read assembly directions before cutting patches"

### Grouping Hierarchy

Cutting directions are organized in this order:

1. **By block type** (when the pattern has distinct blocks): "Cutting for ONE Rose Block", "Cutting for ONE Trellis Block", "Cutting for Entire Quilt"
2. **By fabric label** within each group: "Fabric 17", "Fabric 25", "Green", "Red"

### Cut Instruction Format

Every cut instruction follows this grammar:

```
Cut (N) [shape] [dimension]
```

- Quantity is always in parentheses: `Cut (4)`, `Cut (2)`, `Cut (128)`
- Shape names: `squares`, `strips`, `rectangles`, `lengths`
- Dimensions use `"` symbol and `x` separator: `2"`, `3-1/2"`, `2" x 8"`, `4-1/2" x 78"`
- Purpose clause follows dimension when needed: `for Rose Block centers`, `for binding`, `for the background`

### Examples from Reference Patterns

**Per-block cutting (Winter Jewels):**
```
Cutting for ONE Rose Block
Fabric 17
Cut (4) squares 2"
Fabric 25
Cut (6) squares 2"
Cut (2) squares 3-1/2"
Green
Cut (2) rectangles 3-1/2" x 5"
Red
Cut (4) squares 3-1/2"
```

**Whole-quilt cutting (Winter Jewels):**
```
Cutting for Entire Quilt
Fabric 14
Cut (2) side borders 4-1/2" x 78", cut lengthwise
Cut (5) strips crosswise from leftovers, each 4-1/2" x 30",
    pieced to make the following:
    (2) top bottom borders 4-1/2" x 66-1/2"
Fabric 17
Cut (128) squares 2" for Rose Block centers
```

**Paper-foundation piecing cutting (Turn of the Century):**
```
Fabric A
Cut (2) lengths 30-1/2" x 60-1/2" for the background
Cut paper-foundation-piecing patches (PFP) as needed
    (Read Step 2)
Cut (1) center circle patch, 10-1/2" diameter
    (Read Step 9)
```

### Directional Cuts

- `cut lengthwise` -- parallel to selvedge
- `cut crosswise` -- perpendicular to selvedge (WOF direction)
- `from leftovers` -- from remaining fabric after lengthwise cuts

### Binding and Backing

Always listed as separate sub-sections at the end of cutting directions:

```
Binding
Cut (8) strips 2-1/2" x WOF for binding

Backing
Cut (2) lengths 38" x 96", pieced to fit quilt top
    with overlap on all sides
```

---

## 4. Making the Quilt -- Assembly Instructions

### Format

- Section heading: **Making the Quilt**
- Numbered list, continuous numbering from 1 through the entire section
- Imperative voice throughout (command form): "Draw", "Position", "Stitch", "Press", "Cut", "Trim", "Arrange", "Join"
- Each step is a paragraph, not a single sentence -- steps describe a complete sub-assembly action
- Diagram references inline: `(Diagram 1)`, `(Diagram 3)`, `(Partial Quilt Diagram)`

### Cross-reference Callout

When the pattern uses a fabric numbering system, include an explanatory block at the start:

> **When making the blocks, refer to these labels and the list of fabrics on the last page of the pattern.**

Followed by a numbered legend:
```
1 1463-G    2 1463-L    3 1463-R    4 1464-G
5 1464-L    6 1464-R    7 1465-G    8 1465-L
...
25 CS-10-Cream
*Not used in quilt
```

### Standard Terminology (use these exact phrases)

| Action | Exact Phrasing |
|--------|---------------|
| Diagonal marking | "Draw a diagonal line on the wrong side of [fabric] squares" |
| Positioning for stitch-and-flip | "Position a marked square as shown on one corner of a [fabric] [dimension] square" |
| Stitching | "Stitch on the marked diagonal line" / "Stitch along the drawn line" |
| Trimming | "Cut away the excess fabric" / "Trim the edges of each round along the dashed lines" |
| Pressing | "Press the corner" / "Press the seam allowance open" / "Press the seam allowance" |
| Right sides | "With right sides facing up" / "right sides together" |
| Wrong side | "on the wrong side of" |
| Unit assembly | "Make (N) [Unit Name] units alike for each block" |
| Block count | "Make 32 Rose Blocks" / "Make 31 Trellis Blocks" |
| Row assembly | "Join the blocks into 7 rows of 9 blocks each. Join the rows." |
| Border attachment | "Sew long borders to the sides. Sew short borders to the top and bottom." |
| Stay stitching | "Stay stitch 1/4" away from the raw outer edge" |
| Foundation piecing | "Using paper-foundation-piecing methods, stitch one of each round" |
| Seam allowance | "Stitch in a 1/4" seam" |
| Fabric patch coverage | "Cut each fabric patch a generous 1/4" or larger all around" |

### Stitch-and-Flip Technique Description (Winter Jewels reference)

Standard language for this common technique:

> Blocks are made with an easy stitch-and-flip method. Draw a diagonal line on the wrong side of 2" Fabric 25 squares. Position a marked square as shown on one corner of a Red 3-1/2" square (Diagram 1). Stitch on the marked diagonal line. Cut away the excess fabric. Press the corner up.

### Paper Foundation Piecing Description (Turn of the Century reference)

> Print out the pattern for Round A (the smallest, innermost circle), and measure the 1" tester to be certain that it measures a precise 1". If it does not, adjust the printer setting until it is accurate.

### Step Numbering

Steps are continuous through both "Making the Quilt" and "Finishing the Quilt":
- Winter Jewels: Steps 1-6 (Making), Step 7 (Finishing)
- Turn of the Century: Steps 1-10 (Making), Step 11 (Finishing)

---

## 5. Finishing the Quilt

### Format

- Section heading: **Finishing the Quilt**
- Continues step numbering from Making the Quilt section
- Always a single step (sometimes two) covering the standard finishing sequence

### Standard Language

Use this exact phrasing (or close variant):

> **[N].** Layer the quilt with batting and backing and baste. Quilt [quilting instruction]. Bind to finish the quilt.

Quilting instruction variants observed:
- `Quilt an overall quilting motif, or quilt as you wish.`
- `Quilt in the ditch around borders and patches.`

The three-action sequence is always: **Layer** then **Baste** then **Quilt** then **Bind**.

---

## 6. Diagrams and Visual Conventions

### Block Construction Diagrams

- Each diagram is numbered: "Diagram 1", "Diagram 2", etc.
- Dimensions labeled with measurement text placed along edges: `2"`, `3-1/2"`, `2" x 6-1/2"`, `3-1/2" x 8"`
- Fabric numbers/labels placed inside each piece: `#25`, `#17`
- Dashed diagonal lines across corners indicate stitch-and-flip seam lines
- Block name and quantity below diagram: `Rose Block -- Make 32`, `Trellis Block -- Make 31`
- Sub-unit names and quantities: `Petal 1 / Make 2 for each block`, `Leaf 2 / Make 1 for each block`

### Quilt Assembly Diagram

- Full quilt layout showing all blocks arranged in rows
- Borders shown around the block field
- Sashing/trellis blocks visible between main blocks
- Caption below: "Quilt Assembly"
- Distinct fill patterns or colors to distinguish fabric roles

### Paper Foundation Piecing Templates

- **Solid lines** = sewing/seam lines (stitch on these)
- **Dashed lines** = outer cutting/trim line (cut along these after stitching)
- Fabric labels inside each piece region, using the format:
  ```
  1 - Snow
  2 - Butter
  3 - Sugar
  4 - Water
  ```
  The number indicates the piecing order within that section; the name identifies the fabric color.
- "Background" label in background/negative space regions
- Section labels in bold at corner or margin: **Round A**, **Round B Section 1**, **Round C Section 2**, etc.
- 1" test square printed on the first template page with hash marks at 1" intervals:
  ```
  |---|
  | 1"|
  |---|
  ```

### Arc Piecing Order Diagram

For circular/arc designs, include a numbered piecing order diagram showing the sequence (e.g., 1 through 16) in which arcs are assembled.

### Color Reference Page

- Grid layout of fabric swatches
- Organized by quadrant or grouping (e.g., "Upper Left Quadrant", "Lower Right Quadrant")
- Each swatch shows: bold numeric label in corner, fabric name, SKU code beneath
- "Additional Fabrics" section at bottom for background/binding
- Note at bottom: `*Indicates fabrics not used in quilt pattern. Fabrics shown are 50% of actual size.`

---

## 7. SVG/PDF Cutting Templates

When generating standalone cutting templates (not full pattern PDFs):

### Line Conventions

| Line Style | Meaning |
|------------|---------|
| Solid line (1.5pt-2pt) | Cut line -- cut along this line |
| Dashed line (1pt, 4-4 dash) | Seam line / fold line -- stitch along or fold here |
| Thin dashed offset (0.5pt) | Seam allowance boundary (1/4" inside cut line) |

### Required Elements

1. **1" Test Square**: Always include on the first page/sheet. Labeled "1\"" with dimension arrows. This allows the quilter to verify printer accuracy before cutting.

2. **Grain Line Arrow**: Double-headed arrow indicating fabric grain direction. Place on each template piece. Arrow runs parallel to the selvedge (lengthwise grain) unless the piece specifically calls for bias or crosswise grain.

3. **Piece Label**: Every template piece must include:
   - Fabric name or number (e.g., `Fabric 25`, `Background`, `Red`)
   - Cut quantity in parentheses: `Cut (4)`
   - Finished dimensions if useful: `3-1/2" x 5"`
   - Block name if the piece belongs to a specific block: `for Rose Block`

4. **Seam Allowance Indication**: Templates include 1/4" seam allowance by default. Show the seam allowance as a dashed offset line 1/4" inside the outer solid cut line. Label: `1/4" seam allowance included`

5. **Template Identification**: Each template page includes:
   - Pattern name
   - Template piece letter/number (e.g., `Template A`, `Piece 3`)
   - Page number: `Page N of M`

### Foundation Paper Piecing Template Format

PFP templates follow the conventions observed in the Turn of the Century pattern:

- **Solid lines** = seam lines (stitch on the printed line)
- **Dashed lines** = outer trim/cutting line (1/4" beyond seam lines)
- Each piece region labeled with piecing order number and fabric name:
  ```
  1 - Flax
  2 - Dawn
  3 - Icing
  4 - Pistachio
  ```
- Background regions labeled `Background`
- Section title in bold margin text: `Round B Section 1`
- Templates may span multiple printed pages with overlap alignment marks
- Include instruction: "Print and cut apart the 2 sections. Using a light table, overlap the 2 sections at the ends, aligning the drawn lines and words."

---

## 8. Language and Terminology Rules

### Measurement Format

- Imperial measurements only (inches)
- Use fraction notation with Unicode fraction characters where supported, otherwise hyphenated: `1/2"`, `3-1/2"`, `10-1/2"`, `2-1/2"`
- The inch symbol is a standard double-prime or quotation mark: `"`
- Dimensions separated by lowercase `x` with spaces: `2" x 8"`, `3-1/2" x 5"`, `4-1/2" x 78"`
- Never use the word "by" for dimensions; always use `x`
- Seam allowance is always `1/4"` (one-quarter inch)

### Quantity Format

- Quantities in cutting directions are always parenthesized: `Cut (4)`, `Cut (128)`, `Cut (2)`
- Block counts use "Make N": `Make 32 Rose Blocks`, `Make 31 Trellis Blocks`
- Quantities for sub-units: `Make 2 for each block`, `Make 1 for each block`

### Standard Definitions (define on first use)

| Term | Definition |
|------|-----------|
| WOF | Width of fabric from selvedge to selvedge (approximately 42" wide) |
| fat 1/4 | An 18" x 20"-22" cut of fabric (a quarter yard cut across the full width, then cut in half) |
| fat 1/8 | An 9" x 20"-22" cut of fabric |
| PFP | Paper-foundation piecing |
| RST | Right sides together (optional abbreviation; spell out on first use) |

### Skill Levels

Use exactly one of these four levels:

| Level | Description |
|-------|-------------|
| **Beginner** | Simple shapes, straight seams, minimal techniques |
| **Confident Beginner** | Basic piecing with one moderately advanced technique (e.g., stitch-and-flip) |
| **Intermediate** | Multiple techniques, set-in seams, or moderate complexity |
| **Advanced** | Paper foundation piecing, curves, complex assembly, many fabrics |

### Capitalization

- Block names are capitalized: `Rose Block`, `Trellis Block`, `Petal 1`, `Leaf 2`
- Fabric labels are capitalized: `Fabric A`, `Fabric 17`, `Fabric 25`
- Fabric color names are capitalized: `Snow`, `Butter`, `Champagne`, `Bordeaux`
- Section headings are title case: `Cutting Directions`, `Making the Quilt`, `Finishing the Quilt`
- Technique names are spelled out in full on first use: `paper-foundation piecing`, `stitch-and-flip`

### Voice and Tone

- Imperative voice for all instructions: "Draw", "Cut", "Position", "Stitch", "Press", "Trim", "Arrange", "Join", "Sew", "Pin", "Layer", "Baste", "Bind"
- Second person when addressing the quilter: "you will", "you should have"
- Short, direct sentences preferred over compound constructions
- Parenthetical diagram references inline: `(Diagram 1)`, `(Partial Quilt Diagram)`

---

## 9. Page Layout and Typography

### Typography Hierarchy

| Level | Usage | Style |
|-------|-------|-------|
| Display | Collection name on cover | Large bold serif, 36-48pt |
| H1 | Pattern name on interior pages | Bold sans-serif, 24-30pt |
| H2 | Major sections: Cutting Directions, Making the Quilt, Finishing the Quilt | Bold sans-serif, 16-18pt |
| H3 | Sub-sections: fabric labels, block types | Bold sans-serif, 12-14pt |
| Body | Instructions, descriptions | Regular serif or sans-serif, 10-11pt |
| Measurements | Dimensions in cutting and diagrams | Regular, same as body |
| Captions | Diagram captions, figure labels | Bold sans-serif, 9-10pt |
| Footer | Page numbers, download URL, date | Regular, 8pt |

### Page Footer

Every interior page includes a consistent footer:
```
Page N of M     Free Pattern Download Available at www.[domain].com     [date]
```

Separated by a thin horizontal rule above the footer.

### Page Size

- US Letter (8.5" x 11") for all pattern pages
- Templates may use US Letter or expand to tabloid/A3 when template pieces exceed letter size, with multi-page tiling and alignment marks

---

## 10. Complete Example: Cutting Directions Block

This example combines all formatting rules into a complete Cutting Directions section as QuiltCorgi should generate it:

```
Cutting Directions

Note: Read assembly directions before cutting patches.
All measurements are cut sizes and include 1/4" seam
allowances. WOF designates the width of fabric from
selvedge to selvedge (approximately 42" wide).

Cutting for ONE Rose Block
Fabric 17
Cut (4) squares 2"
Fabric 25
Cut (6) squares 2"
Cut (2) squares 3-1/2"
Green
Cut (2) rectangles 3-1/2" x 5"
Red
Cut (4) squares 3-1/2"

Cutting for ONE Trellis Block
Fabric 25
Cut (2) strips 2" x 8"
Cut (2) strips 2" x 6-1/2"
Light
Cut (1) rectangle 3-1/2" x 8"

Cutting for Entire Quilt
Fabric 14
Cut (2) side borders 4-1/2" x 78", cut lengthwise
Cut (5) strips crosswise from leftovers, each 4-1/2" x 30",
    pieced to make the following:
    (2) top bottom borders 4-1/2" x 66-1/2"
Fabric 17
Cut (128) squares 2" for Rose Block centers

Binding
Cut (8) strips 2-1/2" x WOF for binding

Backing
Cut (2) lengths 38" x 96", pieced to fit quilt top
    with overlap on all sides
```

---

## 11. Complete Example: Assembly Step

This example shows a properly formatted assembly step for a stitch-and-flip block:

```
Making the Quilt

1. Blocks are made with an easy stitch-and-flip method.
   Draw a diagonal line on the wrong side of 2" Fabric 25
   squares. Position a marked square as shown on one corner
   of a Red 3-1/2" square (Diagram 1). Stitch on the marked
   diagonal line. Cut away the excess fabric. Press the
   corner up. Repeat this step on the opposite corner with
   a 2" Fabric 17 square (Diagram 2). Make 2 Petal 1 units
   alike for each block.

2. The leaf units are made in the same manner. Draw a
   diagonal line on the wrong side of 3-1/2" and 2"
   Fabric 25 squares. Position a 3-1/2" square on the
   bottom of a green 3-1/2" x 5" rectangle. Stitch along
   the drawn line (Diagram 3). Cut away the excess fabric.
   Press the corner.
```

---

## 12. Implementation Checklist

When implementing PDF export in QuiltCorgi, verify each exported pattern against this checklist:

- [ ] Cover page has collection name, quilt photo, designer credit, dimensions, skill level
- [ ] Fabric Requirements table is boxed with bold heading and uses fraction yardage
- [ ] Cutting Directions opens with the seam-allowance disclaimer note
- [ ] Cutting directions grouped by block type, then by fabric within each group
- [ ] All cut instructions use `Cut (N)` format with parenthesized quantities
- [ ] Dimensions use `x` separator (not "by") and include `"` symbol
- [ ] Assembly instructions use imperative voice and numbered steps
- [ ] Diagram references use `(Diagram N)` format inline
- [ ] Standard terminology matches the phrases listed in Section 4
- [ ] Finishing section uses Layer/Baste/Quilt/Bind sequence
- [ ] Block names and fabric labels are capitalized
- [ ] WOF defined on first use
- [ ] Skill level uses one of the four canonical levels
- [ ] Page footers include page number, URL, and date
- [ ] Cutting templates include 1" test square
- [ ] Template pieces have grain line arrows, labels, and seam allowance indication
- [ ] PFP templates use solid lines for seam, dashed for trim, with numbered piecing order
