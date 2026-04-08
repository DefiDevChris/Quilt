# Design Studio — Architecture Overview

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ StudioTopBar                                                            │
│ [☰] QuiltCorgi │ [Viewport Lock] │ Project Name [*] │ [Save] [Help]    │
├─────────────────────────────────────────────────────────────────────────┤
│ WorktableTabs │ [Grid 3×3] [+ New Worktable]                           │
├──────┬──────────────────────────────────┬───────────────────────────────┤
│      │                                  │  ContextPanel (320px)         │
│ Tool │  CanvasWorkspace                 │                               │
│ bar  │  + Grid overlay                  │  Library Tabs                 │
│ 88px │  + Layout fence areas            │   Layouts │ Blocks │ Fabrics   │
│      │  + User-placed blocks & fabrics  │                               │
│      │  + Reference image (split pane)  │                               │
│      │                                  │                               │
│      │  ┌────────────────────────────┐  │                               │
│      │  │ FloatingToolbar (bottom)   │  │                               │
│      │  │ [Select] [Pan] │ ↶ ↷      │  │                               │
│      │  └────────────────────────────┘  │                               │
├──────┴──────────────────────────────────┴───────────────────────────────┤
│ BottomBar                                                               │
│ H: 12.5"  V: 8.0" │ 2 objects selected │ Snap: ON │ Nodes: OFF         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Type Unions

### ToolType (7 tools — shared across all worktables)
| Tool | Shortcut | Description |
|------|----------|-------------|
| `select` | `V` | Select, move, resize objects |
| `pan` | `H` | Pan the canvas viewport (or hold Space) |
| `rectangle` | `R` | Draw rectangles |
| `circle` | — | Draw circles |
| `triangle` | — | Draw triangles |
| `polygon` | `P` | Draw polygons (click points, click start to close) |
| `easydraw` | `E` | Freehand drawing, grid-snapped |

**Removed (legacy):** `eyedropper`, `spraycan`, `blockbuilder`, `text`, `line`, `bend`, `curve`

### WorktableType
| Type | Role |
|------|------|
| `quilt` | Main quilt design worktable |
| `block-builder` | Draft custom blocks (dedicated 400×400 canvas) |
| `layout-creator` | Create layout templates |

### FenceAreaRole (fence renderer roles)
`block-cell` · `sashing` · `cornerstone` · `border` · `binding` · `edging`

**Note:** `setting-triangle` is a `LayoutAreaRole` in the type definition but is NOT rendered by `useFenceRenderer`.

### Drag-Drop MIME Types
| MIME Type | Payload | Source | Target |
|-----------|---------|--------|--------|
| `application/quiltcorgi-layout-preset` | Layout preset ID | LayoutSelector cards | StudioDropZone → new worktable tab |
| `application/quiltcorgi-block-id` | Block UUID | BlockLibrary cards | useBlockDrop → snaps to block-cell |
| `application/quiltcorgi-fabric-id` | Fabric UUID | FabricLibrary swatches | useFabricDrop → pattern fill |
| `application/quiltcorgi-fabric-url` | Fabric image URL | FabricLibrary swatches | (alongside fabric-id) |
| `application/quiltcorgi-fabric-name` | Fabric display name | FabricLibrary swatches | (alongside fabric-id) |

---

## 2. StudioTopBar

| Control | Action |
|---------|--------|
| **Hamburger menu** | Opens slide-out drawer with navigation links |
| **QuiltCorgi logo** | Branding |
| **Project info** | Shows project name, `*` dirty indicator |
| **Viewport controls** | Viewport Lock, Recenter, zoom |
| **Quilt Settings dropdown** | Quick access to dimensions, grid, units |
| **Save** | Saves current project |
| **Help** | Opens help panel |
| **History** | Opens undo/redo history browser |
| **Export (Image/PDF)** | Opens export dialogs (via Toolbar, not TopBar) |

---

## 3. Left Toolbar (88px) — Quilt Mode

The quilt toolbar is intentionally minimal. Drawing tools (rectangle, circle, triangle, polygon, easydraw) are available as `ToolType` values but are **not** rendered in the quilt toolbar — they are handled by `useDrawingTool` and `usePolygonTool` hooks.

| Tool | Action |
|------|--------|
| **Select** | Select, move, resize objects |
| **Pan** | Click-drag to pan canvas |
| ───── | |
| **Yardage Estimator** | Opens fabric yardage calculation panel (Pro) |
| **Printlist** | Opens materials list, generate printable PDF (Pro) |
| **Export Image** | Save design as high-res image |
| ───── | |
| **Undo** | Revert last action (Ctrl+Z) |
| **Redo** | Reapply last undone action (Ctrl+Shift+Z) |

