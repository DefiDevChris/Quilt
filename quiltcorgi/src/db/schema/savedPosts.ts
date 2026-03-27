import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
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
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.postId] })]
);
