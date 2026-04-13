import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['free', 'pro', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'banned']);
export const unitSystemEnum = pgEnum('unit_system', ['imperial', 'metric']);
export const paperSizeEnum = pgEnum('paper_size', ['letter', 'a4']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'pro']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'unpaid',
  'trialing',
]);

export const blogPostStatusEnum = pgEnum('blog_post_status', ['draft', 'published', 'archived']);
export const blogPostCategoryEnum = pgEnum('blog_post_category', [
  'Product Updates',
  'Behind the Scenes',
  'Tutorials',
  'Community',
  'Tips',
  'Inspiration',
  'History',
  'Organization',
]);

// Blog post layout types
export const blogPostLayoutEnum = pgEnum('blog_post_layout', [
  'standard',
  'hero-cover',
  'staggered-media',
]);

// Mobile uploads
export const mobileUploadStatusEnum = pgEnum('mobile_upload_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const mobileUploadTypeEnum = pgEnum('mobile_upload_type', [
  'unassigned',
  'fabric',
  'block',
  'quilt',
]);
