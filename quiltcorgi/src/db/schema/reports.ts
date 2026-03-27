import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { reportTargetTypeEnum, reportReasonEnum, reportStatusEnum } from './enums';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporterId')
      .notNull()
      .references(() => users.id),
    targetType: reportTargetTypeEnum('targetType').notNull(),
    targetId: uuid('targetId').notNull(),
    reason: reportReasonEnum('reason').notNull(),
    details: text('details'),
    status: reportStatusEnum('status').notNull().default('pending'),
    reviewedBy: uuid('reviewedBy').references(() => users.id),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_reports_status').on(table.status),
    index('idx_reports_targetType_targetId').on(table.targetType, table.targetId),
    index('idx_reports_reporterId').on(table.reporterId),
  ]
);
