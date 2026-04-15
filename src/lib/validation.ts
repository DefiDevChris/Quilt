import { z } from 'zod';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  BLOCKS_PAGINATION_DEFAULT_LIMIT,
  BLOCKS_PAGINATION_MAX_LIMIT,
  FABRICS_PAGINATION_DEFAULT_LIMIT,
  FABRICS_PAGINATION_MAX_LIMIT,
  ACCEPTED_IMAGE_TYPES,
  MOBILE_UPLOADS_DEFAULT_LIMIT,
  MOBILE_UPLOADS_MAX_LIMIT,
} from '@/lib/constants';

/**
 * Validate that a URL is an HTTPS URL pointing to the app's CloudFront or S3 domain.
 * Falls back to any HTTPS URL when NEXT_PUBLIC_CLOUDFRONT_URL and AWS_S3_BUCKET are
 * not configured (local dev).
 */
function isAllowedAssetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;

    const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
    const s3Bucket = process.env.AWS_S3_BUCKET;

    // In local dev without AWS config, allow any HTTPS URL
    if (!cloudfrontUrl && !s3Bucket) return true;

    const allowedHostnames: string[] = [];
    if (cloudfrontUrl) {
      try {
        allowedHostnames.push(new URL(cloudfrontUrl).hostname);
      } catch {
        /* skip */
      }
    }
    if (s3Bucket) {
      allowedHostnames.push(`${s3Bucket}.s3.amazonaws.com`);
    }

    return allowedHostnames.some((h) => parsed.hostname === h);
  } catch {
    return false;
  }
}

const assetUrlSchema = z.string().url().refine(isAllowedAssetUrl, {
  message: "URL must be an HTTPS URL on the app's CloudFront or S3 domain.",
});

const gridSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  size: z.number().min(0.25).max(12).default(1),
  snapToGrid: z.boolean().default(true),
});

// Standard block sizes accepted by the New Project wizard. Mirrors
// STANDARD_BLOCK_SIZES in src/lib/quilt-sizing.ts; kept inline here so the
// validation layer doesn't pull in studio code.
const STANDARD_BLOCK_SIZE_VALUES = [6, 8, 10, 12, 14, 16] as const;

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).default('Untitled Quilt'),
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  canvasWidth: z.number().min(1).max(200).default(48),
  canvasHeight: z.number().min(1).max(200).default(48),
  gridSettings: gridSettingsSchema.default({ enabled: true, size: 1, snapToGrid: true }),
  canvasData: z.record(z.string(), z.unknown()).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  canvasData: z.record(z.string(), z.unknown()).optional(),
  canvasDataS3Key: z.string().optional(),
  worktables: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        canvasData: z.record(z.string(), z.unknown()),
        order: z.number().int().min(0),
      })
    )
    .max(10)
    .optional(),
  worktablesS3Key: z.string().optional(),
  unitSystem: z.enum(['imperial', 'metric']).optional(),
  canvasWidth: z.number().min(1).max(200).optional(),
  canvasHeight: z.number().min(1).max(200).optional(),
  gridSettings: gridSettingsSchema.optional(),
  fabricPresets: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        imageUrl: assetUrlSchema,
      })
    )
    .optional(),
  thumbnailUrl: assetUrlSchema.optional(),
  activeWorktable: z.enum(['quilt', 'block-builder']).optional(),
  version: z.number().int().min(1).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION_MAX_LIMIT).default(PAGINATION_DEFAULT_LIMIT),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const createBlockSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  svgData: z.string().min(1),
  fabricJsData: z.record(z.string(), z.unknown()),
  tags: z.array(z.string()).default([]),
  parentBlockIds: z.array(z.string().uuid()).optional(),
});

export const blockSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  scope: z.enum(['system', 'user', 'all']).default('system'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(BLOCKS_PAGINATION_MAX_LIMIT)
    .default(BLOCKS_PAGINATION_DEFAULT_LIMIT),
});

