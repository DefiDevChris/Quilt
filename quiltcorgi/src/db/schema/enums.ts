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
