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
  canvasData: Record<string, unknown>;
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
