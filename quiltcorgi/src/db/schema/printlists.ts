import { pgTable, uuid, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { paperSizeEnum } from './enums';

export const printlists = pgTable('printlists', {
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
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});
