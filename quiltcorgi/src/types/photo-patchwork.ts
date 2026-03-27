import type { RGB } from '@/lib/color-math';

export interface PhotoPatchworkConfig {
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly colorCount: number;
  readonly maxIterations?: number;
}

export interface ColorCluster {
  readonly centroid: RGB;
  readonly hex: string;
  readonly pixelCount: number;
  readonly percentage: number;
}

export interface PatchworkCell {
  readonly row: number;
  readonly col: number;
  readonly color: string;
  readonly clusterId: number;
  readonly fabricId?: string;
  readonly fabricName?: string;
}

export interface PatchworkGrid {
  readonly rows: number;
  readonly cols: number;
  readonly cells: readonly PatchworkCell[];
  readonly palette: readonly ColorCluster[];
  readonly totalPatches: number;
}

export interface FabricMapping {
  readonly clusterId: number;
  readonly clusterHex: string;
  readonly fabricId: string;
  readonly fabricName: string;
}
