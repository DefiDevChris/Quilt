/**
 * Client-side shape for a user-saved layout template.
 *
 * Mirrors the row shape of the `layoutTemplates` Drizzle table but adds
 * the convenience fields the Studio UI needs (canvasWidth/Height,
 * description) which are stored inside `templateData`.
 */
export interface UserLayoutTemplate {
  id: string;
  /** Owning user's id, or null for system-published templates. */
  userId: string | null;
  name: string;
  /** Template category (free-form text, e.g. 'traditional', 'modern', 'custom'). */
  category: string;
  /** Optional human-readable description. */
  description?: string | null;
  /** Pre-rendered SVG thumbnail. May be null for legacy rows. */
  thumbnailSvg: string | null;
  /** Whether this template is publicly visible in the Library tab. */
  isPublished: boolean;
  /** Whether this template is shipped as a default by the platform. */
  isDefault: boolean;
  /** Inches — finished quilt width. */
  canvasWidth: number;
  /** Inches — finished quilt height. */
  canvasHeight: number;
  /**
   * The full template payload: { canvasJson, layoutConfig, dimensions }.
   * Loaded into Fabric on Phase 2 entry via the template-hydration hook.
   */
  templateData: TemplateDataPayload;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Snapshot stored in `layoutTemplates.templateData`.
 *
 * - `canvasJson` is the result of `canvas.toJSON()` from Fabric.js.
 * - `layoutConfig` mirrors the layout-store fields needed to rebuild the
 *   fence overlay on hydration.
 * - `canvasWidth` / `canvasHeight` are the finished quilt dimensions in
 *   inches at save time.
 */
export interface TemplateDataPayload {
  canvasJson: Record<string, unknown>;
  layoutConfig: {
    layoutType: string;
    rows: number;
    cols: number;
    blockSize: number;
    sashing?: { width: number; color?: string; fabricId?: string | null };
    borders?: Array<{ width: number; color?: string; fabricId?: string | null }>;
    hasCornerstones?: boolean;
    bindingWidth?: number;
  };
  canvasWidth: number;
  canvasHeight: number;
}
