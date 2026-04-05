import {
  pgTable,
  uuid,
  varchar,
  text,
  doublePrecision,
  boolean,
  timestamp,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const fabrics = pgTable(
  'fabrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable by design: system-provided default fabrics have userId=null and isDefault=true.
    // User-owned fabrics have a userId and isDefault=false. onDelete:'set null' preserves
    // the fabric record when a user account is deleted.
    userId: uuid('userId').references(() => users.id, { onDelete: 'set null' }),
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
    isDefault: boolean('isDefault').notNull().default(false),
    
    // Shopify Integration Fields (feature-flagged)
    // isPurchasable: indicates if this fabric can be purchased via Shopify
    isPurchasable: boolean('isPurchasable').notNull().default(false),
    // shopifyProductId: The Shopify product ID for this fabric
    shopifyProductId: varchar('shopifyProductId', { length: 255 }),
    // shopifyVariantId: The Shopify variant ID (crucial for cart operations)
    shopifyVariantId: varchar('shopifyVariantId', { length: 255 }),
    // pricePerYard: Price in cents (for quick UI rendering without API calls)
    pricePerYard: integer('pricePerYard'),
    // inStock: Whether the fabric is currently in stock
    inStock: boolean('inStock').notNull().default(true),
    
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
    index('idx_fabrics_isPurchasable').on(table.isPurchasable),
    index('idx_fabrics_shopifyProductId').on(table.shopifyProductId),
    index('idx_fabrics_inStock').on(table.inStock),
  ]
);
