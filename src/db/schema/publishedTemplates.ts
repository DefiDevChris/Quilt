import { pgTable, uuid, text, jsonb, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const publishedTemplates = pgTable(
  'published_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('projectId').references(() => projects.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnailUrl'),
    snapshotData: jsonb('snapshotData').notNull(),
    isPublic: boolean('isPublic').notNull().default(true),
    addToQuiltbookCount: integer('addToQuiltbookCount').notNull().default(0),
    rethreadCount: integer('rethreadCount').notNull().default(0),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_published_templates_userId').on(table.userId),
    index('idx_published_templates_isPublic').on(table.isPublic),
  ]
);
