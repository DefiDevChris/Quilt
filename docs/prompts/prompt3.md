PROMPT 3 — Core CV Processing Pipeline
Context

You are building the image processing pipeline that runs inside a Web Worker. This is the heart of the feature — it takes a perspective-corrected photo of a quilt and finds every fabric patch.

From Prompt 1 you have: worker.ts scaffold, MatRegistry, message protocol. From Prompt 2 you have: a corrected image being sent to the worker as ImageData.

The pipeline runs when the main thread sends a process message with parameters and a quality level (preview or full). On preview, it runs on a downscaled image (max 1024px on longest side) and returns lightweight outline data. On full, it runs on the full image and returns complete Patch objects.
Processing Parameters

The main thread sends these (derived from UI sliders):

typescript

interface ProcessParams {
claheClipLimit: number; // 1.0–8.0
claheGridSize: number; // typically 8
gaussianBlurSize: number; // 0 (off), 3, 5, or 7
bilateralD: number; // 3–21, must be odd
bilateralSigmaColor: number; // 20–150
bilateralSigmaSpace: number; // 20–150
kColors: number; // 0 = auto-detect, 2–30 = manual
minPatchArea: number; // in pixels
edgeEnhance: boolean;
cannyLow: number; // 10–100
cannyHigh: number; // 30–230
gridSnapEnabled: boolean;
gridSnapTolerance: number; // 2–22 pixels
pixelsPerUnit: number;
unit: 'in' | 'cm';
}

What to Build

Implement these stages as functions called sequentially in the worker's process handler. Use MatRegistry for every cv.Mat created. Post progress messages between stages.
Stage 1: Resolution Scaling

If quality === 'preview':

    Compute scale factor: scale = min(1, 1024 / max(width, height))
    Resize the image: cv.resize(src, dst, new cv.Size(0,0), scale, scale)
    Adjust minPatchArea by scale * scale

If quality === 'full': use the image as-is, scale = 1.
Stage 2: CLAHE (Lighting Normalization)

Fixes uneven lighting across the quilt (lamps, windows, shadows).

    Convert BGR to LAB: cv.cvtColor(src, lab, cv.COLOR_BGR2Lab)
    Split channels: cv.split(lab, channels)
    Create CLAHE: new cv.CLAHE(clipLimit, new cv.Size(gridSize, gridSize))
    Apply CLAHE to the L channel (index 0)
    Merge channels back
    Convert LAB to BGR

Stage 3: Optional Gaussian Blur (Heavy Prints)

If gaussianBlurSize > 0, apply cv.GaussianBlur with that kernel size. This smears busy fabric prints (florals, geometrics) so they don't create false patch boundaries later.
Stage 4: Bilateral Filter

cv.bilateralFilter(src, dst, d, sigmaColor, sigmaSpace)

This smooths colors within each patch (kills remaining texture and noise) while keeping the sharp color transitions at seam lines. After this step, the image should look like a clean digital illustration — flat colors with hard edges.
Stage 5: Color Quantization (K-Means)

Reduce the image to K distinct colors.

    Convert to LAB (perceptually uniform color space — makes "looks different" = "is numerically different")
    Reshape to a (numPixels × 3) matrix of type CV_32F
    If K=0 (auto-detect), run the elbow method:
        Subsample to 50,000 pixels for speed
        Run k-means for K = 3 through 20
        Record the compactness (total within-cluster variance) for each K
        Find the elbow: the K where the drop in compactness slows most sharply
        Use that K
    Run cv.kmeans with the chosen K. Output: a labels array where every pixel has a cluster ID (0 to K-1), and a centers array with the K colors.

Stage 6: Connected Components (Label Map)

Turn the K-means output into a patch map where every pixel belongs to exactly one patch.

For each cluster ID (0 to K-1):

    Create a binary mask: pixels where cluster == this ID → 255, else → 0
    Run cv.connectedComponents(mask, labels, 8, cv.CV_32S)
    Each connected component within this color is a separate patch
    Assign each component a unique patch ID (incrementing across all clusters)

Store the result as a single cv.Mat of type CV_32S (the "label map") where labelMap[y][x] = patch ID.

This label map is the topological guarantee. Every pixel belongs to exactly one patch. Zero gaps, zero overlaps, by construction.
Stage 7: Small Region Merging

Patches smaller than minPatchArea pixels are noise — fragments from imperfect quantization.

