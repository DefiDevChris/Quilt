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

// Phase 17: Community, Profiles & Blog
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

export const TRUST_ACCOUNT_AGE_HOURS = 24;
export const TRUST_COMMENTER_APPROVED_COMMENTS = 3;
export const TRUST_POSTER_APPROVED_POSTS = 5;
export const TRUST_MOD_QUEUE_COMMENTS = 3;
export const TRUST_MOD_QUEUE_POSTS = 2;

export const RATE_LIMITS = {
  comments: { free: 20, pro: 100 },
  posts: { free: 3, pro: 20 },
  follows: { free: 50, pro: 200 },
  reports: { all: 10 },
} as const;

export const AUTO_HIDE_REPORT_THRESHOLD = 3;
