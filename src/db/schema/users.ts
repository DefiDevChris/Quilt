import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { userRoleEnum, userStatusEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Note: cognitoSub uses a partial unique index (defined below) to allow multiple NULL values
    // while enforcing uniqueness on non-null values. This is required for PostgreSQL < 15.
    cognitoSub: varchar('cognito_sub', { length: 255 }),
    name: text('name').notNull(),
    // .unique() creates an implicit B-tree index on email in PostgreSQL — no separate
    // index() definition is needed. The constraint name is users_email_unique.
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
    image: text('image'),
    role: userRoleEnum('role').notNull().default('free'),
    status: userStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Partial unique index: allows multiple NULL cognitoSub values while enforcing uniqueness on non-null values
    index('users_cognito_sub_unique')
      .on(table.cognitoSub)
      .where(sql`cognito_sub IS NOT NULL`),
  ]
);
