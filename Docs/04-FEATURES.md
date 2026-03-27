# Feature Specification
**Project:** QuiltCorgi
**Version:** 1.0
**Date:** March 26, 2026
**Purpose:** Every feature with complete behavioral spec, processing logic, error handling, and acceptance criteria.

---

## Feature Map

| Module | Feature | Priority | Phase | Tier |
|--------|---------|----------|-------|------|
| Canvas | Canvas Initialization & Basic Drawing | Critical | 3 | Free |
| Canvas | Shape Drawing Tools | Critical | 3 | Free |
| Canvas | Grid System & Snap | Critical | 3 | Free |
| Canvas | Unit Toggle (Imperial/Metric) | Critical | 3 | Free |
| Canvas | Zoom & Pan | Critical | 3 | Free |
| Canvas | Undo/Redo | Critical | 3 | Free |
| Canvas | Auto-Save & Manual Save | Critical | 3 | Free |
| Canvas | Bezier Curve Tool | High | 5 | Pro |
| Canvas | Custom Context Menu | High | 5 | Pro |
| Canvas | Quick-Info Inspector Panel | High | 5 | Pro |
| Blocks | Block Library Browser | Critical | 4 | Free (100 blocks) / Pro (all) |
| Blocks | Drag-to-Canvas from Library | Critical | 4 | Free |
| Blocks | Custom Block Drafting | High | 5 | Pro |
| Fabric | Fabric Upload & Processing | High | 6 | Pro |
| Fabric | Pattern Fill Mapping | High | 6 | Pro |
| Fabric | System Fabric Library | High | 6 | Pro |
| Layout | Layout Presets (Grid/Sashing/On-Point) | High | 7 | Pro |
| Layout | Free-Form Mode | High | 7 | Free |
| Layout | Custom Borders | High | 7 | Pro |
| Generators | Auto-Complete Symmetry Engine | Medium | 8 | Pro |
| Generators | Serendipity Block Generator | Medium | 8 | Pro |
| Measurement | Slide-Out Fraction Calculator | Medium | 9 | Free |
| Measurement | Yardage Estimator | High | 9 | Pro |
| Export | Printlist Queue | High | 10 | Pro |
| Export | 1:1 PDF Generation | Critical | 10 | Pro |
| Export | Image Export (DPI) | High | 10 | Pro |
| Payments | Stripe Subscription Management | Critical | 11 | — |
| Payments | Free/Pro Tier Gating | Critical | 11 | — |
| Community | Community Board (Browse/Search) | Medium | 12 | Free |
| Community | Post Design to Community | Medium | 12 | Pro |
| Community | Like System | Medium | 12 | Free |
| Community | Admin Moderation Panel | Medium | 12 | Admin |
| Auth | Social OAuth Login | Critical | 2 | Free |
| Auth | Email/Password Login | Critical | 2 | Free |
| Account | User Dashboard | Critical | 2 | Free |
| Account | Profile Page | Medium | 2 | Free |
| Notifications | In-App Notification System | Low | 13 | Free |

---

## Feature Details

### F1: Canvas Initialization & Basic Drawing
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want to open a blank canvas with configurable dimensions so that I can start designing a quilt.
**Permissions:** Free, Pro, Admin

#### Trigger
User clicks "New Project" from the dashboard or opens an existing project.

#### Inputs
| Input | Source | Type | Validation |
|-------|--------|------|------------|
| Canvas width | User input (new project dialog) | Number | Min 1, Max 200 (inches) or equivalent in cm |
| Canvas height | User input (new project dialog) | Number | Min 1, Max 200 (inches) or equivalent in cm |
| Unit system | User selection | Enum (imperial/metric) | Must be one of the two values |
| Grid enabled | User toggle | Boolean | — |
| Grid size | User input | Number | Min 0.125" (or 0.3cm), Max canvas dimension |

#### Processing Logic
1. Create a new Fabric.js canvas instance sized to fill the available viewport.
2. Set the internal coordinate system to map canvas pixels to the chosen unit system (1 inch = 96px at 100% zoom, 1cm = 37.8px at 100% zoom).
3. If grid is enabled, render grid lines at the specified interval across the entire canvas.
4. Initialize a Zustand `canvasStore` with: canvas reference, zoom level (default 1.0), unit system, grid settings, undo/redo history stack (empty), selected objects (none).
5. Initialize a Zustand `projectStore` with: project ID, name, save status ("unsaved"), auto-save timer (30-second interval).
6. Render the canvas background as white (simulating fabric/paper).
7. Display a ruler along the top and left edges showing measurement marks in the active unit system.

#### Output
A fully initialized interactive canvas ready for shape placement, with grid overlay (if enabled), rulers, and zoom controls visible.

