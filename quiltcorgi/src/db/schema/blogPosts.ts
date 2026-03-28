import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { blogPostStatusEnum } from './enums';

export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    authorId: uuid('authorId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    content: jsonb('content'),
    excerpt: text('excerpt'),
    featuredImageUrl: text('featuredImageUrl'),
    category: varchar('category', { length: 50 }).notNull(),
    tags: text('tags').array().notNull().default([]),
    status: blogPostStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('publishedAt', { mode: 'date' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_blog_posts_status_publishedAt').on(table.status, table.publishedAt),
    index('idx_blog_posts_slug').on(table.slug),
    index('idx_blog_posts_authorId').on(table.authorId),
  ]
);
