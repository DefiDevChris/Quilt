/**
 * Fence system types for the quilt layout fence overlay.
 *
 * FenceArea represents a computed zone within the quilt layout that
 * the fence system tracks for drag-drop targeting, fabric assignment,
 * and selection inspection. FenceArea is pure geometry — the single source
 * of truth for "where things can go" in a layout.
 */

export interface FenceArea {
  id: string;
  role:
    | 'block-cell'
    | 'sashing'
    | 'cornerstone'
    | 'border'
    | 'binding'
    | 'edging'
    | 'setting-triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  borderIndex?: number;
  row?: number;
  col?: number;
  /** Display label rendered inside the fence area (e.g. "Block", "Sashing", "Border 1") */
  label?: string;
  assignedFabricId?: string | null;
  assignedBlockId?: string | null;
  /**
   * Polygon points for non-rectangular areas (e.g. setting triangles).
   * When present, the renderer should draw a Polygon instead of a Rect.
   */
  points?: Array<{ x: number; y: number }>;
  /** Setting triangle sub-type: 'side' (half-square) or 'corner' (quarter-square) */
  triangleType?: 'side' | 'corner';
}
