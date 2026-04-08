import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const layoutTemplates = pgTable(
  'layout_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull().default('custom'),
    // Full template data: { shapes, config, fence areas, etc. }
    templateData: jsonb('templateData').notNull().default({}),
    thumbnailSvg: text('thumbnailSvg'),
    isDefault: boolean('isDefault').notNull().default(false),
    isPublished: boolean('isPublished').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_layout_templates_category').on(table.category),
    index('idx_layout_templates_isDefault').on(table.isDefault),
    index('idx_layout_templates_isPublished').on(table.isPublished),
  ]
);
