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

export const quiltTemplates = pgTable(
  'quilt_templates',
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
    templateData: jsonb('templateData').notNull(),
    tags: text('tags').array().notNull().default([]),
    importCount: integer('importCount').notNull().default(0),
    isPublished: boolean('isPublished').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_quilt_templates_skillLevel').on(table.skillLevel),
    index('idx_quilt_templates_isPublished').on(table.isPublished),
  ]
);
