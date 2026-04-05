import { z } from 'zod';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_MAX_LIMIT,
  BLOCKS_PAGINATION_DEFAULT_LIMIT,
  BLOCKS_PAGINATION_MAX_LIMIT,
  FABRICS_PAGINATION_DEFAULT_LIMIT,
  FABRICS_PAGINATION_MAX_LIMIT,
  COMMUNITY_PAGINATION_DEFAULT_LIMIT,
  ACCEPTED_IMAGE_TYPES,
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

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255).default('Untitled Quilt'),
  unitSystem: z.enum(['imperial', 'metric']).default('imperial'),
  canvasWidth: z.number().min(1).max(200).default(48),
  canvasHeight: z.number().min(1).max(200).default(48),
  gridSettings: gridSettingsSchema.default({ enabled: true, size: 1, snapToGrid: true }),
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
  isPublic: z.boolean().optional(),
  version: z.number().int().min(1).optional(),
});

// --- Published Template Schemas ---

const MAX_SNAPSHOT_SIZE = 5 * 1024 * 1024; // 5 MB JSON limit

export const publishTemplateSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  thumbnailUrl: assetUrlSchema.optional(),
  snapshotData: z
    .record(z.string(), z.unknown())
    .refine((data) => JSON.stringify(data).length <= MAX_SNAPSHOT_SIZE, {
      message: 'Snapshot data exceeds 5 MB limit',
    }),
  isPublic: z.boolean().default(true),
});

export const templateIdSchema = z.object({
  templateId: z.string().uuid(),
});

export const shareToThreadsSchema = z.object({
  templateId: z.string().uuid(),
  comment: z.string().max(2000).optional(),
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

export const communitySearchSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['newest', 'popular']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(COMMUNITY_PAGINATION_DEFAULT_LIMIT),
});

export const createCommunityPostSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

export const fussyCutConfigSchema = z.object({
  fabricId: z.string().min(1),
  offsetX: z.number().min(-2000).max(2000).default(0),
  offsetY: z.number().min(-2000).max(2000).default(0),
  rotation: z.number().min(-360).max(360).default(0),
  scale: z.number().min(0.1).max(10).default(1),
});

export const adminModerationSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});

export const adminModerationListSchema = z.object({
  status: z.enum(['all', 'pending', 'approved', 'rejected']).default('pending'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const notificationQuerySchema = z.object({
  unreadOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const markNotificationsReadSchema = z.union([
  z.object({ notificationIds: z.literal('all') }),
  z.object({ notificationIds: z.array(z.string().uuid()) }),
]);

// Phase 17: Community, Profiles & Blog

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Display name contains invalid characters'),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  websiteUrl: z
    .string()
    .max(255)
    .refine(
      (url) => {
        if (!url) return true;
        try {
          const parsed = new URL(url);
          return parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Website URL must use https.' }
    )
    .optional(),
  instagramHandle: z.string().max(50).optional(),
  youtubeHandle: z.string().max(50).optional(),
  tiktokHandle: z.string().max(50).optional(),
  publicEmail: z.string().email().max(255).optional(),
  privacyMode: z.enum(['public', 'private']).default('public').optional(),
  // Username can be changed, but must be unique (validated server-side)
  username: z
    .string()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9\-]+$/, 'Username must be lowercase alphanumeric with hyphens only')
    .optional(),
});

export const communityFeedSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(['newest', 'popular']).default('newest'),
  tab: z.enum(['discover']).default('discover'),
  category: z.string().optional(),
  creatorId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(48).default(COMMUNITY_PAGINATION_DEFAULT_LIMIT),
});

export const createCommunityPostExtendedSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  category: z.string().optional(),
});

export const createCommunityPostSimpleSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  imageUrl: assetUrlSchema.optional(),
  projectId: z.string().uuid().optional(),
  category: z
    .enum(['general', 'showcase', 'question', 'tutorial', 'inspiration', 'wip'])
    .default('general'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
  replyToId: z.string().uuid().optional(),
});

export const commentsPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
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

export const patternQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  skillLevel: z.enum(['beginner', 'confident-beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['popular', 'name', 'newest']).default('popular'),
});
