PROMPT 4 — Grid Detection, Shape Classification & Color Extraction
Context

You are adding three post-processing stages to the worker pipeline built in Prompt 3. At this point the worker has: a label map (every pixel assigned to a patch ID), and simplified contour polygons for each patch. Now you need to:

    Detect if the quilt follows a regular grid and snap geometry to it
    Classify repeated shapes into templates
    Extract colors from the original photo

These run after contour extraction and before returning the fullResult.
Types You Have

typescript

interface Point { x: number; y: number }

interface Patch {
id: number;
templateId: string;
polygon: Point[]; // real-world coordinates
pixelPolygon: Point[]; // pixel coordinates
svgPath: string;
centroid: Point;
area: number;
vertexCount: number;
dominantColor: string;
colorPalette: [string, string, string];
fabricSwatch: string;
neighbors: number[];
}

interface ShapeTemplate {
id: string;
name: string; // "2\" Square", "HST 3\"", "Hexagon 2\""
normalizedPolygon: Point[];
realWorldSize: { w: number; h: number };
instanceCount: number;
instanceIds: number[];
}

interface DetectedGrid {
type: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
dominantAngles: number[];
spacings: { angle: number; spacing: number }[];
confidence: number; // 0–1
}

What to Build
Stage A: Grid Detection

Determine if the quilt patches follow a regular repeating grid.

Algorithm:

    Extract boundary segments. Walk the label map. Wherever two adjacent pixels have different patch IDs, that's a boundary. Collect short line segments from these boundaries (group connected boundary pixels into segments, compute each segment's angle and length).

    Build an angle histogram. 180 bins (0°–179°), each segment weighted by its length. Smooth the histogram with a Gaussian (σ=2°). Find peaks — these are the dominant angles. Most quilts: 2 peaks at ~0° and ~90° (rectangular grid).

    Find grid line positions. For each dominant angle, take all boundary segments near that angle. Project them onto the perpendicular axis (1D). Build a histogram of projected positions. Find peaks — each peak is a grid line.

    Check for regular spacing. Measure the gaps between adjacent grid lines. Compute the coefficient of variation (std / mean). If CV < 0.15, the spacing is regular — it's a grid.

    Compute confidence. What fraction of all boundary pixel length falls within gridSnapTolerance of a detected grid line? If > 0.5, grid is confirmed.

    Classify grid type:
        Two dominant angles ~90° apart → rectangular
        Angles ~60° apart → hexagonal / triangular
        Low confidence or no regular spacing → none

Stage B: Grid Snapping

If grid confidence > 0.5 and gridSnapEnabled:

    Compute all grid line intersections — these are the candidate vertex positions.
    For each vertex in each patch's contour, find the nearest grid intersection. If it's within gridSnapTolerance pixels, snap the vertex to that exact position.
    After snapping, vertices from different patches that land on the same grid intersection are now identical — topology is automatically clean.

If no grid detected: Apply light regularization instead:

    For each edge, if its angle is within 5° of a dominant angle, snap the edge to that exact angle.
    Merge vertices within 3px of each other across all patches.

Stage C: Coordinate Conversion

Convert all pixel coordinates to real-world units:

text

realX = pixelX / pixelsPerUnit
realY = pixelY / pixelsPerUnit

Round to 0.01 precision.

Build the SVG path string for each patch:

text

"M x0,y0 L x1,y1 L x2,y2 ... Z"

Store both pixelPolygon (for canvas rendering) and polygon (real-world, for the studio).
Stage D: Shape Classification

Group patches that are the same shape into templates.

For each patch:

    Center the polygon on origin (subtract centroid)
    Scale so the longest distance from center = 1
    Rotate so the longest edge aligns to 0°
    Normalize the starting vertex to the top-left-most point

This gives a "canonical signature" for the shape, independent of position, scale, and rotation.

Compare all patches pairwise (only those with the same vertex count). Use Hausdorff distance between canonical signatures. Also check the mirror image. If distance < 0.08, they're the same shape.

Create a ShapeTemplate for each cluster. Generate a human-readable name:

    3 vertices with a right angle → "HST" (half-square triangle) + size
    4 vertices, all right angles, equal sides → Square + size
    4 vertices, all right angles, unequal sides → Rectangle + dimensions
    6 vertices → Hexagon + size
    Otherwise → vertex count + dimensions

Stage E: Color Extraction

For each patch, sample from the original corrected image (before any filtering — we want true colors, not processed colors).

    Dominant color: Get all pixels within this patch's label map region. Compute the median R, G, B (median resists outlier pixels from seam shadows). Convert to hex string.

    Color palette: Take up to 300 random pixels from the patch. Run k-means in LAB space with k=3. Convert the 3 cluster centers to hex. This captures the main colors in patterned fabrics.

    Fabric swatch: Crop the patch's bounding box from the original image. Apply the patch mask (transparent outside the patch). Resize to max 128×128. Encode as a PNG data URL.

Stage F: Neighbor Detection

For each patch, find which other patches share a boundary with it. Walk the label map: wherever pixel (x,y) has a different ID than pixel (x+1,y) or (x,y+1), those two IDs are neighbors. Build a neighbors array for each patch.
Stage G: Assemble Full Result

Build the complete Patch[] and ShapeTemplate[] arrays. Build the DetectedGrid object. Post fullResult back to the main thread.
What to Verify

    Grid detection: a photo of a rectangular quilt should detect type: 'rectangular' with correct spacing
    Grid snapping: slightly wobbly vertices should snap to perfect grid intersections
    An irregular/art quilt should get type: 'none' and not be forced into a grid
    Shape classification: a 9-patch quilt (9 squares) should produce 1 template with instanceCount: 9
    A star block should produce multiple templates (squares, triangles, etc.)
    Dominant color: a solid red patch should produce a hex close to the fabric's actual red
    Fabric swatch: should be a small transparent-background PNG of the patch's actual fabric
    Neighbors: patches that touch should be in each other's neighbor lists
