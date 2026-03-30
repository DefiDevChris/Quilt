import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { communityPosts } from './communityPosts';

export const likes = pgTable(
  'likes',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    communityPostId: uuid('communityPostId')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.communityPostId] }),
    index('idx_likes_communityPostId').on(table.communityPostId),
  ]
);
