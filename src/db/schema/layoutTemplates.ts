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
    skillLevel: varchar('skillLevel', { length: 50 }),
    finishedWidth: doublePrecision('finishedWidth'),
    finishedHeight: doublePrecision('finishedHeight'),
    blockCount: integer('blockCount'),
    fabricCount: integer('fabricCount'),
    thumbnailUrl: text('thumbnailUrl'),
    templateData: jsonb('templateData'),
    tags: text('tags').array().default([]),
    importCount: integer('importCount').default(0),
    isPublished: boolean('isPublished').default(true),
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

export const layoutTemplates = quiltTemplates;
