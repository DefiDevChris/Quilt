import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    shopifyOrderId: varchar('shopify_order_id', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('pending'),
    totalCents: integer('total_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('usd'),
    subtotalCents: integer('subtotal_cents'),
    taxCents: integer('tax_cents'),
    shippingCents: integer('shipping_cents'),
    lineItems: jsonb('line_items').notNull(),
    shippingAddress: jsonb('shipping_address'),
    checkoutUrl: varchar('checkout_url', { length: 1024 }),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_orders_userId').on(table.userId),
    index('idx_orders_shopifyOrderId').on(table.shopifyOrderId),
    index('idx_orders_status').on(table.status),
    index('idx_orders_createdAt').on(table.createdAt),
  ]
);

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }).notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});
