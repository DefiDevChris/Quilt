export interface PrintlistItem {
  shapeId: string;
  shapeName: string;
  svgData: string;
  quantity: number;
  seamAllowance: number;
  seamAllowanceEnabled: boolean;
  unitSystem: 'imperial' | 'metric';
  calibratedPpi?: number;
}
