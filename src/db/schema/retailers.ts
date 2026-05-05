import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

export const retailers = pgTable(
  'retailers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    websiteUrl: text('websiteUrl').notNull(),
    network: varchar('network', { length: 50 }).notNull().default('awin'),
    networkMerchantId: varchar('networkMerchantId', { length: 50 }),
    logoUrl: text('logoUrl'),
    feedUrl: text('feedUrl'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  () => [],
);