**Note:** Grid toggle (`G`), Snap toggle (`S`), Reference Image, and Pattern Overlay are NOT toolbar buttons. They are controlled via keyboard shortcuts and the Quilt Settings dropdown.

---

## 4. Left Toolbar — Block Builder Mode

Inside BlockBuilderWorktable (dedicated drafting environment):

| Tool | Action |
|------|--------|
| **Select** | Select shapes on 400×400 canvas |
| **Rectangle** | Draw rectangles |
| **Polygon** | Click to place points, click start to close |
| **Undo / Redo** | History navigation |
| **Save Block** | POST to `/api/blocks` |
| **New Block** | Clear canvas, start fresh |

---

## 5. WorktableTabs

Horizontal tab bar above the canvas. **One layout per worktable.**

| Element | Behavior |
|---------|----------|
| **Tab label** | Layout name (e.g. "Grid 3×3") or custom name |
| **Active state** | Primary-colored background + border |
| **Click** | Switches worktable, restores layout snapshot |
| **Close (×)** | Appears on hover. Removes tab. If active, switches to last remaining |
| **+ New Worktable** | Creates quilt tab (`layoutSnapshot: null`) |

**Layout switching behavior:**
- Dropping a layout preset always creates a **new** worktable tab — it never overwrites the current one.

---

## 6. CanvasWorkspace

Dual canvas (grid z:0, fabric z:1). **Never unmounted** — preserves pan/zoom.

### Hooks Mounted
| Hook | Role |
|------|------|
| `useCanvasInit` | Creates Fabric.js canvas, wires selection events |
| `useDrawingTool` | Handles select mode and drawing tools (rect, circle, triangle, easydraw) |
| `usePolygonTool` | Polygon creation and editing |
| `useCanvasZoomPan` | Mouse wheel zoom, pan gestures |
| `useCanvasKeyboard` | Keyboard shortcut handling |
| `useFenceRenderer` | Draws layout fence areas as selectable Fabric rects |
| `useAutoSave` | Periodic project save (30s interval) |
| `useBeforeUnload` | Browser close warning if project is dirty |

### FloatingToolbar (bottom-center)
Glassmorphic bar with quick-access tools by worktable. Rendered in `StudioDropZone.tsx`.

### ContextMenu (right-click)
Position-aware popup. Rendered in `StudioDropZone.tsx`.

### QuickInfo (hover)
Floating panel showing W, H, Area, Rotation, X, Y — all clickable to edit inline. Rendered in `StudioDropZone.tsx`.

---

## 7. ContextPanel (Right, 320px)

### Library Tabs (3 tabs)

#### Layouts Tab
`<LayoutSelector />` — Grid of presets grouped by category:

| Category | Presets |
|----------|---------|
| **Grid** | Grid 3×3, Grid 4×4, Grid 5×5 |
| **Sashing** | Sashing 3×3, Sashing 4×4, Sashing 5×5 + Border |
| **On-Point** | On-Point 3×3, On-Point 4×4, On-Point 5×5 + Border |

Each card: SVG thumbnail + name + description on hover + active indicator.

**On drag:** Creates a NEW worktable tab with the layout as its fence. Always creates a new tab — never overwrites the current one.

#### Blocks Tab
`<BlockLibrary />` — Two sub-tabs:
- **Library:** System blocks grid (3 columns), pagination, click → preview modal
- **My Blocks:** Filter chips (All/Custom/Photo), user blocks with delete, "+ Draft Block" / "+ Photo Block" (Pro)

#### Fabrics Tab
`<FabricLibrary />` — Four sub-tabs:
- **Library:** 2,764 system fabrics, 3-column grid, pagination
- **Presets:** Project-level fabric presets
- **My Fabrics:** User uploads with delete, "+ Import Fabric" (Pro)
- **Shop:** Purchasable shop fabrics (when shop enabled), Add to Cart

### Inspector — Removed

The selection-driven inspector panel (BOTTOM 50%) was intentionally removed from `ContextPanel`. The inspector component files still exist in `src/components/studio/inspectors/` but are **not wired into the studio**. `ContextPanel.tsx` renders only the library tabs — no inspector section.

---

## 8. BottomBar

