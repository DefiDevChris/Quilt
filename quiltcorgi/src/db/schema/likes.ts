import { pgTable, uuid, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { communityPosts } from './communityPosts';

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    communityPostId: uuid('communityPostId')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('idx_likes_userId_communityPostId').on(table.userId, table.communityPostId),
    index('idx_likes_communityPostId').on(table.communityPostId),
  ]
);
