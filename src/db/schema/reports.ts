import { pgTable, uuid, text, timestamp, index, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { socialPosts } from './socialPosts';
import { comments } from './comments';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporterId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    postId: uuid('postId').references(() => socialPosts.id, { onDelete: 'cascade' }),
    commentId: uuid('commentId').references(() => comments.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_reports_postId').on(table.postId),
    index('idx_reports_commentId').on(table.commentId),
    index('idx_reports_reporterId').on(table.reporterId),
    uniqueIndex('uniq_report_post').on(table.reporterId, table.postId),
    uniqueIndex('uniq_report_comment').on(table.reporterId, table.commentId),
    check('has_target', sql`${table.postId} IS NOT NULL OR ${table.commentId} IS NOT NULL`),
  ]
);
