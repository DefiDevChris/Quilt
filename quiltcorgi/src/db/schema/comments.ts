import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { communityPosts } from './communityPosts';
import { commentStatusEnum } from './enums';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('postId')
      .notNull()
      .references(() => communityPosts.id, { onDelete: 'cascade' }),
    authorId: uuid('authorId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    replyToId: uuid('replyToId'),
    likeCount: integer('likeCount').notNull().default(0),
    status: commentStatusEnum('status').notNull().default('visible'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_comments_postId_createdAt').on(table.postId, table.createdAt),
    index('idx_comments_authorId').on(table.authorId),
    index('idx_comments_replyToId').on(table.replyToId),
  ]
);
