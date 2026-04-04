import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * User-uploaded fabrics (Pro feature).
 * Separated from the system `fabrics` table so user data lives in its own space.
 */
export const userFabrics = pgTable(
  'user_fabrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    imageUrl: text('imageUrl').notNull(),
    thumbnailUrl: text('thumbnailUrl'),
    manufacturer: varchar('manufacturer', { length: 255 }),
    sku: varchar('sku', { length: 100 }),
    collection: varchar('collection', { length: 255 }),
    colorFamily: varchar('colorFamily', { length: 50 }),
    scaleX: doublePrecision('scaleX').notNull().default(1.0),
    scaleY: doublePrecision('scaleY').notNull().default(1.0),
    rotation: doublePrecision('rotation').notNull().default(0.0),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_user_fabrics_userId').on(table.userId),
    index('idx_user_fabrics_colorFamily').on(table.colorFamily),
    index('idx_user_fabrics_manufacturer').on(table.manufacturer),
  ]
);