For each small patch:

    Find its boundary pixels (pixels adjacent to a different patch ID)
    Among the neighboring patch IDs, find the one whose average LAB color is closest to this small patch's average color
    Relabel all pixels of the small patch to that neighbor's ID

Repeat until no patches are below the threshold.
Stage 8: Edge Enhancement (Optional)

Only runs if edgeEnhance is true. Handles same-color adjacent patches (two patches cut from the same fabric, distinguished only by the physical seam).

    Run on the ORIGINAL corrected image (not the filtered one — seam shadows may have been smoothed away by bilateral filter)
    Convert to grayscale, light Gaussian blur (3×3), run cv.Canny(src, dst, cannyLow, cannyHigh)
    Morphological close (cv.MORPH_CLOSE with 3×3 rect kernel) to connect fragmented edges
    Find patches that are "suspiciously large" (area > 4× the median patch area)
    For each large patch: extract Canny edges within that patch's region. Subtract edges from the patch mask. Run cv.connectedComponents on what remains. If it splits into 2+ regions of reasonable size, accept the split — assign new patch IDs.

Stage 9: Contour Extraction

For each unique patch ID in the label map:

    Create a binary mask (this patch = 255, everything else = 0)
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    Take the largest contour (outermost boundary)
    Simplify: cv.approxPolyDP(contour, approx, epsilon, true) where epsilon = 0.02 * cv.arcLength(contour, true) (2% of perimeter)
    Convert the contour points to a Point[] array

Stage 10: Return Results

If quality === 'preview':

    Pack all contour outlines into a single Float32Array: each patch's points laid flat [x0,y0, x1,y1, ...], patches separated by NaN, NaN
    Extract a hex color for each patch from the k-means cluster centers
    Post previewResult with the Float32Array (as Transferable for zero-copy), the color array, and the patch count

If quality === 'full':

    Build full Patch objects (color extraction and shape classification happen in Prompt 4 — for now, fill in what you can: id, pixelPolygon, vertexCount, area)
    Post fullResult

Error Handling

Wrap the entire pipeline in try/catch. In the catch:

    If it's a memory error (RangeError or message contains "memory"): post a recoverable error, downscale the image to half resolution, retry once
    If k-means fails: post a recoverable error suggesting the user adjust the Colors slider, fall back to K=8
    If connectedComponents returns only 1 patch: post a recoverable error saying no patches were found
    In finally: always call reg.deleteAll()

Slider-to-Parameter Mapping

Include this function on the main-thread side so the UI can convert slider positions to ProcessParams:

text

lighting slider (0–100) →
claheClipLimit = 1.0 + (lighting/100) \* 7.0
claheGridSize = 8

heavyPrints toggle →
gaussianBlurSize = toggle ? 5 : 0 (or 7 if smoothing > 50)

smoothing slider (0–100) →
bilateralD = round(3 + (smoothing/100) _ 18), force odd
bilateralSigmaColor = 20 + (smoothing/100) _ 130
bilateralSigmaSpace = 20 + (smoothing/100) \* 130

colors slider (0=auto, 1–100) →
kColors = 0 if auto, else round(2 + (colors/100) \* 28)

minPatchSize slider (0–100) →
minPatchArea = (0.0001 + (minPatchSize/100) _ 0.05) _ totalPixelCount

edgeSensitivity slider (0–100) →
cannyLow = round(10 + (1 - sensitivity/100) _ 90)
cannyHigh = round(30 + (1 - sensitivity/100) _ 200)

gridSnap slider (0–100) →
gridSnapEnabled = gridSnap > 5
gridSnapTolerance = round(2 + (gridSnap/100) \* 20)

What to Verify

    CLAHE: take a photo with a shadow across it. After CLAHE, the same fabric should appear the same color on both sides of the shadow.
    Bilateral filter: after filtering, the image should look like a flat-color illustration with sharp edges at seams.
    K-means: on a quilt with 6 distinct fabrics, auto-K should find approximately 6.
    Connected components: on a 3×3 grid of alternating colors, should find 9 patches.
    Small region merge: tiny speckles should disappear into their neighbors.
    Edge enhancement: two adjacent same-color patches with a visible seam shadow should be split.
    Preview mode: runs in under 500ms on a 1024px image.
    Full mode: runs in under 5 seconds on a 4000×3000 image.
    No memory leaks: run the pipeline 10 times, WASM heap should not grow.
