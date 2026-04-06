import { pgTable, uuid, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { socialPosts } from './socialPosts';

export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('postId')
      .notNull()
      .references(() => socialPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.postId] }),
    index('idx_bookmarks_postId').on(table.postId),
  ]
);
