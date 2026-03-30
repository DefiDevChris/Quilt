-- Migration 0006: App simplification
-- Drops removed tables and enums, adds saveCount column

-- Drop removed tables (CASCADE handles FK constraints)
DROP TABLE IF EXISTS "comment_likes" CASCADE;
DROP TABLE IF EXISTS "follows" CASCADE;
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "design_variations" CASCADE;

-- Drop removed enums
DROP TYPE IF EXISTS "report_target_type";
DROP TYPE IF EXISTS "report_reason";
DROP TYPE IF EXISTS "report_status";

-- Remove likeCount from comments (no longer used)
ALTER TABLE "comments" DROP COLUMN IF EXISTS "like_count";

-- Add saveCount to community_posts for Most Saved feature
ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "save_count" integer DEFAULT 0 NOT NULL;
