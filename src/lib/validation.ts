import { z } from 'zod';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  BLOCKS_PAGINATION_DEFAULT_LIMIT,
  BLOCKS_PAGINATION_MAX_LIMIT,
  FABRICS_PAGINATION_DEFAULT_LIMIT,
  FABRICS_PAGINATION_MAX_LIMIT,
} from '@/lib/constants/pagination';
import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants/fabrics';

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
  mode: z.enum(['free-form', 'layout', 'template', 'photo-to-quilt']).default('layout'),
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  canvasWidth: z.number().min(1).max(200).default(48),
  canvasHeight: z.number().min(1).max(200).default(48),
  gridSettings: gridSettingsSchema.default({ enabled: true, size: 1, snapToGrid: true }),
  canvasData: z.record(z.string(), z.unknown()).optional(),
});

export const duplicateProjectSchema = z.object({
  sourceProjectId: z.string().uuid('Invalid source project ID'),
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
  publishToLibrary: z.boolean().optional(),
  widthIn: z.coerce.number().positive().max(999).default(12),
  heightIn: z.coerce.number().positive().max(999).default(12),
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
  purpose: z.enum(['fabric', 'thumbnail', 'export', 'block']),
});

export const templateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  skillLevel: z.enum(['beginner', 'confident-beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['popular', 'name', 'newest']).default('popular'),
});

// --- Admin Schemas ---

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100).default('custom'),
  description: z.string().max(2000).optional(),
  isPublished: z.boolean().optional(),
  thumbnailSvg: z.string().max(200_000).optional(),
  templateData: z
    .object({
      canvasJson: z.record(z.string(), z.unknown()),
      canvasWidth: z.number().positive(),
      canvasHeight: z.number().positive(),
      layoutConfig: z
        .object({
          layoutType: z.string(),
          rows: z.number().int().nonnegative(),
          cols: z.number().int().nonnegative(),
          blockSize: z.number().nonnegative(),
          sashing: z
            .object({
              width: z.number().nonnegative(),
              color: z.string().optional(),
              fabricId: z.string().nullable().optional(),
            })
            .optional(),
          borders: z
            .array(
              z.object({
                width: z.number().nonnegative(),
                color: z.string().optional(),
                fabricId: z.string().nullable().optional(),
              })
            )
            .optional(),
          hasCornerstones: z.boolean().optional(),
          bindingWidth: z.number().nonnegative().optional(),
        })
        .passthrough(),
    })
    .passthrough(),
});

export const adminUpdateTemplateSchema = createTemplateSchema.partial().extend({
  isDefault: z.boolean().optional(),
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

export const adminUpdateBlockSchema = adminCreateBlockSchema.omit({ isDefault: true }).partial();

const printlistItemSchema = z.object({
  fabricId: z.string().nullable().optional(),
  hex: z.string(),
  name: z.string(),
  cutInstructions: z.array(z.string()),
  yardsRequired: z.number(),
});

export const printlistSchema = z.object({
  items: z.array(printlistItemSchema),
  paperSize: z.enum(['letter', 'a4']).default('letter'),
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



