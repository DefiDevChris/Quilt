/**
 * Fence system types for the quilt layout fence overlay.
 *
 * FenceArea represents a computed zone within the quilt layout that
 * the fence system tracks for drag-drop targeting, fabric assignment,
 * and selection inspection. Unlike LayoutArea (which carries Fabric.js
 * rendering concerns), FenceArea is pure geometry — the single source
 * of truth for "where things can go" in a layout.
 */

export interface FenceArea {
  id: string;
  role: 'block-cell' | 'sashing' | 'cornerstone' | 'border' | 'binding' | 'edging';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  borderIndex?: number;
  row?: number;
  col?: number;
  assignedFabricId?: string | null;
  assignedBlockId?: string | null;
}

export interface FenceLayout {
  templateId: string;
  templateName: string;
  areas: FenceArea[];
}
