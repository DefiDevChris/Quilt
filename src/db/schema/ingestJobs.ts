import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { ingestSourceTypeEnum } from './enums';

export const ingestJobs = pgTable(
  'ingest_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    retailerSlug: varchar('retailerSlug', { length: 100 }).notNull(),
    sourceType: ingestSourceTypeEnum('sourceType').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('running'),
    startedAt: timestamp('startedAt', { mode: 'date', withTimezone: true }).notNull(),
    finishedAt: timestamp('finishedAt', { mode: 'date', withTimezone: true }),
    productsSeen: integer('productsSeen').notNull().default(0),
    productsUpserted: integer('productsUpserted').notNull().default(0),
    productsSkipped: integer('productsSkipped').notNull().default(0),
    productsErrored: integer('productsErrored').notNull().default(0),
    errorLog: text('errorLog'),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('idx_ingest_jobs_retailerSlug').on(table.retailerSlug),
    index('idx_ingest_jobs_status').on(table.status),
    index('idx_ingest_jobs_createdAt').on(table.createdAt),
  ],
);
