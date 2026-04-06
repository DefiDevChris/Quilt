import { pgTable, uuid, text, varchar, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { mobileUploadStatusEnum, mobileUploadTypeEnum } from './enums';

export const mobileUploads = pgTable(
  'mobile_uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    imageUrl: text('imageUrl').notNull(),
    thumbnailUrl: text('thumbnailUrl'),
    originalFilename: varchar('originalFilename', { length: 255 }),
    fileSizeBytes: integer('fileSizeBytes'),
    status: mobileUploadStatusEnum('status').notNull().default('pending'),
    assignedType: mobileUploadTypeEnum('assignedType').notNull().default('unassigned'),
    processedEntityId: uuid('processedEntityId'),
    processedEntityType: varchar('processedEntityType', { length: 50 }),
    createdAt: timestamp('createdAt', { mode: 'date', withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { mode: 'date', withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('idx_mobile_uploads_userId').on(table.userId),
    index('idx_mobile_uploads_status').on(table.status),
    index('idx_mobile_uploads_user_status').on(table.userId, table.status),
  ]
);