| Left | Right |
|------|-------|
| Mouse H/V (in current units) | Snap to Grid: ON/OFF (green when on) |
| Selection count: shown only when >1 selected | Snap to Nodes: ON/OFF (green when on) |

---

## 9. Block Builder Worktable

Dedicated drafting environment (400×400 canvas).

```
┌──────────┬─────────────────────┬───────────────────────────┐
│ Left     │  400×400 Canvas     │  Right: Block Library     │
│ (280px)  │  + Grid overlay     │  "My Blocks" (280px)      │
│          │  + Overlay (opt)    │  Drag to quilt worktable  │
│ [← Back] │                     │                           │
│          │                     │                           │
│ Freeform │ BlockBuilder        │                           │
│ (mode tabs)                      │                           │
│ Mode toolbar                   │                           │
│ [Add Overlay] [Clear]          │                           │
│ Opacity: ───●─── 30%           │                           │
│ Block Name: [______]           │                           │
│ W: [12] H: [12] (inches)      │                           │
│ Category: [Custom]             │                           │
│ Tags: [modern, stars]          │                           │
│ [↶ Undo] [Clear] [Save Block]  │                           │
└──────────┴─────────────────────┴───────────────────────────┘
```

### BlockBuilderMode (planar graph engine, in BlockBuilderWorktable)
| Mode | Behavior |
|------|----------|
| `freedraw` | Draw grid-snapped segments; auto-detects enclosed patches |
| `rectangle` | Draw rectangle aligned to grid |
| `triangle` | Draw triangle aligned to grid |
| `curve` | Draw bezier curves |
| `bend` | Select existing segment, drag to bend/curve it |

**Note:** `curve` and `bend` exist as `BlockBuilderMode` (block drafting context) but were removed from `ToolType` (quilt worktable context). They are separate type unions.

**BlockDraftingMode** (`canvasStore.ts`): `'freeform' | 'blockbuilder'` — this is the store-level mode toggle, distinct from `BlockBuilderMode`.

### Save Flow
1. Validates block name (required)
2. Filters out grid lines and overlay
3. Clones objects into Fabric Group, serializes to `fabricJsData`
4. Generates thumbnail SVG (100×100 viewBox)
5. POSTs to `/api/blocks`
6. On success: resets form, refreshes Block Library

---

## 10. First-Visit Setup

### NewQuiltSetupModal
Triggered on first visit to new quilt worktable with empty canvas (sessionStorage-gated).

| Preset | Width | Height |
|--------|-------|--------|
| Throw | 48" | 60" |
| Twin | 68" | 86" |
| Full | 78" | 86" |
| Queen | 86" | 96" |
| King | 102" | 102" |
| Custom | User input | User input |

### NewBlockSetupModal

The file exists at `src/components/studio/NewBlockSetupModal.tsx` but is **not mounted** in `StudioLayout.tsx`. It was previously triggered on first visit to a block worktable, but that wiring has been removed. Currently only `NewQuiltSetupModal` is active.

---

## 11. Drag-Drop Flow

### Layouts → Canvas
```
LayoutSelector card drag
  → dataTransfer: application/quiltcorgi-layout-preset
  → StudioDropZone.combinedDrop()
    → Always creates NEW worktable tab (never overwrites)
    → layoutStore updated → useFenceRenderer reflows
```

### Blocks → Canvas
```
BlockLibrary card drag
  → dataTransfer: application/quiltcorgi-block-id
  → useBlockDrop.handleDragOver()
    → findTarget() → if over fence block-cell: highlight + copy cursor
    → If not: not-allowed cursor
  → useBlockDrop.handleDrop()
    → Fetches block, deserializes, scales to cell, inherits rotation
    → Removes previous occupant, tags with _inFenceCellId
```

### Fabrics → Layout Areas
```
FabricLibrary swatch drag
  → dataTransfer: { id, url, name }
  → useFabricDrop.handleFabricDragOver()
    → findTarget() → if valid fence role: highlight
  → useFabricDrop.handleFabricDrop()
    → Validates target role, applies Pattern fill
```

---

## 12. State Management

