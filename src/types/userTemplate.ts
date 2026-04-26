/**
 * UserTemplate — the API/DB-backed version of a quilt template, saved by a
 * user via the "Save as Template" flow in the studio.
 *
 * The shape mirrors what the GET /api/templates endpoint returns from the
 * `layoutTemplates` Drizzle table. Compare with `QuiltTemplate` in
 * `src/lib/templates.ts` — that one is a hard-coded library template
 * shipped with the app; this one is per-user and persisted.
 */
export interface UserTemplate {
  id: string;
  /** Owner — null for system / `isDefault` templates. */
  userId: string | null;
  name: string;
  category: string;
  /** Full template payload mirroring QuiltTemplate (layoutConfig, blocks, fabricAssignments, canvasData, canvasWidth, canvasHeight). */
  templateData: {
    layoutConfig?: {
      type?: string;
      rows?: number;
      cols?: number;
      blockSize?: number;
      sashing?: { width: number; color: string; fabricId?: string | null };
      borders?: Array<{ width: number; color: string; fabricId?: string | null }>;
    };
    canvasData?: Record<string, unknown>;
    canvasWidth?: number;
    canvasHeight?: number;
    fabricAssignments?: Array<{
      fabricId: string | null;
      fillColor?: string;
      target: 'block' | 'sashing' | 'border' | 'background';
    }>;
  };
  thumbnailSvg: string | null;
  isDefault: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}
