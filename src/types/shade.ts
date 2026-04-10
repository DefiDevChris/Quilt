export type Shade = 'dark' | 'light' | 'background' | 'unknown';

export interface ShadeBreakdown {
  readonly dark: number;
  readonly light: number;
  readonly background: number;
  readonly unknown: number;
}

/** Minimal patch representation for the engine (no Fabric.js dependency). */
export interface PatchDescriptor {
  readonly __isBlockGroup?: boolean;
  readonly __pieceRole?: string;
  readonly __shade?: Shade;
  readonly __blockPatchIndex?: number;
  readonly __blockId?: string;
  readonly children?: readonly PatchDescriptor[];
}
