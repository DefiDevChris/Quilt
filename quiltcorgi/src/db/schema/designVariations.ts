import { pgTable, uuid, varchar, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';

export const designVariations = pgTable(
  'design_variations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('projectId')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull().default('Variation'),
    canvasData: jsonb('canvasData').notNull().default({}),
    thumbnailUrl: text('thumbnailUrl'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_design_variations_projectId').on(table.projectId),
    index('idx_design_variations_userId').on(table.userId),
  ]
);