#### Error Handling
| Error Case | User Message | System Behavior |
|------------|-------------|-----------------|
| Canvas width/height out of range | "Canvas dimensions must be between 1 and 200 inches." | Block project creation, highlight invalid field |
| Browser does not support HTML5 Canvas | "Your browser doesn't support the drawing canvas. Please use a modern browser." | Show error page with browser recommendations |
| Fabric.js fails to initialize | "Unable to load the design canvas. Please refresh the page." | Log error, show retry button |

#### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| User resizes browser window | Canvas viewport adjusts, canvas content remains at same scale. Rulers and grid re-render. |
| User opens two projects in separate tabs | Each tab has an independent canvas instance. Saves are per-project. |
| Grid size larger than canvas | Grid renders as a single cell. Warning toast: "Grid size is larger than canvas." |

#### Acceptance Criteria
- [ ] New project dialog allows setting width, height, unit system, and grid options
- [ ] Canvas renders at correct aspect ratio with proper unit-to-pixel mapping
- [ ] Grid lines render at the specified interval and update when grid size changes
- [ ] Rulers display measurement marks in the active unit system
- [ ] Zustand stores are initialized with correct defaults
- [ ] Canvas is interactive — mouse events (click, drag) are captured

---

### F2: Shape Drawing Tools
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want to draw rectangles, triangles, and polygons on the canvas so that I can create basic quilt block shapes.
**Permissions:** Free, Pro, Admin

#### Trigger
User selects a shape tool from the toolbar (Rectangle, Triangle, Polygon, Line).

#### Inputs
| Input | Source | Type | Validation |
|-------|--------|------|------------|
| Shape type | Toolbar selection | Enum | rectangle, triangle, polygon, line |
| Start point | Mouse down on canvas | Coordinates (x, y) | Within canvas bounds |
| End point | Mouse up on canvas | Coordinates (x, y) | Within canvas bounds |
| Fill color / pattern | Color picker or fabric fill | String (hex) or Pattern | Valid hex or valid pattern reference |
| Stroke color | Color picker | String (hex) | Valid hex color |
| Stroke width | Toolbar input | Number | 0.5–10px |

#### Processing Logic
1. On mouse down, record start coordinates.
2. On mouse drag, render a preview outline of the shape following the cursor.
3. If snap-to-grid is enabled, snap both start and end points to the nearest grid intersection.
4. On mouse up, create the Fabric.js object (Rect, Triangle, Polygon, or Line) with the computed dimensions.
5. Add the object to the canvas and push the canvas state to the undo history stack.
6. Select the newly created object (show selection handles).
7. The shape is movable, resizable, and rotatable via Fabric.js selection handles.

#### Output
A new shape object on the canvas, selected and ready for manipulation.

#### Error Handling
| Error Case | User Message | System Behavior |
|------------|-------------|-----------------|
| Shape drawn with zero area (click without drag) | No message — ignore the action | Do not create an object |
| Shape drawn partially outside canvas bounds | No message — clip to canvas bounds | Constrain shape to canvas boundary |

#### Acceptance Criteria
- [ ] Rectangle tool creates rectangles via click-drag
- [ ] Triangle tool creates right triangles via click-drag
- [ ] Polygon tool allows multi-point polygon creation (click to add points, double-click to close)
- [ ] Line tool draws straight lines
- [ ] Shapes snap to grid when snap is enabled
- [ ] Shapes are selectable, movable, resizable, and rotatable after creation
- [ ] Fill and stroke are configurable via the properties panel
- [ ] Shape creation pushes state to undo history

---

### F3: Grid System & Snap
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want configurable grid lines and snap-to-grid behavior so that my shapes align precisely.
**Permissions:** Free, Pro, Admin

#### Trigger
Grid settings are configured in the canvas settings panel or project creation dialog.

#### Processing Logic
1. Grid is rendered as a separate Fabric.js layer behind all design objects.
2. Grid lines are thin (1px), low-opacity (0.15), and do not appear in exports.
3. Grid size is stored in `projectStore.gridSettings.size` and respects the active unit system.
4. When snap-to-grid is enabled, all object movements, resizing, and point placement snap to the nearest grid intersection. Snapping uses a threshold of half the grid cell size.
5. Grid can be toggled on/off without affecting object positions.
6. Custom grid sizes are entered as a number in the active unit system (e.g., "0.5" in imperial = every half inch).

