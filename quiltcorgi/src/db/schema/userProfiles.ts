import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: varchar('displayName', { length: 60 }).notNull(),
    username: varchar('username', { length: 60 }).notNull().unique(),
    bio: text('bio'),
    avatarUrl: text('avatarUrl'),
    location: varchar('location', { length: 100 }),
    websiteUrl: text('websiteUrl'),
    instagramHandle: varchar('instagramHandle', { length: 50 }),
    youtubeHandle: varchar('youtubeHandle', { length: 50 }),
    tiktokHandle: varchar('tiktokHandle', { length: 50 }),
    publicEmail: varchar('publicEmail', { length: 255 }),
    privacyMode: text('privacyMode').notNull().default('public'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  () => [
    // UNIQUE constraints already create indexes, no additional indexes needed
  ]
);
