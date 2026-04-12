/**
 * Barrel re-export for backward compatibility.
 * Prefer importing directly from domain modules for better tree-shaking:
 *   import { ZOOM_MIN } from '@/lib/constants/canvas'
 *   import { PRO_PRICE_MONTHLY } from '@/lib/constants/pricing'
 */
export * from './canvas';
export * from './pdf';
export * from './pricing';
export * from './pagination';
export * from './fabrics';
export * from './social';

// ── Miscellaneous / cross-cutting ──

/** S3 presigned URL expiry */
export const S3_UPLOAD_EXPIRY_SECONDS = 300;

/** Onboarding completion flag stored in localStorage */
export const ONBOARDING_STORAGE_KEY = 'quilt-studio-onboarding-completed';

/** Tooltip show delay in milliseconds */
export const TOOLTIP_DELAY_MS = 400;

/** Photo pattern pipeline constraints */
export const PHOTO_PATTERN_MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const PHOTO_PATTERN_MIN_DIMENSION = 200; // px
export const PHOTO_PATTERN_REFERENCE_OPACITY_DEFAULT = 0.4;
