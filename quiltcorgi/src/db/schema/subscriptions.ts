import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { subscriptionPlanEnum, subscriptionStatusEnum } from './enums';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('userId')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: varchar('stripeCustomerId', { length: 255 }).notNull().unique(),
  stripeSubscriptionId: varchar('stripeSubscriptionId', { length: 255 }).unique(),
  stripePriceId: varchar('stripePriceId', { length: 255 }),
  plan: subscriptionPlanEnum('plan').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  currentPeriodStart: timestamp('currentPeriodStart', { mode: 'date', withTimezone: true }),
  currentPeriodEnd: timestamp('currentPeriodEnd', { mode: 'date', withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancelAtPeriodEnd').notNull().default(false),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
