PROMPT 5 — Review Screen UI & Canvas Rendering
Context

You are building the main interactive screen where the user sees the analysis results and adjusts them. This is Screen 4 in the app flow. The worker pipeline (Prompts 3–4) produces patch outlines, colors, and templates. This screen displays them over the quilt photo and lets the user tweak parameters via sliders.

The store (usePhotoDesignStore) already has all the state fields. The worker already responds to process messages with previewResult and fullResult.
What to Build
Layout

Two-column layout:

    Left (large): The quilt canvas — the photo with patch overlays
    Right (sidebar): Controls, template list, status info

On mobile, stack vertically: canvas on top, controls below in a collapsible panel.
The Canvas

Use two layered HTML <canvas> elements, absolutely positioned on top of each other:

    Bottom canvas: The perspective-corrected photo. Only redrawn on zoom/pan changes.
    Top canvas: Patch overlays (outlines, fills). Redrawn on every slider change or view mode change.

This separation avoids re-compositing the photo on every update.

Pan and zoom: Implement with mouse wheel (zoom), click-drag (pan), and pinch-to-zoom (touch). Track a transform matrix (translate + scale) and apply it to both canvases.
Rendering Modes

The viewMode state controls what's visible:
Mode Photo Canvas Overlay Canvas
photo+outlines Full opacity Patches with 20% color fill + black outlines
colorFill 15% opacity (faded background) Patches with 85% color fill + outlines
outlinesOnly Hidden Black outlines only, no fill
photoOnly Full opacity Hidden

Toggle between modes with radio buttons or segmented control in the sidebar.
Preview Rendering (Fast Path)

When the worker sends previewResult, it contains:

    outlines: Float32Array — all patch contours packed flat, patches separated by NaN, NaN
    colors: string[] — one hex color per patch
    patchCount: number

Render this directly onto the overlay canvas. Walk the Float32Array: start a path at each new point, lineTo for subsequent points, closePath when you hit NaN. Fill with the corresponding color, stroke with black. This avoids deserializing full Patch objects on every slider tick.
Full Rendering (Detail Path)

When the worker sends fullResult with complete Patch[], switch to the full renderer:

    Each patch drawn with its dominantColor fill
    Hover: highlight the hovered patch (white outline, 3px)
    Selected: gold outline, 3px, and show details in sidebar

Hit Testing

When the user clicks/hovers on the canvas, you need to know which patch they're pointing at. Two options:

Option A (simple): Point-in-polygon test. On click, get the canvas coordinates (accounting for zoom/pan transform), then test against each patch's pixelPolygon using the winding number algorithm. For 200 patches this takes < 1ms.

Option B (faster for many patches): Maintain a hidden "ID canvas" the same size as the overlay. Draw each patch filled with a unique color derived from its ID (rgb(id >> 16, (id >> 8) & 0xFF, id & 0xFF)). On click, read the pixel at the click position — the color tells you the patch ID. Requires an extra canvas but gives O(1) hit testing.

Pick whichever is simpler for your implementation. Option A is fine for up to ~500 patches.
Slider Panel

Build these controls in the sidebar:

text

Lighting [slider 0–100, default 30]
→ When changed: update store.sliders.lighting, call requestPreview()

Smoothing [slider 0–100, default 50]
→ Same pattern

Heavy Prints [toggle, default off]
→ Same pattern

Colors [slider with "Auto" + manual range 2–30, default Auto]
→ Show the current K value: "Auto: 8 detected" or "Manual: 12"

Min Patch Size [slider 0–100, default 30]

Edge Enhancement [toggle, default off]
Edge Sensitivity [slider 0–100, default 50, only shown when edge enhancement is on]

Grid Snap [slider 0–100, default 50]

Every slider change should:

    Update the store
    Call requestPreview() (which is debounced to 100ms)
    The debounced function sends a process message to the worker with quality: 'preview'
    When previewResult comes back, re-render the overlay

Template Sidebar

Below the sliders, show the list of detected shape templates (only after fullResult):

text

Found: 147 patches, 4 templates
Grid: Rectangular 2" ✓

■ 2" Square (81×)
◣ HST 2" (36×)
▬ 2×4" Rectangle (18×)
◆ Diamond 2" (12×)

Each template row shows: a tiny visual representation (just the polygon drawn in a small box), the name, and the instance count.

Clicking a template highlights all patches of that template on the canvas.
Status Bar

Below the canvas (or at the bottom of the sidebar), show:

    During processing: "Smoothing… 30%" with a progress bar
    After processing: "147 patches found" + grid detection result
    Patch count updates live during preview

"Send to Studio" Button

At the bottom of the sidebar. Enabled only after a fullResult has been received. Clicking it triggers the export flow (built in Prompt 7).
What to Verify

    Slider drag updates the preview overlay within 500ms
    View mode toggle is instant (no reprocessing, just re-rendering)
    Zoom and pan work smoothly on both desktop and mobile
    Hovering a patch highlights it
    Clicking a patch selects it and shows its details
    Template list shows correct counts
    Canvas renders correctly at all zoom levels
    Performance: rendering 200 patch outlines takes < 16ms (60fps)
