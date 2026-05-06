PROMPT 7 — Studio Export, Error Handling & Cleanup
Context

You are building the final piece: taking the analysis results and delivering them to the existing design studio, plus handling all the edge cases that make the feature production-ready.

The review screen (Prompts 5–6) shows the user their detected patches with templates and colors. Now they click "Send to Studio" and the pattern needs to land in the studio as editable vector shapes.
Types You Need

typescript

interface StudioImportPayload {
version: '1.0';
source: 'photo-to-design';
metadata: {
quiltWidth: number;
quiltHeight: number;
unit: 'in' | 'cm';
patchCount: number;
templateCount: number;
gridType: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
};
patches: {
id: string;
templateId: string;
polygon: Point[]; // real-world coordinates
fill: string; // hex color
colorPalette: [string, string, string];
swatch: string; // PNG data URL
}[];
templates: ShapeTemplate[];
}

What to Build
Export Flow

When the user clicks "Send to Studio":

    Build the payload from the store's patches and templates:
        quiltWidth = the maximum x coordinate across all patch polygons
        quiltHeight = the maximum y coordinate
        Patches use their real-world coordinate polygon (not pixel coordinates)
        Convert numeric patch IDs to string IDs

    Clean up Photo-to-Design resources BEFORE navigation. This is critical:
        Call store.dispose() which must:
            Send dispose message to the worker (worker calls MatRegistry.deleteAll() and closes)
            Terminate the worker
            Revoke all object URLs (URL.revokeObjectURL for the source image URL and corrected image URL)
            Reset all store state to initial values
        If you skip this, you leak the worker's WASM memory (potentially 200+ MB) and it never gets freed until the tab closes

    Save the payload — either:
        Pass it to the studio via a shared store / context
        Save to IndexedDB and pass the key via URL
        Or use Next.js router state
        Choose whichever fits the existing studio architecture

    Navigate to the studio page

Studio Import

On the studio side, when it receives a StudioImportPayload:

    Set the canvas/artboard size to quiltWidth × quiltHeight in the specified unit
    For each patch in the payload:
        Create an editable vector polygon shape at the polygon coordinates
        Set fill color to fill
        Store colorPalette and swatch as metadata on the shape (for future fabric-swap features)
    Register the templates in whatever pattern/library system the studio has
    Enable all standard studio tools: select, move, recolor, resize, group, duplicate, export

The patches should land on the canvas arranged exactly as they were in the photo — a complete quilt layout ready to edit.
Optional: Source Photo Reference Layer

Add a toggle in the studio: "Show source photo." When enabled, display the perspective-corrected photo as a low-opacity background layer behind the vector patches. This helps the user confirm that patches line up correctly.

Store the corrected image data URL in the payload if this feature is desired (be aware this adds ~1–5 MB to the payload depending on image size).
Error Handling Table

Implement these error scenarios:
When What Happens User Sees Recovery
OpenCV.js fails to load (WASM not supported) Worker posts error on init "Your browser doesn't support this feature. Please use Chrome, Firefox, Safari, or Edge." Link to supported browsers
Image too large for WASM memory RangeError during cv.Mat creation "Image is very large. Reducing size…" Auto-downscale to 2048px max, retry pipeline
K-means doesn't converge Max iterations hit "Color detection struggled. Try adjusting the Colors slider." Fall back to K=8, show result
0 patches found connectedComponents returns 1 region "No patches detected. Try increasing the Colors slider or check your photo." Show sliders, let user adjust
500+ patches found Count exceeds threshold after processing "Found many small patches. Try increasing Smoothing or Min Patch Size." Show sliders, let user adjust
Worker crashes entirely Worker error event on main thread "Processing crashed. Restarting…" Terminate dead worker, spawn new one, re-init OpenCV, re-send the image, retry
HEIC file can't be decoded Image decode fails "iPhone photo format not supported. Please share as JPEG and try again." Show instructions
User navigates away during processing beforeunload or route change Nothing needed — just dispose cleanly Call dispose() on unmount

Implementation: In the main thread, wrap every worker message handler in try/catch. In the worker, wrap the pipeline in try/catch with a finally that always calls reg.deleteAll(). For the "worker crashes" case, add an onerror handler on the worker instance that triggers the recovery flow.
Cleanup on Unmount

The Photo-to-Design page component must call dispose() in its cleanup:

text

useEffect(() => {
return () => {
usePhotoDesignStore.getState().dispose();
};
}, []);

This ensures that if the user navigates away by any means (back button, closing tab, clicking a link), the worker is terminated and object URLs are revoked.
Verification Checklist

Run through these before shipping:

Export:

    Clicking "Send to Studio" navigates to the studio with all patches visible
    Patch positions in the studio match their positions in the photo
    Patch colors match what was shown on the review screen
    Template list is populated in the studio's pattern library
    Studio edit tools (move, recolor, resize) work on imported patches

Error handling:

    Upload a corrupt JPEG → graceful error message
    Upload a 10000×8000 image → auto-downscaled, still works
    Set Colors slider to 2 on a complex quilt → few patches found, no crash
    Set Colors slider to 30 → many patches, no crash, might be slow but doesn't freeze UI
    Kill the worker manually (dev tools) → UI shows restart message, recovers

Memory:

    Run the full flow 3 times without refreshing → no memory growth (check browser task manager)
    After navigating to studio, photo-to-design worker is terminated (check dev tools)
    Object URLs are revoked after dispose (no blob URLs in memory)

Cross-browser:

    Chrome desktop: full flow works
    Safari desktop: full flow works
    Firefox desktop: full flow works
    Chrome Android: full flow works, touch interactions correct
    Safari iOS: full flow works, touch interactions correct
