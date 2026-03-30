import { pgTable, uuid, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { paperSizeEnum } from './enums';

export const printlists = pgTable(
  'printlists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    projectId: uuid('projectId')
      .notNull()
      .unique()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    items: jsonb('items').notNull().default([]),
    paperSize: paperSizeEnum('paperSize').notNull().default('letter'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_printlists_userId').on(table.userId),
    // Note: idx_printlists_projectId is redundant - projectId has a UNIQUE constraint
  ]
);
