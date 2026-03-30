/**
 * Pattern Import Types
 *
 * Shared type definitions for pattern import functionality.
 */

import type { ParsedPattern, ParsedBlock, ParsedLayout } from './pattern-parser-types';
import type { FabricMatch } from './pattern-fabric-matcher';
import type { BlockMatchResult } from './pattern-block-matcher';

export interface ImportedProject {
  readonly name: string;
  readonly description: string;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly gridSettings: GridSettings;
  readonly canvasData: CanvasData;
  readonly printlistItems: readonly ImportedPrintlistItem[];
  readonly customBlocks: readonly CustomBlockDefinition[];
  readonly skillLevel: string;
}

export interface GridSettings {
  readonly enabled: boolean;
  readonly snapToGrid: boolean;
  readonly size: number;
  readonly rows: number;
  readonly cols: number;
}

export interface CanvasData {
  readonly version: string;
  readonly objects: readonly CanvasObject[];
  readonly background: string;
}

export interface CanvasObject {
  readonly type: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly angle: number;
  readonly originX: string;
  readonly originY: string;
  readonly flipX: boolean;
  readonly flipY: boolean;
  readonly opacity: number;
  readonly visible: boolean;
  readonly selectable: boolean;
  readonly blockId?: string;
  readonly fabricId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ImportedPrintlistItem {
  readonly shapeId: string;
  readonly shapeName: string;
  readonly svgData: string;
  readonly quantity: number;
  readonly seamAllowance: number;
  readonly seamAllowanceEnabled: boolean;
  readonly unitSystem: 'imperial';
  readonly fabricLabel: string;
  readonly colorHex: string;
  readonly cutWidth: number;
  readonly cutHeight: number;
  readonly shape: string;
  readonly fabricGroup?: string;
}

export interface CustomBlockDefinition {
  readonly name: string;
  readonly category: string;
  readonly svgData: string;
  readonly tags: readonly string[];
}

export interface BuildContext {
  readonly parsed: ParsedPattern;
  readonly fabricMatches: readonly FabricMatch[];
  readonly blockMatches: readonly BlockMatchResult[];
  readonly gridSettings: GridSettings;
}

// Internal constants
export const CANVAS_DATA_VERSION = '7.2.0';
export const CANVAS_BACKGROUND = 'transparent';
export const DEFAULT_STROKE_COLOR = '#333333';
export const DEFAULT_STROKE_WIDTH = 1;
export const BORDER_FILL = '#f5f0e6';
export const SASHING_FILL = '#eae8de';
export const FALLBACK_BLOCK_COLOR = '#888888';