| Store | Key Fields |
|-------|-----------|
| `canvasStore` | `fabricCanvas`, `activeTool`, `activeWorktable`, `worktableTabs`, `activeWorktableId`, `gridSettings`, `zoom`, `selectedObjectIds`, `undoStack`, `redoStack`, `fillColor`, `strokeColor`, `blockDraftingMode`, `referenceImageOpacity`, `isViewportLocked`, `showSeamAllowance`, `printScale`, `easyDrawMode`, `blockBuilderMode`, `toolSettings`, `clipboard`, `backgroundColor` |
| `layoutStore` (`src/stores/layoutStore.ts`) | `layoutType`, `rows`, `cols`, `blockSize`, `sashing`, `borders`, `hasCornerstones`, `bindingWidth`, `selectedPresetId` |
| `projectStore` | `projectId`, `projectName`, `canvasWidth`, `canvasHeight`, `saveStatus`, `fabricPresets` |
| `blockStore` | `blocks`, `userBlocks`, pagination, search, category |
| `fabricStore` | `fabrics`, `userFabrics`, pagination, filters |
| `authStore` | `user`, `isPro` |
| `yardageStore` | `isPanelOpen` — toggles yardage panel visibility |
| `printlistStore` | `isPanelOpen` — toggles printlist panel visibility |

### WorktableTab Structure
```typescript
{
  id: string;              // wt-{timestamp}
  name: string;            // "Grid 3×3"
  type: WorktableType;     // "quilt" | "block-builder" | "layout-creator"
  layoutSnapshot: {        // null = no layout (free-draw)
    layoutType, rows, cols, blockSize,
    sashingWidth, hasCornerstones,
    borders, bindingWidth, selectedPresetId
  } | null;
  createdAt: number;
}
```

---

## 13. Pro-Gated Features

| Feature | Gate | Fallback |
|---------|------|----------|
| Yardage Panel | `isPro` | Hidden |
| Printlist Panel | `isPro` | Hidden |
| Draft Block | `isPro` | Prompt upgrade |
| Photo Block | `isPro` | Prompt upgrade |
| Fabric Import | `isPro` | Prompt upgrade |
| Shop Fabrics | `isPro` + shop enabled | Hidden |
| PDF/Image Export | API-level check | Prompt upgrade |
| Photo-to-Design | API-level check | Prompt upgrade |

**Note:** Block Builder worktable (`activeWorktable === 'block-builder'`) is accessible from the Toolbar without a client-side `isPro` gate in `StudioLayout.tsx`. Pro enforcement happens at the save API endpoint (`POST /api/blocks`).

---

## 14. Keyboard Shortcuts

### Tools
| Shortcut | Action |
|----------|--------|
| `V` | Select |
| `H` | Pan |
| `R` | Rectangle |
| `P` | Polygon |
| `E` | Easydraw |

**Note:** `circle` and `triangle` have no default keyboard shortcut. They are available as `ToolType` values but not bound to keys in `useCanvasKeyboard`.

### Edit
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` / `Backspace` | Delete selected |
| `Escape` | Deselect / close menus |
| `Space` (hold) | Pan mode (temporary) |

### Panels
| Shortcut | Action |
|----------|--------|
| `G` | Toggle grid |
| `S` | Toggle snap to grid |
| `Scroll` | Zoom in/out |

---

## 15. Tag Reference (Fence Renderer)

| Tag | Written By | Read By |
|-----|-----------|---------|
| `_fenceElement` | `useFenceRenderer` | `canvas-selection`, drag handlers |
| `_fenceAreaId` | `useFenceRenderer` | `canvas-selection`, inspectors |
| `_fenceRole` | `useFenceRenderer` | `canvas-selection`, drag handlers, inspectors |
| `_inFenceCellId` | `useBlockDrop` | `canvas-selection`, BlockCellInspector |
| `subTargetCheck` | `useBlockDrop` | Piece-level drop detection |
| `_borderIndex` | `useFenceRenderer` | Border identification |

**Note:** The `_dragHighlight` tag does not exist in the current codebase.

---

## 16. Data Flow

```
User Action
  ↓
Component (Toolbar / Library / Inspector)
  ↓
Store Update (canvasStore / layoutStore / projectStore)
  ↓
Effect Triggers:
  - useFenceRenderer → reflows layout areas → Fabric rects
  - CanvasWorkspace hooks → update drawing state
  ↓
Canvas Render (Fabric.js renderAll)
  ↓
Auto-Save (useAutoSave, 30s debounce)
```

**Key invariants:**
- Canvas is **never unmounted** — pan/zoom preserved across mode changes
- Layout areas are **always sent to back** — user blocks brought to front
- Rerenders **preserve user-applied fills** by area ID
- **One layout per worktable** — changing layout on occupied canvas creates new tab
- Layout drop **always creates a new tab** — never overwrites current worktable
