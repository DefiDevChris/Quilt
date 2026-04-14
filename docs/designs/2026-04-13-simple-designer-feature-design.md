# Feature: Simple Quilt Designer

## Summary

A simplified quilt designer at `/designer` — a separate route from the main Studio — focused on pre-sewn block arrangement. Users upload images of already-sewn blocks, arrange them on a drag-and-drop grid, and apply fabrics for sashing (spaces between blocks) and borders (area around blocks). Supports realistic rendering via Fabric.js shadows and stitch lines. Pro-gated for save/persistence.

## Requirements

- **Goal**: Pre-sewn planning tool — users have already sewn blocks and want to arrange them visually before final assembly
- **Users**: Desktop users (no mobile) — existing Studio users, beginner quilters, pre-sewn block users
- **Scope**: MVP — upload block images, arrange on canvas, add sashing/border fabrics, export
- **Timeline**: Urgent
- **Route**: New `/designer` route + dashboard button
- **UX**: Significantly stripped down from Studio — just blocks panel, canvas, sashing/border controls
- **Canvas**: Drag & drop grid with snap-to-grid
- **Sashing/Borders**: Full fabric library support
- **Rendering**: Realistic mode via Fabric.js shadows + stitch lines (Option A)
- **Persistence**: Pro users save to DB + S3; Free users session-only
- **Coverage**: Full test coverage (70% lines/functions/statements, 60% branches)

## Architecture

### Route Structure
```
src/app/designer/
  layout.tsx              # Shared layout (BrandedPage wrapper)
  page.tsx                # Designer index — redirects to new or latest
  [designId]/
    page.tsx              # Main designer workspace (server component, auth-gated)
```

### Component Hierarchy
```
src/components/designer/
  DesignerClient.tsx          # Fetches project, wraps in CanvasProvider + StudioDialogsProvider
  DesignerLayout.tsx          # 3-panel: blocks | canvas | sashing/border
  BlockUploadDialog.tsx       # Upload block images from computer
  MobileBlockPicker.tsx       # Pick from mobile uploads
  BlockCropDialog.tsx         # Crop/straighten block images
  SashingBorderPanel.tsx      # Right sidebar: sashing + border config
  LayoutConfigPanel.tsx       # Simple grid config (rows, cols, block size)
  RealisticRenderToggle.tsx   # Toggle shadows/stitch lines
```

### What's REMOVED from Studio
- Drawing tools (polygon, bend, easydraw, rectangle, circle, triangle)
- Reference photo split pane
- Complex layout types (only Grid + Sashing supported)
- Selection panel, printlist panel, minimap, smart guides
- Worktables, project versioning complexity
- Most dialogs (keep only: upload, crop, export)

### What's KEPT/REUSED
- Fabric.js canvas + CanvasContext
- Block drag-and-drop (simplified)
- Fabric drop for sashing/borders
- Fence renderer (simplified)
- Image upload to S3
- Quick-apply fabrics + full fabric library
- Canvas zoom/pan, keyboard navigation

## Data Model

### No new DB tables — reuse existing `projects` table
- `type: 'designer'` to distinguish from Studio projects
- `canvasData` (JSONB): Fabric.js canvas JSON
- `thumbnailUrl`: Auto-generated screenshot

### In-memory state (designerStore.ts)
```typescript
interface DesignerState {
  rows: number;
  cols: number;
  blockSize: number;
  sashingWidth: number;
  sashingFabricId: string | null;
  sashingFabricUrl: string | null;
  borders: Array<{ width: number; fabricId: string | null; fabricUrl: string | null }>;
  userBlocks: Array<{ id: string; imageUrl: string; thumbnailUrl: string; name: string }>;
  realisticMode: boolean;
}
```

### Block images stored in S3
- Upload via existing `/api/upload/presigned-url` with `purpose: 'designer-block'`
- S3 URLs persist across sessions for Pro users

## Realistic Rendering

1. **Drop shadows** between patches: `fabric.Shadow` on block cell borders
2. **Stitch lines**: `fabric.Line` with `strokeDashArray` along sashing borders
3. **Fabric texture jitter**: Randomize pattern offset 1-2px per patch
4. **Border depth**: Cumulative shadows on outer borders

All via Fabric.js built-ins — zero new dependencies.

## API Design

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/designer/projects` | POST | Create designer project | Auth |
| `/api/designer/projects/:id` | GET | Load designer project | Auth |
| `/api/designer/projects/:id` | PUT | Save (Pro only) | Auth, Pro |
| `/api/designer/projects/:id` | DELETE | Delete designer project | Auth |
| `/api/designer/projects` | GET | List user's designer projects | Auth |
| `/api/designer/export/image` | POST | Export as PNG/JPEG | Auth |

Reuses existing `/api/upload/presigned-url`, `/api/blocks`, `/api/fabrics`.

## Error Handling

- Upload failures → toast notification
- Save failures → preserve in-memory state, retry button
- Pro gate on save → 403 → upgrade dialog
- Broken S3 URLs → placeholder + re-upload option
- Performance monitoring → auto-disable realistic mode if FPS drops
- Invalid drag/drop → visual feedback (red highlight, snap back)

## Testing

- **Unit**: designerStore, fence computation, realistic render logic (Vitest)
- **Integration**: Block upload flow, fabric drop (Vitest + MSW)
- **E2E**: Full flow (upload → arrange → apply fabric → export), save/load for Pro, Pro gate for Free, realistic toggle (Playwright)
- **Coverage**: 70% lines/functions/statements, 60% branches

## Implementation Tasks

See implementation task list generated from this design.
