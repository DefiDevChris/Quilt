export type UnitSystem = 'imperial' | 'metric';

export interface CanvasState {
  zoom: number;
  unitSystem: UnitSystem;
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  selectedObjectIds: string[];
  panOffset: { x: number; y: number };
}

export interface UndoHistoryEntry {
  canvasJson: string;
  timestamp: number;
}
