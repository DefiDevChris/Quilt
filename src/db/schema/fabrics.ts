import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { retailers } from './retailers';

export const fabrics = pgTable(
  'fabrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    imageUrl: text('imageUrl').notNull(),
    thumbnailUrl: text('thumbnailUrl'),
    manufacturer: varchar('manufacturer', { length: 255 }),
    sku: varchar('sku', { length: 100 }),
    collection: varchar('collection', { length: 255 }),
    colorFamily: varchar('colorFamily', { length: 50 }),
    value: varchar('value', { length: 10 }),
    hex: varchar('hex', { length: 7 }),
    scaleX: doublePrecision('scaleX').notNull().default(1.0),
    scaleY: doublePrecision('scaleY').notNull().default(1.0),
    rotation: doublePrecision('rotation').notNull().default(0.0),
    ppi: numeric('ppi', { precision: 10, scale: 4 }),
    calibrated: boolean('calibrated').notNull().default(false),
    isDefault: boolean('isDefault').notNull().default(false),
    isAffiliate: boolean('isAffiliate').notNull().default(false),
    retailerId: uuid('retailerId').references(() => retailers.id, { onDelete: 'set null' }),
    retailerProductUrl: text('retailerProductUrl'),
    retailerProductSku: varchar('retailerProductSku', { length: 100 }),
    deeplinkOverride: text('deeplinkOverride'),
    isInStockAtRetailer: boolean('isInStockAtRetailer').default(true),
    lastVerifiedAt: timestamp('lastVerifiedAt', { mode: 'date', withTimezone: true }),
    pricePerYard: numeric('pricePerYard', { precision: 10, scale: 2 }),
    description: text('description'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_fabrics_userId').on(table.userId),
    index('idx_fabrics_isDefault').on(table.isDefault),
    index('idx_fabrics_colorFamily').on(table.colorFamily),
    index('idx_fabrics_manufacturer').on(table.manufacturer),
    index('idx_fabrics_value').on(table.value),
    index('idx_fabrics_isAffiliate').on(table.isAffiliate),
    index('idx_fabrics_retailerId').on(table.retailerId),
    index('idx_fabrics_isActive').on(table.isActive),
    uniqueIndex('idx_fabrics_retailer_sku_unique').on(
      table.retailerId,
      table.retailerProductSku,
    ),
  ],
);
