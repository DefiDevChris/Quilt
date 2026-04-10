/**
 * One-shot setup payload written by the New Project wizard into
 * `project.canvasData.initialSetup`. The studio bootstrap reads it on
 * first mount, hydrates the relevant stores, and then clears it.
 */
export type InitialSetupConfig = {
  kind: 'layout';
  presetId: string;
  blockSize: number;
  rotated: boolean;
};

export interface Worktable {
  id: string;
  name: string;
  canvasData: Record<string, unknown>;
  order: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  canvasData: Record<string, unknown> & { initialSetup?: InitialSetupConfig };
  worktables: Worktable[];
  unitSystem: 'imperial' | 'metric';
  gridSettings: import('./grid').GridSettings;
  fabricPresets?: Array<{ id: string; name: string; imageUrl: string }>;
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl: string | null;
  isPublic: boolean;
  /** Which worktable mode is active: 'quilt' (main canvas) or 'block-builder'. */
  activeWorktable?: 'quilt' | 'block-builder';
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type { GridSettings } from './grid';
