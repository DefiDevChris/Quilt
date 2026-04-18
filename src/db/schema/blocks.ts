import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
  numeric,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const blocks = pgTable(
  'blocks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable by design: system-provided default blocks have userId=null and isDefault=true.
    // User-created blocks have a userId and isDefault=false. onDelete:'set null' preserves
    // the block record when a user account is deleted.
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    subcategory: varchar('subcategory', { length: 100 }),
    svgData: text('svgData').notNull(),
    fabricJsData: jsonb('fabricJsData'),
    tags: text('tags').array().notNull().default([]),
    isDefault: boolean('isDefault').notNull().default(false),
    thumbnailUrl: text('thumbnailUrl'),
    // Block dimensions in inches — enforces 1:1 sizing between Block Builder and design studio.
    widthIn: numeric('widthIn', { precision: 5, scale: 2 }).notNull().default('12'),
    heightIn: numeric('heightIn', { precision: 5, scale: 2 }).notNull().default('12'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_blocks_category').on(table.category),
    index('idx_blocks_isDefault').on(table.isDefault),
    index('idx_blocks_userId').on(table.userId),
  ]
);
