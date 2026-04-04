import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['free', 'pro', 'admin']);
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

// Phase 17: Community, Profiles & Blog
export const commentStatusEnum = pgEnum('comment_status', ['visible', 'hidden', 'deleted']);
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