export const fabricSearchSchema = z.object({
  search: z.string().optional(),
  manufacturer: z.string().optional(),
  colorFamily: z.string().optional(),
  value: z.enum(['Light', 'Medium', 'Dark']).optional(),
  sortBy: z.enum(['name', 'manufacturer', 'colorFamily', 'value']).default('name'),
  scope: z.enum(['system', 'user', 'all']).default('system'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(FABRICS_PAGINATION_MAX_LIMIT)
    .default(FABRICS_PAGINATION_DEFAULT_LIMIT),
});

export const createFabricSchema = z.object({
  name: z.string().min(1).max(255),
  imageUrl: assetUrlSchema,
  thumbnailUrl: assetUrlSchema.optional(),
  manufacturer: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  scaleX: z.number().min(0.1).max(10).default(1.0),
  scaleY: z.number().min(0.1).max(10).default(1.0),
  rotation: z.number().min(-360).max(360).default(0.0),
});

export const calibrationInputSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('manual-dpi'),
    manualDpi: z.number().min(72).max(1200),
  }),
  z.object({
    method: z.literal('scanner-preset'),
    scannerPreset: z.enum(['150', '200', '300', '600']),
  }),
]);

export const presignedUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(ACCEPTED_IMAGE_TYPES),
  purpose: z.enum(['fabric', 'thumbnail', 'export', 'block', 'mobile-upload']),
});

// Blog post category enum values matching the database
export const BLOG_POST_CATEGORIES = [
  'Product Updates',
  'Behind the Scenes',
  'Tutorials',
  'Community',
  'Tips',
  'Inspiration',
  'History',
  'Organization',
] as const;

export const createBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.record(z.string(), z.unknown()).optional(),
  excerpt: z.string().max(300).optional(),
  featuredImageUrl: assetUrlSchema.optional(),
  category: z.enum(BLOG_POST_CATEGORIES),
  tags: z.array(z.string().max(50)).max(5).default([]),
});

export const updateBlogPostSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  excerpt: z.string().max(300).optional(),
  featuredImageUrl: assetUrlSchema.optional(),
  category: z.enum(BLOG_POST_CATEGORIES).optional(),
  tags: z.array(z.string().max(50)).max(5).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  layout: z.enum(['standard', 'hero-cover', 'staggered-media']).optional(),
});

export const blogSearchSchema = z.object({
  search: z.string().optional(),
  category: z.enum(BLOG_POST_CATEGORIES).optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const blogAdminListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const templateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  skillLevel: z.enum(['beginner', 'confident-beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['popular', 'name', 'newest']).default('popular'),
});

// --- Profile Schemas ---

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(60),
});

// --- Admin Schemas ---

export const adminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const adminCreateBlockSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  svgData: z.string(),
  fabricJsData: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  thumbnailUrl: z.string().url().optional(),
});

export const adminCreateFabricSchema = z.object({
  name: z.string().min(1).max(255),
  imageUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  manufacturer: z.string().max(255).optional(),
  sku: z.string().max(100).optional(),
  collection: z.string().max(255).optional(),
  colorFamily: z.string().max(50).optional(),
  scaleX: z.number().min(0.1).max(10).default(1.0),
  scaleY: z.number().min(0.1).max(10).default(1.0),
  rotation: z.number().min(-360).max(360).default(0.0),
  isDefault: z.boolean().default(false),
});

export const adminUpdateSettingSchema = z.object({
  key: z.literal('shop_enabled'),
  value: z.boolean(),
  confirm: z.string().optional(),
});

// --- Mobile Upload Schemas ---

export const mobileUploadCreateSchema = z.object({
  imageUrl: z.string().url(),
  originalFilename: z.string().max(255).optional(),
  fileSizeBytes: z.number().int().min(0).optional(),
});

export const mobileUploadUpdateSchema = z.object({
  assignedType: z.enum(['unassigned', 'fabric', 'block', 'quilt']).optional(),
});

export const mobileUploadListSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MOBILE_UPLOADS_MAX_LIMIT)
    .default(MOBILE_UPLOADS_DEFAULT_LIMIT),
});

export const mobileUploadProcessSchema = z.object({
  assignedType: z.enum(['fabric', 'block', 'quilt']),
});

export const mobileUploadCompleteSchema = z.object({
  processedEntityId: z.string().uuid(),
  processedEntityType: z.enum(['fabric', 'block', 'project']),
});
