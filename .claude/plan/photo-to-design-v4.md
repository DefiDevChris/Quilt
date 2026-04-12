# Photo-to-Design Engine — Build Spec

## Pipeline

```
Upload → Correct/Adjust Photo → Trace Seams → Normalize Shapes → Ratio Grid → SVG Output → Fabric.js Canvas
```

## Step 1: Upload

User uploads a photo of a quilt. JPEG, PNG, WebP, HEIC.

## Step 2: Correct & Adjust Photo

Perspective correction (4-corner pin → homography warp) to flatten the image. Fine rotation and skew sliders for final alignment. Output: a flat, square-on image of the quilt.

## Step 3: Engine Traces All Seam Lines

The engine looks at the corrected image and finds every seam — every line where one piece of fabric meets another. The seams form a connected network of lines across the entire quilt surface. Every seam is detected. The output of this step is a planar graph: vertices (where seams intersect) and edges (the seam lines between intersections).

No grid overlay. No color palette. No K-Means. The engine traces the actual visible seam lines in the image.

## Step 4: Normalize Shapes

The seam network divides the quilt surface into closed regions (faces). Each face is one fabric patch.

**Make like shapes the same:** If the quilt has 20 squares that are roughly the same size, they all become exactly the same size. If it has 40 right triangles that are roughly the same, they all become exactly the same right triangle. Wobbly edges become straight lines. Almost-right angles become exact right angles. Almost-45° angles become exact 45°.

The engine identifies shape clusters (groups of similar shapes) and snaps every shape in a cluster to the same canonical form.

## Step 5: Ratio Grid

All shapes are sized as ratios to each other — no fixed units (no inches, no cm, no pixels). A small square is 1×1. A rectangle twice as wide is 2×1. A triangle that fills half a square is a 1×1 right triangle. The entire quilt's geometry is expressed as unitless proportions.

## Step 6: SVG Output

Every normalized patch becomes a closed SVG path. Outline only — no fill, no color. Zero gaps between adjacent patches. Zero overlap. Shared edges have identical vertex coordinates. The patches tile perfectly to reconstruct the full quilt surface.

## Step 7: Plot on Fabric.js Canvas

Each SVG patch is placed on the studio Fabric.js canvas as a `fabric.Polygon`. Positioned to reconstruct the quilt layout. Ready for the user to assign fabrics, recolor, and export as a PDF cutting pattern.

## What the engine is NOT

- NOT color sampling, palette extraction, or fabric matching
- NOT a grid overlay where cells get classified
- NOT K-Means clustering
- NOT edge detection filters (Sobel, Canny)
- NOT block structure or pattern matching

It is a seam tracer. It finds the physical seam lines in the photo and turns them into clean vector geometry.
