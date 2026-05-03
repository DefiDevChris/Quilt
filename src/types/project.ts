import type { UnitSystem, GridSettings } from './grid';

/**
 * One-shot setup payload written by the New Project wizard into
 * `project.canvasData.initialSetup`. The studio bootstrap reads it on
 * first mount, hydrates the relevant stores, and then clears it.
 */
type InitialSetupConfig = {
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

export type ProjectMode = 'free-form' | 'layout' | 'template' | 'photo-to-quilt';

export interface FabricPreset {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  mode: ProjectMode;
  canvasData: Record<string, unknown> & {
    initialSetup?: InitialSetupConfig;
  };
  worktables: Worktable[];
  unitSystem: UnitSystem;
  gridSettings: GridSettings;
  gridGranularity?: 'inch' | 'half' | 'quarter' | null;
  fabricPresets?: FabricPreset[];
  canvasWidth: number;
  canvasHeight: number;
  thumbnailUrl: string | null;
  version: number;
  canvasDataS3Key?: string | null;
  worktablesS3Key?: string | null;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

