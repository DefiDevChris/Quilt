import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { communityPosts } from './communityPosts';

export const savedPosts = pgTable(
  'saved_posts',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('postId')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index('idx_saved_posts_postId').on(table.postId),
    // Note: idx_saved_posts_userId is redundant - userId is the leading column of the primary key
  ]
);
