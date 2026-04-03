import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { unitSystemEnum } from './enums';

export const projectTemplates = pgTable(
  'project_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    unitSystem: unitSystemEnum('unitSystem').notNull().default('imperial'),
    gridSettings: jsonb('gridSettings')
      .notNull()
      .default({ enabled: true, size: 1, snapToGrid: true }),
    canvasWidth: doublePrecision('canvasWidth').notNull().default(48.0),
    canvasHeight: doublePrecision('canvasHeight').notNull().default(48.0),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('idx_project_templates_userId').on(table.userId)]
);
