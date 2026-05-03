import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { retailers } from './retailers';

export const affiliateClicks = pgTable(
  'affiliate_clicks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fabricId: uuid('fabricId').notNull(),
    retailerId: uuid('retailerId')
      .notNull()
      .references(() => retailers.id, { onDelete: 'cascade' }),
    userId: uuid('userId'),
    sessionId: varchar('sessionId', { length: 255 }),
    referrerPath: text('referrerPath'),
    userAgent: text('userAgent'),
    ipHash: varchar('ipHash', { length: 64 }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_affiliate_clicks_fabricId').on(table.fabricId),
    index('idx_affiliate_clicks_retailerId').on(table.retailerId),
    index('idx_affiliate_clicks_createdAt').on(table.createdAt),
  ],
);
