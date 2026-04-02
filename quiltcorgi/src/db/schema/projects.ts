import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { unitSystemEnum } from './enums';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull().default('Untitled Quilt'),
    description: text('description'),
    canvasData: jsonb('canvasData').notNull().default({}),
    canvasDataS3Key: text('canvasDataS3Key'),
    worktables: jsonb('worktables')
      .notNull()
      .default([{ id: 'main', name: 'Main', canvasData: {}, order: 0 }]),
    worktablesS3Key: text('worktablesS3Key'),
    unitSystem: unitSystemEnum('unitSystem').notNull().default('imperial'),
    gridSettings: jsonb('gridSettings')
      .notNull()
      .default({ enabled: true, size: 1, snapToGrid: true }),
    fabricPresets: jsonb('fabricPresets').notNull().default([]),
    canvasWidth: doublePrecision('canvasWidth').notNull().default(48.0),
    canvasHeight: doublePrecision('canvasHeight').notNull().default(48.0),
    thumbnailUrl: text('thumbnailUrl'),
    isPublic: boolean('isPublic').notNull().default(false),
    version: integer('version').notNull().default(1),
    lastSavedAt: timestamp('lastSavedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_projects_userId').on(table.userId)]
);
