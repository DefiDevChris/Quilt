/**
 * Fence system types for the quilt layout fence overlay.
 *
 * FenceArea is a discriminated union keyed by `role` — each variant
 * declares only the fields that are meaningful for that role.
 * Consumers can narrow with `area.role === 'block-cell'` etc.
 */

export type FenceArea =
  | {
      role: 'block-cell';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      row: number;
      col: number;
      rotation?: number;
      assignedFabricId: string | null;
      assignedBlockId?: string | null;
    }
  | {
      role: 'sashing' | 'cornerstone' | 'binding';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      assignedFabricId: string | null;
    }
  | {
      role: 'border';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      borderIndex: number;
      assignedFabricId: string | null;
    }
  | {
      role: 'setting-triangle';
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label: string;
      points: Array<{ x: number; y: number }>;
      triangleType: 'side' | 'corner';
      assignedFabricId: string | null;
    };
