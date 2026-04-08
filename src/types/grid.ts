/**
 * Grid Type Definitions
 * Canonical grid settings interfaces used across the codebase.
 */

export interface GridSettings {
  enabled: boolean;
  size: number;
  snapToGrid: boolean;
}

export interface CanvasGridSettings extends GridSettings {
  snapToNodes?: boolean;
}
