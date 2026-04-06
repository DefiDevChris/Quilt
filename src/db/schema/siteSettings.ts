import { pgTable, varchar, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value'),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
});
