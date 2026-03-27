export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 5.0;
export const ZOOM_DEFAULT = 1.0;
export const ZOOM_STEP = 0.1;

export const GRID_DEFAULT_SIZE = 1;
export const GRID_DEFAULT_ENABLED = true;
export const GRID_DEFAULT_SNAP = true;

export const UNDO_HISTORY_MAX = 50;
export const AUTO_SAVE_INTERVAL_MS = 30_000;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const FREE_PROJECT_LIMIT = 3;
export const FREE_BLOCK_LIMIT = 100;

export const PIXELS_PER_INCH = 96;
export const PIXELS_PER_CM = PIXELS_PER_INCH / 2.54;
export const PDF_POINTS_PER_INCH = 72;

export const DEFAULT_CANVAS_WIDTH = 48;
export const DEFAULT_CANVAS_HEIGHT = 48;

export const DEFAULT_SEAM_ALLOWANCE_INCHES = 0.25;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 50;
export const BLOCKS_PAGINATION_DEFAULT_LIMIT = 50;
export const BLOCKS_PAGINATION_MAX_LIMIT = 100;
export const COMMUNITY_PAGINATION_DEFAULT_LIMIT = 24;

export const FABRICS_PAGINATION_DEFAULT_LIMIT = 50;
export const FABRICS_PAGINATION_MAX_LIMIT = 100;

export const THUMBNAIL_SIZE = 200;
export const FABRIC_IMAGE_MAX_SIZE = 2048;

export const S3_UPLOAD_EXPIRY_SECONDS = 300;

export const REFERENCE_IMAGE_DEFAULT_OPACITY = 0.5;

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

export const FREE_VARIATION_LIMIT = 3;
export const MAX_MEDALLION_ROUNDS = 10;
export const MIN_LONE_STAR_RINGS = 3;
export const MAX_LONE_STAR_RINGS = 8;

export const COLOR_FAMILIES = [
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Purple',
  'Pink',
  'Brown',
  'Black',
  'White',
  'Gray',
  'Neutral',
  'Multi',
] as const;
