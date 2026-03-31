-- Migration 0007: Database audit corrective fixes
-- Fixes issues from migration 0006 (wrong identifiers), schema drift, and dead columns

-- Issue 14: Drop designVariations table (0006 used wrong name "design_variations")
DROP TABLE IF EXISTS "designVariations" CASCADE;

-- Issue 15+13: Drop likeCount from comments (0006 used wrong name "like_count")
ALTER TABLE "comments" DROP COLUMN IF EXISTS "likeCount";

-- Issue 16+28: Drop orphaned save_count from community_posts (never wired up in app)
ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "save_count";

-- Issue 3: Drop redundant idx_blog_posts_slug (slug UNIQUE constraint already creates an index)
DROP INDEX IF EXISTS "idx_blog_posts_slug";

-- Issue 1: Add updatedAt to community_posts
ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;

-- Issue 8: Fix websiteUrl type drift (migration 0000 created varchar(255), schema declares text)
ALTER TABLE "user_profiles" ALTER COLUMN "websiteUrl" TYPE text;

-- Issue 12: Drop orphaned followerCount/followingCount (follows table was dropped in 0006)
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "followerCount";
ALTER TABLE "user_profiles" DROP COLUMN IF EXISTS "followingCount";
