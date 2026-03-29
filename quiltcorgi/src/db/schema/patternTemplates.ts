import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  integer,
  jsonb,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const patternTemplates = pgTable(
  'pattern_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    skillLevel: varchar('skillLevel', { length: 50 }).notNull(),
    finishedWidth: doublePrecision('finishedWidth').notNull(),
    finishedHeight: doublePrecision('finishedHeight').notNull(),
    blockCount: integer('blockCount'),
    fabricCount: integer('fabricCount'),
    thumbnailUrl: text('thumbnailUrl'),
    patternData: jsonb('patternData').notNull(),
    tags: text('tags').array().notNull().default([]),
    importCount: integer('importCount').notNull().default(0),
    isPublished: boolean('isPublished').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_pattern_templates_skillLevel').on(table.skillLevel),
    index('idx_pattern_templates_isPublished').on(table.isPublished),
  ]
);
