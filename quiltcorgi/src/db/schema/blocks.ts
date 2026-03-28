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

export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    subcategory: varchar('subcategory', { length: 100 }),
    svgData: text('svgData').notNull(),
    fabricJsData: jsonb('fabricJsData'),
    tags: text('tags').array().notNull().default([]),
    isDefault: boolean('isDefault').notNull().default(false),
    thumbnailUrl: text('thumbnailUrl'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_blocks_category').on(table.category),
    index('idx_blocks_isDefault').on(table.isDefault),
    index('idx_blocks_userId').on(table.userId),
  ]
);
