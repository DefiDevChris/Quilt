/**
 * Layout Template types for the quilt layout system.
 *
 * These types define layout templates (stored in DB / seed data),
 * layout areas (computed geometry for canvas rendering), and
 * the category taxonomy for quilt layouts.
 */

export type LayoutCategory = 'straight' | 'sashing' | 'on-point' | 'medallion' | 'strippy';

export type LayoutAreaRole =
  | 'block-cell'
  | 'sashing'
  | 'cornerstone'
  | 'border'
  | 'binding'
  | 'edging'
  | 'setting-triangle';

export interface TemplateBorderConfig {
  width: number; // inches
  position: number; // 0 = innermost
}

export interface LayoutTemplate {
  id: string;
  name: string;
  category: LayoutCategory;
  gridRows: number;
  gridCols: number;
  defaultBlockSize: number; // inches
  sashingWidth: number; // inches, 0 = no sashing
  hasCornerstones: boolean;
  borders: TemplateBorderConfig[];
  bindingWidth: number; // inches
  thumbnailSvg: string; // SVG string for preview
}
