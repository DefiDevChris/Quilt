export interface Worktable {
  id: string;
  name: string;
  canvasData: Record<string, unknown>;
  order: number;
}

/**
 * One-shot setup payload written by the New Project wizard into
 * `project.canvasData.initialSetup`. The studio bootstrap reads it on
 * first mount, hydrates the relevant stores, and then clears it.
 */
export type InitialSetupConfig =
  | {
      kind: 'layout';
      presetId: string;
      blockSize: number;
      rotated: boolean;
    }
  | {
      kind: 'template';
      templateId: string;
      templateData: unknown;
      blockSize: number;
      rotated: boolean;
    };

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  canvasData: Record<string, unknown> & { initialSetup?: InitialSetupConfig };
  worktables: Worktable[];
  unitSystem: 'imperial' | 'metric';
  gridSettings: GridSettings;
  fabricPresets?: Array<{ id: string; name: string; imageUrl: string }>;
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl: string | null;
  isPublic: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
}
