export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 0.2;
export const ZOOM_DEFAULT = 0.15;
export const ZOOM_STEP = 0.1;
export const ZOOM_FACTOR = 1.05;

export const GRID_DEFAULT_SIZE = 1;
export const GRID_DEFAULT_ENABLED = true;
export const GRID_DEFAULT_SNAP = true;

export const UNDO_HISTORY_MAX = 50;
export const UNDO_SNAPSHOT_SIZE_LIMIT = 2 * 1024 * 1024; // 2 MB
export const AUTO_SAVE_INTERVAL_MS = 30_000;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const FREE_BLOCK_LIMIT = 20;
export const FREE_FABRIC_LIMIT = 10;
export const FREE_TEMPLATE_LIST_LIMIT = 6;

// Pricing
export const PRO_PRICE_MONTHLY = 8;
export const PRO_PRICE_YEARLY = 60;
export const PRO_YEARLY_SAVINGS_PERCENT = 37;

export const PIXELS_PER_INCH = 96;
export const PIXELS_PER_CM = PIXELS_PER_INCH / 2.54;
export const PDF_POINTS_PER_INCH = 72;

export const DEFAULT_CANVAS_WIDTH = 48;
export const DEFAULT_CANVAS_HEIGHT = 48;

export const DEFAULT_SEAM_ALLOWANCE_INCHES = 0.25;
export const DEFAULT_WOF = 44 as const;
export const DEFAULT_WASTE_MARGIN = 0.1;

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

// ── UI Colors & Design System ──

export const GRID_LINE_COLOR = '#E5E2DD';

export const DEFAULT_QUILT_PALETTE = [
  '#D4883C',
  '#8B4513',
  '#F5DEB3',
  '#2E4057',
  '#7B3F00',
  '#A0522D',
  '#DEB887',
  '#C9B896',
  '#FFFFFF',
  '#1A1A2E',
  '#E07B67',
  '#4A7C59',
] as const;

export const PATTERN_PREVIEW_FILL = '#e5e2dd';
export const PATTERN_PREVIEW_STROKE = '#c0b8ae';
export const PATTERN_PREVIEW_ACCENT = '#8B7355';

export const WHITE_FILL = '#ffffff';
export const DEFAULT_TEXT_COLOR = '#383831';
export const ON_SURFACE_COLOR = '#4a3b32';

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

export const FABRIC_MANUFACTURERS = [
  'Andover Fabrics',
  'Art Gallery Fabrics',
  'Basics',
  'Benartex',
  'Clothworks',
  'Free Spirit',
  'Michael Miller Fabrics',
  'Moda Fabrics',
  'Northcott',
  'Paintbrush Studio Fabrics',
  'Riley Blake Designs',
  'RJR Fabrics',
  'Robert Kaufman',
  'Spoonflower',
  'Windham Fabrics',
] as const;

export const FABRIC_VALUES = ['Light', 'Medium', 'Dark'] as const;

export const FABRIC_SORT_OPTIONS = [
  { value: 'name', label: 'Name A-Z' },
  { value: 'manufacturer', label: 'Brand' },
  { value: 'colorFamily', label: 'Color' },
  { value: 'value', label: 'Value' },
] as const;

// Phase 16: Onboarding & Photo features
export const ONBOARDING_STORAGE_KEY = 'quiltcorgi-onboarding-completed';
export const TOOLTIP_DELAY_MS = 400;

export const KMEANS_MAX_ITERATIONS = 20;
export const KMEANS_CONVERGENCE_THRESHOLD = 0.1;
export const PHOTO_MAX_GRID = 48;
export const PHOTO_MIN_GRID = 4;
export const PHOTO_MAX_COLORS = 24;
export const PHOTO_MIN_COLORS = 2;

export const OCR_CONFIDENCE_HIGH = 0.7;
export const OCR_CONFIDENCE_LOW = 0.3;

export const BLOG_PER_PAGE = 10;
export const TUTORIAL_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export const COMMENTS_PER_PAGE = 20;
export const REPLIES_INLINE_LIMIT = 3;
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_BIO_LENGTH = 500;
export const MAX_BLOG_EXCERPT_LENGTH = 300;
export const MAX_BLOG_TAGS = 5;
export const MAX_POST_IMAGES = 4;

export const COMMUNITY_CATEGORIES = [
  'show-and-tell',
  'wip',
  'help',
  'inspiration',
  'general',
] as const;

export const TEMPLATE_PAGINATION_DEFAULT_LIMIT = 24;
export const TEMPLATE_PAGINATION_MAX_LIMIT = 50;
export const SKILL_LEVELS = ['beginner', 'confident-beginner', 'intermediate', 'advanced'] as const;
export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  'confident-beginner': 'Confident Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const GRID_CELL_SIZE_MIN = 0.125;
export const GRID_CELL_SIZE_MAX = 12;
export const GRID_CELL_SIZE_STEP = 0.125;

// Photo to Design (Phase 21)
export const PHOTO_PATTERN_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const PHOTO_PATTERN_MIN_DIMENSION = 200; // px

// Resolution tiers based on piece scale - optimizes for scan quality vs memory usage
export const PHOTO_PATTERN_DOWNSCALE_MAX = 2000; // px longest side (legacy default)
export const PHOTO_PATTERN_RESOLUTION_TIERS = {
  tiny: 2400, // High resolution for small pieces (postage stamp quilts)
  standard: 1600, // Balanced for typical patchwork
  large: 1200, // Lower resolution sufficient for large-piece quilts
} as const;

// Maximum memory budget for ImageData (~32MB to stay under common browser limits)
export const PHOTO_PATTERN_MAX_IMAGE_DATA_SIZE = 32 * 1024 * 1024; // 32 MB
export const PHOTO_PATTERN_ABSOLUTE_MAX_DIMENSION = 2800; // Hard cap regardless of piece scale
export const PHOTO_PATTERN_SENSITIVITY_MIN = 0.2;
export const PHOTO_PATTERN_SENSITIVITY_MAX = 2.0;
export const PHOTO_PATTERN_SENSITIVITY_DEFAULT = 1.0;
export const PHOTO_PATTERN_SENSITIVITY_DEBOUNCE_MS = 300;
export const PHOTO_PATTERN_OVERLAY_COLOR = '#00E5FF';
export const PHOTO_PATTERN_OVERLAY_OPACITY = 0.7;
export const PHOTO_PATTERN_PIECE_MIN_AREA_RATIO = 0.005;
export const PHOTO_PATTERN_PIECE_MAX_AREA_RATIO = 0.25;
export const PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT = 0.4;

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

// Support contact
export const SUPPORT_EMAIL = 'support@quiltcorgi.com';

// Social/Featured fallback images (files exist in public/images/quilts/)
export const SOCIAL_FALLBACK_IMAGES = {
  spotlight: '/images/quilts/quilt_06_wall_art.png',
  medium: '/images/quilts/quilt_01_bed_geometric.png',
  wide: '/images/quilts/quilt_02_bed_hexagon.png',
  small: '/images/quilts/quilt_22_porch_railing.png',
} as const;

// Default canvas colors
export const DEFAULT_FILL_COLOR = '#FFCBA4';
export const DEFAULT_STROKE_COLOR = '#383831';

// Default layout colors
export const DEFAULT_SASHING_COLOR = '#F5F0E8';
export const DEFAULT_BORDER_COLOR = '#2D2D2D';
