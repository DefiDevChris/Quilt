export interface PrintlistItem {
  shapeId: string;
  shapeName: string;
  svgData: string;
  quantity: number;
  seamAllowance: number;
  unitSystem: 'imperial' | 'metric';
}

export interface Printlist {
  id: string;
  projectId: string;
  userId: string;
  items: PrintlistItem[];
  paperSize: 'letter' | 'a4';
  createdAt: Date;
  updatedAt: Date;
}
