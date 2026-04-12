/** Zoom level bounds and step increments for the design canvas */
export const ZOOM_MIN = 0.05;
export const ZOOM_MAX = 8;
export const ZOOM_DEFAULT = 0.2;
export const ZOOM_STEP = 0.1;
export const ZOOM_FACTOR = 1.2;

/** Grid display and snap defaults */
export const GRID_DEFAULT_SIZE = 1;
export const GRID_DEFAULT_ENABLED = true;
export const GRID_DEFAULT_SNAP = true;

/** Grid cell size constraints in inches */
export const GRID_CELL_SIZE_MIN = 0.125;
export const GRID_CELL_SIZE_MAX = 12;
export const GRID_CELL_SIZE_STEP = 0.125;

/** Undo/redo history limits */
export const UNDO_HISTORY_MAX = 50;
/** 2 MB snapshot size cap to prevent memory bloat */
export const UNDO_SNAPSHOT_SIZE_LIMIT = 2 * 1024 * 1024;
export const AUTO_SAVE_INTERVAL_MS = 30_000;

/** Default canvas dimensions in inches */
export const DEFAULT_CANVAS_WIDTH = 48;
export const DEFAULT_CANVAS_HEIGHT = 48;

/** Pixels per physical unit for canvas rendering */
export const PIXELS_PER_INCH = 96;
export const PIXELS_PER_CM = PIXELS_PER_INCH / 2.54;

/** Default seam allowance and yardage calculation settings */
export const DEFAULT_SEAM_ALLOWANCE_INCHES = 0.25;
export const DEFAULT_WOF = 44 as const;
export const DEFAULT_WASTE_MARGIN = 0.1;

/** Reference image overlay opacity */
export const REFERENCE_IMAGE_DEFAULT_OPACITY = 0.5;

/** Text tool defaults */
export const TEXT_DEFAULT_FONT_SIZE = 24;
export const TEXT_DEFAULT_FONT_FAMILY = 'Manrope';
export const TEXT_FONTS = [
  'Manrope',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Palatino',
  'Garamond',
  'Trebuchet MS',
  'Verdana',
] as const;

/** Standard quilt size presets in inches */
export const QUILT_SIZE_PRESETS: readonly {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}[] = [
  { label: 'Baby', width: 36, height: 52 },
  { label: 'Throw', width: 50, height: 65 },
  { label: 'Twin', width: 68, height: 90 },
  { label: 'Full/Double', width: 81, height: 96 },
  { label: 'Queen', width: 90, height: 108 },
  { label: 'King', width: 108, height: 108 },
];
