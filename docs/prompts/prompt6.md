PROMPT 6 — Manual Correction Tools & Undo System
Context

You are adding manual correction tools to the review screen built in Prompt 5. The automatic pipeline (Prompts 3–4) does a good job but isn't perfect. The user needs to be able to fix mistakes — split patches that should be two, merge patches that should be one, and reassign miscolored regions.

All manual edits operate on the label map inside the worker — the integer array where every pixel is assigned a patch ID. Edits mutate this array, then the worker re-extracts contours for the affected patches and sends back updated data.
How Edits Work

The pattern for every edit:

    User performs an action on the canvas (draw a line, click a boundary, click a region)
    Main thread sends an edit message to the worker
    Worker saves the current label map to the undo history
    Worker mutates the label map
    Worker re-extracts contours for affected patches only (not the whole image)
    Worker sends back editResult with updated patches
    Main thread updates the store and re-renders only the changed patches

What to Build
Tool: Draw Seam (Split a Patch)

The user draws a line across a patch to split it in two.

UI interaction:

    User selects the "Draw Seam" tool from the toolbar
    User clicks a start point on the canvas, drags, releases at an end point
    While dragging, show a preview line
    On release, snap the line to the nearest dominant angle if within 15° (0°, 45°, 90°, 135°). This makes it easy to draw straight horizontal/vertical/diagonal cuts. Show the snapped line before confirming.
    Send splitPatch message with the patch ID (determined by hit-testing the start point) and the line endpoints

Worker implementation:

    Save label map to undo history
    Create a mask of the target patch
    Draw a 2px-wide line on a temporary mask at the given coordinates
    Subtract the line from the patch mask
    Run cv.connectedComponents on what remains
    If it splits into 2+ regions: assign new patch IDs to the sub-regions in the label map. Assign the line's pixels to the nearest region (so there's no gap).
    If it doesn't split (line didn't fully cross the patch): post back an error "Line didn't split the patch. Try drawing it all the way across."
    Re-extract contours for the new patches
    Post editResult

Tool: Erase Seam (Merge Two Patches)

The user clicks on a boundary between two patches to merge them.

UI interaction:

    User selects the "Erase Seam" tool
    User clicks on or near a boundary between two patches
    Determine the two patch IDs on either side of the click point (check the pixel at the click and its neighbors)
    Highlight both patches and show "Merge these two patches?" confirmation (or just do it immediately — simpler)
    Send mergePatches message with both patch IDs

Worker implementation:

    Save label map to undo history
    For every pixel in the label map: if value == patchIdB, set it to patchIdA
    Re-extract contour for patchIdA (which now includes the old patchIdB area)
    Post editResult with the updated patch and the removed patch ID

Tool: Flood Fill (Reassign Region)

The user clicks a region that was assigned to the wrong patch and reassigns it to a neighbor.

UI interaction:

    User selects the "Flood Fill" tool
    User clicks inside the misassigned region
    The clicked patch highlights. The user then clicks a neighboring patch — the region transfers to that patch.
    Send floodFill message with the click point and the target patch ID

Worker implementation:

    Save label map to undo history
    Get the current patch ID at the click point
    Create a binary mask: pixels where label == that ID
    Run cv.connectedComponents on the mask to find the specific connected component at the click point (the patch might have multiple disconnected parts — only reassign the one the user clicked)
    Relabel those pixels to the target patch ID
    Re-extract contours for both affected patches
    Post editResult

Undo/Redo System

Manual edits are destructive mutations of the label map. The user needs to be able to undo.

Storage: The label map for a 4000×3000 image is 48 MB as raw Int32Array. We can't store 15 copies (720 MB). Instead, use Run-Length Encoding (RLE) compression.

A quilt label map has high spatial coherence — same patch ID for long runs of pixels. RLE typically compresses it 50:1 to 200:1, so each snapshot is ~250 KB to ~1 MB.

Implementation:

text

class LabelMapHistory {
stack: Uint8Array[] // RLE-compressed snapshots
pointer: number // current position in stack
maxSnapshots: 15

push(labelMap): - Discard anything above pointer (kills redo history on new edit) - RLE encode the label map's data32S array - Push to stack - If stack exceeds maxSnapshots, drop the oldest - Update pointer

undo(labelMap) → boolean: - If pointer <= 0, return false - Decrement pointer - RLE decode into labelMap.data32S - Return true

redo(labelMap) → boolean: - If pointer >= stack.length - 1, return false - Increment pointer - RLE decode into labelMap.data32S - Return true
}

RLE encoding: Walk the Int32Array. For each run of identical values, store (value, runLength). Pack into a compact binary format (DataView with Int32 pairs). The compression ratio for a typical 200-patch quilt label map is enormous because most patches are rectangular regions.

Integration:

    Before every manual edit, the worker calls history.push(labelMap)
    On undo message: history.undo(labelMap), re-extract all contours, post fullResult
    On redo message: same pattern
    After every edit, post undoRedoState: { canUndo, canRedo } so the UI can enable/disable buttons

Toolbar UI

Add a toolbar above or beside the canvas:

text

[Select] [Draw Seam ✏️] [Erase Seam 🧹] [Flood Fill 🪣] | [↩ Undo] [↪ Redo]

    Only one tool active at a time
    Select tool is default: click to select a patch, see its details
    Undo/Redo buttons grayed out when not available
    Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Shift+Z = redo

Cursor Feedback

Change the cursor based on active tool:

    Select: default pointer
    Draw Seam: crosshair
    Erase Seam: pointer with a small eraser icon (or just crosshair)
    Flood Fill: crosshair with a small bucket icon (or just crosshair)

What to Verify

    Draw Seam: draw a horizontal line across a square patch → it becomes 2 rectangles
    Draw Seam: draw a line that doesn't cross the full patch → error message, no change
    Erase Seam: click the boundary between two patches → they become one patch
    Flood Fill: click a misassigned region → only that connected component changes, not disconnected parts of the same patch
    Undo: after any edit, undo restores the previous state exactly
    Redo: after undo, redo re-applies the edit
    Undo after undo after undo: works up to 15 levels
    New edit after undo: kills redo history
    RLE compression: verify a round-trip encode/decode produces identical data
    Memory: 15 RLE snapshots of a 4000×3000 label map should total < 20 MB
