import { pgTable, uuid, timestamp, primaryKey, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const follows = pgTable(
  'follows',
  {
    followerId: uuid('followerId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    followingId: uuid('followingId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.followerId, table.followingId] }),
    check('no_self_follow', sql`${table.followerId} != ${table.followingId}`),
  ]
);
