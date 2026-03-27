import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { projects } from './projects';
import { postStatusEnum, communityCategoryEnum } from './enums';

export const communityPosts = pgTable(
  'community_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    projectId: uuid('projectId')
      .notNull()
      .unique()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    thumbnailUrl: text('thumbnailUrl').notNull(),
    likeCount: integer('likeCount').notNull().default(0),
    status: postStatusEnum('status').notNull().default('pending'),
    isFeatured: boolean('isFeatured').notNull().default(false),
    isPinned: boolean('isPinned').notNull().default(false),
    commentCount: integer('commentCount').notNull().default(0),
    category: communityCategoryEnum('category').notNull().default('general'),
    createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_community_posts_status_createdAt').on(table.status, table.createdAt),
    index('idx_community_posts_status_likeCount').on(table.status, table.likeCount),
    index('idx_community_posts_userId').on(table.userId),
    index('idx_community_posts_category').on(table.category),
    index('idx_community_posts_isFeatured').on(table.isFeatured),
  ]
);
