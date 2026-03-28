import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  cognitoSub: varchar('cognitoSub', { length: 255 }).unique(),
  name: text('name').notNull(),
  // .unique() creates an implicit B-tree index on email in PostgreSQL — no separate
  // index() definition is needed. The constraint name is users_email_unique.
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  passwordHash: text('passwordHash'),
  role: userRoleEnum('role').notNull().default('free'),
  createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
