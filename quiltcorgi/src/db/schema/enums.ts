import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['free', 'pro', 'admin']);
export const unitSystemEnum = pgEnum('unit_system', ['imperial', 'metric']);
export const paperSizeEnum = pgEnum('paper_size', ['letter', 'a4']);
export const postStatusEnum = pgEnum('post_status', ['pending', 'approved', 'rejected']);
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
export const communityCategoryEnum = pgEnum('community_category', [
  'show-and-tell',
  'wip',
  'help',
  'inspiration',
  'general',
]);
export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'pending',
  'published',
  'rejected',
]);
export const reportTargetTypeEnum = pgEnum('report_target_type', ['post', 'comment', 'user']);
export const reportReasonEnum = pgEnum('report_reason', [
  'spam',
  'harassment',
  'inappropriate',
  'other',
]);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'dismissed']);
