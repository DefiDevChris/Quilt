import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { publishedTemplates } from './publishedTemplates';

export const socialPosts = pgTable(
  'social_threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('projectId').references(() => projects.id, { onDelete: 'cascade' }),
    templateId: uuid('templateId').references(() => publishedTemplates.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnailUrl').notNull(),
    likeCount: integer('likeCount').notNull().default(0),
    commentCount: integer('commentCount').notNull().default(0),
    category: text('category').notNull().default('general'),
    deletedAt: timestamp('deletedAt', { mode: 'date', withTimezone: true }),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_community_posts_userId').on(table.userId),
    index('idx_community_posts_projectId').on(table.projectId),
    index('idx_community_posts_templateId').on(table.templateId),
    index('idx_community_posts_deletedAt').on(table.deletedAt),
    index('idx_community_posts_createdAt').on(table.createdAt),
  ]
);