#### Acceptance Criteria
- [ ] Grid renders at the correct interval based on unit system and grid size
- [ ] Grid visibility toggles on/off without affecting objects
- [ ] Snap-to-grid constrains all object manipulation to grid intersections
- [ ] Grid does not appear in PDF or image exports
- [ ] Custom grid sizes accept decimal values (e.g., 0.25", 0.5cm)
- [ ] "No grid" option removes all grid lines and disables snapping

---

### F4: Unit Toggle (Imperial/Metric)
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want to switch between inches and centimeters so that I can work in my preferred measurement system.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. A toggle button in the main toolbar switches `canvasStore.unitSystem` between `imperial` and `metric`.
2. When toggled, all displayed measurements are recalculated: 1 inch = 2.54 cm.
3. Grid size converts proportionally (e.g., 1" grid → 2.54cm grid).
4. Rulers update to display the new unit.
5. Quick-Info panel updates all displayed dimensions.
6. Yardage estimator recalculates in the new unit.
7. Canvas pixel mapping adjusts (imperial: 96px/inch, metric: 37.8px/cm at 100% zoom).
8. The conversion is stored per-project in `projects.unitSystem`.

#### Acceptance Criteria
- [ ] Toggle switches all displayed measurements instantly
- [ ] Grid recalculates and re-renders in new unit
- [ ] Rulers update to new unit
- [ ] Unit preference persists when project is saved and reopened
- [ ] All internal calculations use a consistent base unit (stored in inches, displayed in either)

---

### F5: Zoom & Pan
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want to zoom in for detail work and pan around large quilts so that I can work at any scale.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. Mouse wheel zooms in/out centered on the cursor position. Zoom range: 10% to 500%.
2. Middle mouse button (or Space + left click drag) pans the viewport.
3. Zoom controls in the toolbar: zoom in (+), zoom out (-), fit to screen, 100% (actual size).
4. Current zoom percentage is displayed in the toolbar.
5. Rulers scale with zoom level.
6. Grid scales with zoom level.

#### Acceptance Criteria
- [ ] Mouse wheel zoom works centered on cursor
- [ ] Pan via middle mouse button or Space+drag
- [ ] Zoom controls in toolbar function correctly
- [ ] "Fit to screen" scales canvas to fill viewport
- [ ] "100%" resets to actual size
- [ ] Zoom percentage displayed in toolbar
- [ ] Zoom range is 10%–500%

---

### F6: Undo/Redo
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want to undo and redo actions so that I can experiment without fear of mistakes.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. Every canvas mutation (shape add, delete, move, resize, rotate, color change, property change) pushes the full canvas state (Fabric.js `toJSON()`) to an undo stack.
2. The undo stack has a maximum depth of 50 states.
3. Ctrl+Z triggers undo: pop the current state, restore the previous state from the stack.
4. Ctrl+Shift+Z (or Ctrl+Y) triggers redo: restore the next state from the redo stack.
5. Any new mutation after an undo clears the redo stack (standard undo/redo behavior).
6. Undo/Redo buttons are visible in the toolbar with disabled state when at stack boundaries.

#### Acceptance Criteria
- [ ] Ctrl+Z undoes the last canvas action
- [ ] Ctrl+Shift+Z / Ctrl+Y redoes the last undone action
- [ ] Toolbar buttons reflect available undo/redo states (disabled when empty)
- [ ] New actions after undo clear the redo stack
- [ ] Stack holds up to 50 states
- [ ] All canvas mutations (add, delete, move, resize, rotate, fill change) are captured

---

### F7: Auto-Save & Manual Save
**Module:** Canvas
**Phase:** 3
**User Story:** As a quilter, I want my work saved automatically and also be able to save manually so that I never lose my designs.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. Auto-save triggers every 30 seconds if the canvas has been modified since the last save.
2. Auto-save serializes the Fabric.js canvas via `toJSON()` and sends a PUT request to `/api/projects/[id]` with the updated `canvasData`.
3. A "Saving..." indicator appears briefly in the toolbar during auto-save. Changes to "Saved ✓" on success.
4. Manual save button (Ctrl+S) triggers an immediate save regardless of modification state.
5. If auto-save fails (network error), show a toast: "Auto-save failed. Your changes are preserved locally. Retrying..." and retry after 10 seconds.
6. On browser/tab close, a `beforeunload` event fires if there are unsaved changes, prompting the user to confirm leaving.

#### Acceptance Criteria
- [ ] Canvas auto-saves every 30 seconds when modified
- [ ] Save status indicator shows "Saving...", "Saved ✓", or "Unsaved changes"
- [ ] Ctrl+S triggers immediate save
- [ ] Failed saves show error toast and retry
- [ ] beforeunload prompt fires on unsaved changes
- [ ] Reopening a project restores the exact canvas state from the last save

---

### F8: Bezier Curve Tool
**Module:** Canvas
**Phase:** 5
**User Story:** As a quilter, I want to draw curved seams (like Drunkard's Path or double wedding ring) so that I can create blocks with curves.
**Permissions:** Pro only

#### Processing Logic
1. Bezier Curve tool is activated from the toolbar.
2. User clicks to place anchor points. Between anchor points, two control point handles appear.
3. User drags control point handles to bend the curve.
4. Double-click ends the path.
5. The resulting SVG path is stored as a Fabric.js `Path` object.
6. Curves snap to grid when snap-to-grid is enabled (anchor points snap, control points do not).
7. Existing curves can be edited by double-clicking to re-enter edit mode, showing anchor and control points.

#### Acceptance Criteria
- [ ] Click-to-place anchor points with drag-to-bend control handles
- [ ] Double-click closes the path
- [ ] Resulting path is a Fabric.js Path object with proper SVG data
- [ ] Curves can be filled with colors or fabric patterns
- [ ] Existing curves can be re-edited by entering edit mode
- [ ] Snap-to-grid works on anchor points

---

### F9: Custom Context Menu
**Module:** Canvas
**Phase:** 5
**User Story:** As a quilter, I want to right-click a shape for quick actions so that I can work faster.
**Permissions:** Pro only

#### Processing Logic
1. Right-click on a selected canvas object intercepts the browser's default context menu.
2. A custom floating React component renders at the cursor X/Y position.
3. Menu items: **Duplicate**, **Delete**, **Flip Horizontal**, **Flip Vertical**, **Rotate 90°**, **Send to Back**, **Bring to Front**, **Add to Printlist** (opens quantity input).
4. "Add to Printlist" shows an inline number input. User enters quantity, clicks confirm. Shape data + quantity is pushed to `printlistStore`.
5. Clicking outside the menu or pressing Escape closes it.
6. Right-clicking on empty canvas shows a reduced menu: **Paste** (if clipboard has content), **Select All**.

#### Acceptance Criteria
- [ ] Right-click on object shows context menu at cursor position
- [ ] All menu actions (duplicate, delete, flip, rotate, layer order) function correctly
- [ ] "Add to Printlist" prompts for quantity and adds to printlist store
- [ ] Menu closes on outside click or Escape
- [ ] Browser default context menu is suppressed on canvas
- [ ] Right-click on empty canvas shows reduced menu

---

### F10: Quick-Info Inspector Panel
**Module:** Canvas
**Phase:** 5
**User Story:** As a quilter, I want to see the exact dimensions and angles of a selected shape so that I can ensure precision.
**Permissions:** Pro only

#### Processing Logic
1. When a canvas object is selected, a floating panel appears near the selection (positioned to not overlap the object).
2. Panel displays: width, height, area (square inches or square cm), rotation angle, X/Y position on canvas.
3. All values are in the active unit system and update in real-time as the object is moved/resized/rotated.
4. Values are editable — user can type exact dimensions to resize a shape precisely.
5. Panel hides when no object is selected.

#### Acceptance Criteria
- [ ] Panel appears on object selection, hides on deselection
- [ ] Displays width, height, area, rotation, position in active units
- [ ] Values update in real-time during manipulation
- [ ] Typing a value resizes/repositions the object
- [ ] Panel does not overlap the selected object

---

### F11: Block Library Browser
**Module:** Blocks
**Phase:** 4
**User Story:** As a quilter, I want to browse and search a library of pre-drawn quilt blocks so that I can use classic patterns in my designs.
**Permissions:** Free (100 blocks), Pro (full library)

#### Processing Logic
1. A slide-out side panel (left side) opens via a toolbar button.
2. The panel displays block thumbnails in a scrollable grid layout.
3. A search bar at the top filters blocks by name and tags (using trigram/fuzzy matching).
4. Category filter dropdown narrows results by category (Traditional, Modern, Stars, etc.).
5. Free users see only the first 100 blocks. Remaining blocks show a lock icon with "Upgrade to Pro" overlay.
6. Each block thumbnail shows the block name below it.
7. Clicking a block thumbnail shows a larger preview with metadata (name, category, tags).

#### Acceptance Criteria
- [ ] Side panel opens/closes smoothly (Framer Motion slide animation)
- [ ] Blocks display as a thumbnail grid with names
- [ ] Search filters by name and tags in real-time
- [ ] Category dropdown filters blocks
- [ ] Free users see 100 blocks, locked overlay on remaining
- [ ] Block preview shows on click with metadata

---

### F12: Drag-to-Canvas from Library
**Module:** Blocks
**Phase:** 4
**User Story:** As a quilter, I want to drag a block from the library directly onto my canvas so that I can place it exactly where I want.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. User initiates a drag on a block thumbnail in the library panel.
2. A ghost preview of the block follows the cursor.
3. On drop over the canvas, the block's Fabric.js data is deserialized and placed at the drop coordinates.
4. If snap-to-grid is enabled, the block snaps to the nearest grid intersection.
5. The block is added as a Fabric.js group of objects, maintaining its internal geometry.
6. Canvas undo state is updated.

#### Acceptance Criteria
- [ ] Drag from library panel initiates with ghost preview
- [ ] Drop on canvas places the block at cursor position
- [ ] Block snaps to grid if enabled
- [ ] Block is selectable, movable, resizable after placement
- [ ] Block maintains internal geometry as a Fabric.js group
- [ ] Undo reverts the block placement

---

### F13: Custom Block Drafting
**Module:** Blocks
**Phase:** 5
**User Story:** As a quilter, I want to draw my own original blocks from scratch so that I can create unique designs.
**Permissions:** Pro only

#### Processing Logic
1. "New Block" mode opens a dedicated block editing canvas (separate from the main quilt canvas).
2. Block canvas has a configurable size (e.g., 12" × 12" default).
3. User draws shapes using all available tools (rectangles, triangles, polygons, Bezier curves, lines).
4. "Save Block" serializes all objects as a single block template, generates a thumbnail, and saves to the `blocks` table with `isDefault: false` and the user's `userId`.
5. Saved custom blocks appear in the library panel under a "My Blocks" section.
6. Custom blocks can be edited later by re-opening in block edit mode.

#### Acceptance Criteria
- [ ] "New Block" opens a dedicated block editing canvas
- [ ] All drawing tools are available in block edit mode
- [ ] "Save Block" saves to database and generates a thumbnail
- [ ] Custom blocks appear in "My Blocks" section of the library
- [ ] Custom blocks can be dragged to the main canvas like system blocks
- [ ] Custom blocks can be re-edited

---

### F14: Fabric Upload & Processing
**Module:** Fabric
**Phase:** 6
**User Story:** As a quilter, I want to upload photos of my real fabric so that I can preview how my quilt will look with my actual materials.
**Permissions:** Pro only

#### Processing Logic
1. "Import Fabric" button opens a file picker (accepts .jpg, .png, .webp — max 10MB).
2. Selected image is displayed in a processing dialog with tools: crop (rectangular selection), scale (slider 50%–200%), straighten (rotation slider -45° to +45°).
3. Processed image is uploaded to S3 via presigned URL.
4. A thumbnail (200×200px) is generated client-side and also uploaded to S3.
5. Fabric record is saved to the `fabrics` table with S3 URLs, user ID, and processing parameters.
6. Fabric appears in the user's "My Fabrics" section of the fabric library.

#### Acceptance Criteria
- [ ] File picker accepts jpg, png, webp up to 10MB
- [ ] Crop tool allows rectangular selection
- [ ] Scale slider adjusts image scale
- [ ] Straighten slider rotates image
- [ ] Processed image uploads to S3
- [ ] Thumbnail is auto-generated
- [ ] Fabric appears in "My Fabrics" library section

---

### F15: Pattern Fill Mapping
**Module:** Fabric
**Phase:** 6
**User Story:** As a quilter, I want to fill shapes with my fabric images so that I can see a realistic preview of my quilt.
**Permissions:** Pro only

#### Processing Logic
1. User selects a shape on the canvas.
2. User clicks "Apply Fabric" or drags a fabric from the fabric library onto the shape.
3. The fabric image is loaded from S3/CloudFront and applied as a Fabric.js pattern fill.
4. The pattern repeats/tiles to fill the shape bounds.
5. Pattern scale, rotation, and offset can be adjusted via the properties panel.
6. The fabric assignment is stored in the canvas JSON data (Fabric.js serialization captures pattern fills).

#### Acceptance Criteria
- [ ] Clicking a shape then selecting a fabric applies pattern fill
- [ ] Dragging a fabric onto a shape applies pattern fill
- [ ] Pattern tiles to fill the shape
- [ ] Pattern scale, rotation, and offset are adjustable
- [ ] Pattern fill persists through save/reload

---

### F16: Layout Presets (Grid/Sashing/On-Point)
**Module:** Layout
**Phase:** 7
**User Story:** As a quilter, I want to choose a layout style (grid, sashing, on-point) so that my blocks are automatically arranged in a traditional quilt pattern.
**Permissions:** Pro only

#### Processing Logic
1. "Layout" panel in the toolbar offers preset options: Grid, Sashing, On-Point.
2. **Grid:** Blocks are arranged in a regular rows × columns grid. User specifies rows, columns, and block size. The engine generates a grid of placeholder cells on the canvas.
3. **Sashing:** Same as Grid but with configurable sashing strips (width and color/fabric) between blocks.
4. **On-Point:** Blocks are rotated 45° and arranged in a diamond pattern. Setting triangles fill the edges.
5. User drops blocks into the generated placeholder cells.
6. Changing layout settings re-arranges existing blocks into the new layout.

#### Acceptance Criteria
- [ ] Grid layout generates rows × columns of placeholder cells
- [ ] Sashing layout adds configurable strips between cells
- [ ] On-Point layout rotates blocks 45° with setting triangles
- [ ] Blocks can be dropped into placeholder cells
- [ ] Changing layout re-arranges existing blocks
- [ ] Layout settings (rows, columns, sashing width) are adjustable

---

### F17: Auto-Complete Symmetry Engine
**Module:** Generators
**Phase:** 8
**User Story:** As a quilter, I want to design one quadrant and have the app mirror it to complete the full block so that I can create symmetrical designs quickly.
**Permissions:** Pro only

#### Processing Logic
1. "Auto-Complete" mode is activated from the toolbar.
2. User selects the symmetry type: X-axis mirror, Y-axis mirror, Quadrant (both axes), Radial (N-fold rotational, user sets N from 2–12), or Diagonal.
3. The canvas is visually divided into zones (e.g., 4 quadrants for Quadrant mode). A highlight marks the "active" zone.
4. User designs in the active zone only.
5. On "Apply Symmetry" button press: the engine duplicates all objects in the active zone, applies the mathematical transformations (reflection matrices and/or rotation matrices), and places the duplicated objects in the corresponding zones.
6. The resulting objects are ungrouped and fully editable.
7. Undo reverts the entire symmetry operation in one step.

#### Acceptance Criteria
- [ ] Symmetry types: X-mirror, Y-mirror, Quadrant, Radial (2–12), Diagonal
- [ ] Active zone is visually highlighted
- [ ] "Apply Symmetry" duplicates and transforms objects correctly
- [ ] Resulting objects are ungrouped and editable
- [ ] Undo reverts the full operation
- [ ] Radial symmetry with N=4 produces identical results to Quadrant mode

---

### F18: Serendipity Block Generator
**Module:** Generators
**Phase:** 8
**User Story:** As a quilter, I want to combine two blocks to generate new, unique block variations so that I can discover unexpected designs.
**Permissions:** Pro only

#### Processing Logic
1. User selects two blocks (from library or canvas).
2. "Serendipity" button activates the generator.
3. The engine extracts the polygon geometry from both blocks.
4. Using the `polygon-clipping` library, it computes: intersection, union, difference (A-B), and difference (B-A).
5. Each result is rendered as a new block preview in a results panel (4 variations shown).
6. User can click a variation to preview it larger, then "Save to Library" to add it as a custom block or "Add to Canvas" to place it directly.
7. Generated blocks store their parent block IDs in metadata for provenance.

#### Acceptance Criteria
- [ ] Two blocks can be selected for combination
- [ ] Four variations are generated (intersection, union, A-B, B-A)
- [ ] Variations render correctly as preview thumbnails
- [ ] "Save to Library" saves as a custom block
- [ ] "Add to Canvas" places the variation on the canvas
- [ ] Generated blocks track parent block IDs

---

### F19: Yardage Estimator
**Module:** Measurement
**Phase:** 9
**User Story:** As a quilter, I want the app to calculate how much fabric I need for my quilt so that I can shop accurately.
**Permissions:** Pro only

#### Processing Logic
1. "Yardage" panel calculates fabric requirements based on the current canvas design.
2. The engine groups all shapes by their assigned fabric/color.
3. For each fabric group: sum the total surface area of all shapes using that fabric.
4. Apply a waste margin factor (default 10%, user-adjustable 5%–25%).
5. Calculate yardage based on user-selected fabric width: standard WOF (42", 44", 45", 54", 60") or Fat Quarter (18" × 22").
6. Display results as a table: Fabric Name | Total Area | Yardage Required (with waste) | Fat Quarters Required.
7. Results update in real-time as the design changes.
8. Include border fabric in calculations if borders are applied.

#### Acceptance Criteria
- [ ] All shapes are grouped by fabric/color
- [ ] Total area per fabric is calculated correctly
- [ ] Yardage calculation respects selected WOF
- [ ] Fat quarter alternative is displayed
- [ ] Waste margin is configurable (5%–25%)
- [ ] Results update when design changes
- [ ] Border fabric is included in calculations

---

### F20: Printlist Queue
**Module:** Export
**Phase:** 10
**User Story:** As a quilter, I want to curate a list of specific shapes with quantities so that I can print only the cutting templates I need.
**Permissions:** Pro only

#### Processing Logic
1. "Add to Printlist" action (via context menu) pushes shape data to `printlistStore`.
2. Each printlist item contains: shape SVG data, shape name, requested quantity, seam allowance setting (default ¼", configurable).
3. A "Printlist" panel shows all queued items with thumbnails, quantities (editable), and seam allowance per item.
4. Items can be removed from the printlist.
5. "Generate PDF" button triggers the 1:1 PDF generation from the printlist contents.
6. Printlist is saved to the database (`printlists` table) when the project is saved.

#### Acceptance Criteria
- [ ] Shapes can be added to printlist via context menu with quantity
- [ ] Printlist panel shows all items with thumbnails and quantities
- [ ] Quantities are editable in the panel
- [ ] Seam allowance is configurable per item
- [ ] Items can be removed
- [ ] Printlist persists through save/reload
- [ ] "Generate PDF" triggers PDF export

---

### F21: 1:1 PDF Generation
**Module:** Export
**Phase:** 10
**User Story:** As a quilter, I want to print pattern pieces at exact real-world size so that I can cut fabric accurately.
**Permissions:** Pro only

#### Processing Logic
1. PDF is generated client-side using pdf-lib.
2. Strict unit mapping: 1 physical inch = 72 PDF user space units. This is hard-coded and non-configurable.
3. For each printlist item, the shape is rendered at exact scale with:
   - Solid outline for the cutting line
   - Dashed outline offset outward by the seam allowance amount (calculated by Clipper.js)
   - Shape name and dimensions labeled
4. Auto-packing algorithm fits as many shapes as possible onto standard paper:
   - US Letter: 8.5" × 11" with 0.5" margins → 7.5" × 10" usable area
   - A4: 210mm × 297mm with 12.7mm margins → 184.6mm × 271.6mm usable area
5. Shapes are packed using a bottom-left bin packing algorithm. If a shape doesn't fit, a new page is created.
6. Shapes are duplicated according to the requested quantity before packing.
7. Page 1 includes a mandatory 1" × 1" (or 2.54cm × 2.54cm) validation square with the label "This square should measure exactly 1 inch. If it doesn't, check your printer settings — ensure 'Actual Size' or '100%' is selected."
8. PDF is generated as a Blob and offered for download.

#### Acceptance Criteria
- [ ] 1 inch on screen = 1 inch on paper (verified with physical ruler)
- [ ] Seam allowance renders as dashed outline at correct offset
- [ ] Shapes are auto-packed efficiently onto pages
- [ ] Shapes repeat according to printlist quantities
- [ ] 1" × 1" validation square appears on page 1
- [ ] Supports US Letter and A4 paper sizes
- [ ] Shape names and dimensions are labeled
- [ ] PDF downloads successfully in all major browsers

---

### F22: Image Export
**Module:** Export
**Phase:** 10
**User Story:** As a quilter, I want to export my quilt design as a high-resolution image so that I can share it or submit it to publications.
**Permissions:** Pro only

#### Processing Logic
1. "Export Image" dialog offers DPI options: 72, 150, 300, 600.
2. User selects DPI and file format (PNG or JPEG).
3. Canvas is rendered to a temporary off-screen canvas at the specified DPI (multiplied resolution).
4. Grid lines are excluded from the export.
5. Image is generated as a Blob and offered for download.
6. Filename defaults to `[project-name]-[DPI]dpi.[ext]`.

#### Acceptance Criteria
- [ ] DPI options: 72, 150, 300, 600
- [ ] Format options: PNG, JPEG
- [ ] Exported image dimensions match DPI × canvas size in inches
- [ ] Grid lines are excluded
- [ ] File downloads with descriptive filename

---

### F23: Stripe Subscription Management
**Module:** Payments
**Phase:** 11
**User Story:** As a quilter, I want to subscribe to Pro to unlock all features, and manage my subscription easily.
**Permissions:** Free (upgrade flow), Pro (manage/cancel flow)

#### Processing Logic
1. "Upgrade to Pro" button (visible on all Pro-gated feature lock screens) creates a Stripe Checkout session via `/api/stripe/checkout`.
2. User is redirected to Stripe's hosted checkout page.
3. On successful payment, Stripe sends a `checkout.session.completed` webhook to `/api/stripe/webhook`.
4. Webhook handler creates/updates the `subscriptions` record and sets `users.role` to `pro`.
5. User is redirected back to the app with a success toast.
6. "Manage Subscription" in the user profile opens a Stripe Customer Portal session for plan changes, payment method updates, and cancellation.
7. Stripe webhooks handle: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
8. On cancellation: subscription status updates to `canceled`, user retains Pro access until `currentPeriodEnd`, then role reverts to `free`.
9. On payment failure: subscription status updates to `past_due`, user receives in-app notification, Pro access continues for a grace period of 7 days.

#### Acceptance Criteria
- [ ] "Upgrade to Pro" creates Stripe Checkout session and redirects
- [ ] Successful payment updates user role to Pro
- [ ] Stripe webhooks correctly update subscription records
- [ ] "Manage Subscription" opens Stripe Customer Portal
- [ ] Cancellation allows access until period end, then reverts to free
- [ ] Payment failure triggers notification and 7-day grace period

---

### F24: Free/Pro Tier Gating
**Module:** Payments
**Phase:** 11
**User Story:** As a free user, I want to see what Pro features exist (with clear upgrade prompts) so that I understand the value of upgrading.
**Permissions:** System-wide

#### Processing Logic
1. Every Pro-only feature checks the user's role from the session/Zustand store.
2. If user is `free` and attempts a Pro feature: the feature UI is replaced with a lock overlay showing the feature name, a brief description of what it does, and an "Upgrade to Pro" button.
3. The block library shows 100 blocks to free users. Remaining blocks show a lock icon.
4. The fabric library, layout presets, generators, yardage estimator, printlist, PDF export, image export, community posting, custom block drafting, Bezier tool, context menu, and Quick-Info panel all show lock overlays for free users.
5. Free users can: create projects, use basic shapes, use the grid, zoom/pan, undo/redo, save projects (up to 3), browse community board, and use the fraction calculator.
6. Free project limit: when a free user tries to create a 4th project, show "You've reached the free plan limit of 3 projects. Upgrade to Pro for unlimited projects."

#### Acceptance Criteria
- [ ] All Pro features show lock overlays for free users
- [ ] Lock overlays include feature description and upgrade button
- [ ] Block library limits free users to 100 blocks
- [ ] Free users can create up to 3 projects
- [ ] 4th project attempt shows upgrade prompt
- [ ] Upgrade button navigates to Stripe checkout

---

### F25: Community Board
**Module:** Community
**Phase:** 12
**User Story:** As a quilter, I want to browse designs shared by other quilters so that I can get inspiration.
**Permissions:** Browse: Free, Pro, Guest | Post: Pro only | Moderate: Admin only

#### Processing Logic
1. Community board is a public page (no auth required to browse).
2. Displays approved community posts as a card grid (masonry layout).
3. Each card shows: thumbnail, title, creator name, like count.
4. Sorting options: Newest, Most Liked.
5. Search bar filters posts by title (basic substring match).
6. Clicking a card opens a detail view: larger thumbnail, full description, like count, creator name.
7. **Posting (Pro only):** "Share to Community" button on a project opens a dialog. User enters a title and description. A thumbnail is auto-generated from the canvas and uploaded to S3. A `community_posts` record is created with status `pending`.
8. **Liking (logged-in users only):** Heart icon on each card. Click to like (creates `likes` record, increments `likeCount`). Click again to unlike (deletes `likes` record, decrements `likeCount`). Guests see the like count but cannot click.
9. **Admin moderation:** Admin panel shows all posts with status `pending`. Admin can approve (sets status to `approved`, post appears on board, notification sent to poster) or reject (sets status to `rejected`, notification sent to poster).

#### Acceptance Criteria
- [ ] Community board is publicly browsable without login
- [ ] Posts display as card grid with thumbnail, title, creator, likes
- [ ] Sorting by newest and most liked works
- [ ] Search filters by title
- [ ] Pro users can share projects with title and description
- [ ] New posts start as "pending" until admin approves
- [ ] Like/unlike toggles correctly with count update
- [ ] Guests see likes but cannot interact
- [ ] Admin panel shows pending posts with approve/reject actions
- [ ] Notifications sent on approve/reject

---

### F26: Slide-Out Fraction Calculator
**Module:** Measurement
**Phase:** 9
**User Story:** As a quilter, I want a quick calculator for adding fractions (like 5/8" + 1/4") so that I can do quilting math without leaving the app.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. Calculator icon in the toolbar opens a slide-out drawer (Framer Motion, slides from the right).
2. Calculator has two input modes: fraction (e.g., "5/8") and decimal (e.g., "0.625").
3. Operations: add, subtract, multiply, divide.
4. Input accepts mixed numbers (e.g., "2 1/4") and improper fractions (e.g., "9/4").
5. Result displays in both fraction and decimal form.
6. "Convert" button converts between inches and centimeters.
7. Calculator closes on Escape or clicking outside.

#### Acceptance Criteria
- [ ] Slide-out opens/closes with smooth animation
- [ ] Accepts fractions, mixed numbers, and decimals
- [ ] All four operations produce correct results
- [ ] Results shown in both fraction and decimal
- [ ] Unit conversion between inches and cm
- [ ] Closes on Escape or outside click

---

### F27: In-App Notification System
**Module:** Notifications
**Phase:** 13
**User Story:** As a user, I want to see notifications when important things happen (post approved, subscription change) so that I stay informed.
**Permissions:** Free, Pro, Admin

#### Processing Logic
1. Bell icon in the top nav bar shows unread count badge.
2. Clicking the bell opens a dropdown panel listing recent notifications (newest first, max 20 displayed).
3. Each notification shows: icon (by type), title, message, timestamp, read/unread indicator.
4. Clicking a notification marks it as read and navigates to the relevant page (e.g., approved community post).
5. "Mark all as read" button at the top of the panel.
6. Notifications are fetched on page load and polled every 60 seconds.

#### Acceptance Criteria
- [ ] Bell icon shows unread count badge
- [ ] Dropdown lists notifications sorted by newest
- [ ] Clicking a notification marks it as read
- [ ] "Mark all as read" clears all unread indicators
- [ ] Notifications link to relevant pages
- [ ] Polling refreshes notifications every 60 seconds
