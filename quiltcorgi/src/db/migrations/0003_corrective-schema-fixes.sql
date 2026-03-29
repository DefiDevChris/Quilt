-- Corrective migration: fix schema drift from 0000
-- C7: Add timezone to all timestamp columns (timestamp → timestamptz)
-- C8: Fix FK onDelete from 'no action' to 'cascade' for blog_posts, comments, reports
-- C9: Change users.name from varchar(255) to text
-- C10: Change fabrics.ppi from double precision to numeric(10,4)
-- C11: Add 5 missing indexes
-- C12: Drop orphan NextAuth tables (accounts, sessions, verification_tokens)

-- ================================================================
-- C7: ALTER timestamp → timestamptz USING AT TIME ZONE 'UTC'
-- ================================================================

-- blocks
ALTER TABLE "blocks" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- blog_posts
ALTER TABLE "blog_posts" ALTER COLUMN "publishedAt" TYPE timestamptz USING "publishedAt" AT TIME ZONE 'UTC';
ALTER TABLE "blog_posts" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "blog_posts" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- comment_likes
ALTER TABLE "comment_likes" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- comments
ALTER TABLE "comments" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- community_posts
ALTER TABLE "community_posts" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- designVariations
ALTER TABLE "designVariations" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- fabrics
ALTER TABLE "fabrics" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- follows
ALTER TABLE "follows" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- likes
ALTER TABLE "likes" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- notifications
ALTER TABLE "notifications" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- printlists
ALTER TABLE "printlists" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "printlists" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- projects
ALTER TABLE "projects" ALTER COLUMN "lastSavedAt" TYPE timestamptz USING "lastSavedAt" AT TIME ZONE 'UTC';
ALTER TABLE "projects" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "projects" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- reports
ALTER TABLE "reports" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- saved_posts
ALTER TABLE "saved_posts" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

-- subscriptions
ALTER TABLE "subscriptions" ALTER COLUMN "currentPeriodStart" TYPE timestamptz USING "currentPeriodStart" AT TIME ZONE 'UTC';
ALTER TABLE "subscriptions" ALTER COLUMN "currentPeriodEnd" TYPE timestamptz USING "currentPeriodEnd" AT TIME ZONE 'UTC';
ALTER TABLE "subscriptions" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "subscriptions" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- user_profiles
ALTER TABLE "user_profiles" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "user_profiles" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- users
ALTER TABLE "users" ALTER COLUMN "emailVerified" TYPE timestamptz USING "emailVerified" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';
ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

-- ================================================================
-- C8: Fix FK onDelete from 'no action' to 'cascade'
-- ================================================================

-- blog_posts.authorId
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_authorId_users_id_fk";
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk"
  FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- comments.authorId
ALTER TABLE "comments" DROP CONSTRAINT "comments_authorId_users_id_fk";
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_users_id_fk"
  FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- reports.reporterId
ALTER TABLE "reports" DROP CONSTRAINT "reports_reporterId_users_id_fk";
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_users_id_fk"
  FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- ================================================================
-- C9: Change users.name from varchar(255) to text
-- ================================================================
ALTER TABLE "users" ALTER COLUMN "name" TYPE text;

-- ================================================================
-- C10: Change fabrics.ppi from double precision to numeric(10,4)
-- ================================================================
ALTER TABLE "fabrics" ALTER COLUMN "ppi" TYPE numeric(10,4);

-- ================================================================
-- C11: Add 5 missing indexes
-- ================================================================
CREATE INDEX IF NOT EXISTS "idx_comment_likes_commentId" ON "comment_likes" USING btree ("commentId");
CREATE INDEX IF NOT EXISTS "idx_comment_likes_userId" ON "comment_likes" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_follows_followingId" ON "follows" USING btree ("followingId");
CREATE INDEX IF NOT EXISTS "idx_saved_posts_postId" ON "saved_posts" USING btree ("postId");
CREATE INDEX IF NOT EXISTS "idx_reports_reviewedBy" ON "reports" USING btree ("reviewedBy");

-- ================================================================
-- C12: Drop orphan NextAuth tables
-- ================================================================
DROP TABLE IF EXISTS "verification_tokens" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "accounts" CASCADE;
