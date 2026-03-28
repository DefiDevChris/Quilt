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
}
