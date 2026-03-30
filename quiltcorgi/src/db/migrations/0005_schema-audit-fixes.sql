-- Migration to fix schema issues identified in audit
-- Includes: cognitoSub rename, updatedAt additions, likes table PK change, reviewedBy onDelete, category enum

-- ================================================================
-- Rename cognitoSub to cognito_sub (PostgreSQL snake_case convention)
-- ================================================================
ALTER TABLE "users" RENAME COLUMN "cognitoSub" TO "cognito_sub";

-- ================================================================
-- Add updatedAt columns to missing tables
-- ================================================================

-- blocks
ALTER TABLE "blocks" ADD COLUMN "updatedAt" timestamptz DEFAULT now() NOT NULL;

-- fabrics
ALTER TABLE "fabrics" ADD COLUMN "updatedAt" timestamptz DEFAULT now() NOT NULL;

-- comments
ALTER TABLE "comments" ADD COLUMN "updatedAt" timestamptz DEFAULT now() NOT NULL;

-- pattern_templates
ALTER TABLE "pattern_templates" ADD COLUMN "updatedAt" timestamptz DEFAULT now() NOT NULL;

-- designVariations
ALTER TABLE "designVariations" ADD COLUMN "updatedAt" timestamptz DEFAULT now() NOT NULL;

-- ================================================================
-- Fix likes table to use composite PK (matching other junction tables)
-- ================================================================

-- First, drop the existing unique constraint and id column
ALTER TABLE "likes" DROP CONSTRAINT "idx_likes_userId_communityPostId";
ALTER TABLE "likes" DROP COLUMN "id";

-- Add composite primary key
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_communityPostId_pk" PRIMARY KEY ("userId", "communityPostId");

-- ================================================================
-- Fix reports.reviewedBy to use onDelete: 'set null'
-- ================================================================
ALTER TABLE "reports" DROP CONSTRAINT "reports_reviewedBy_users_id_fk";
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedBy_users_id_fk"
  FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;

-- ================================================================
-- Change blog_posts.category to use enum instead of plain varchar
-- ================================================================
CREATE TYPE "public"."blog_post_category" AS ENUM('Product Updates', 'Behind the Scenes', 'Tutorials', 'Community', 'Tips', 'Inspiration', 'History', 'Organization');

-- Convert existing data and change column type
ALTER TABLE "blog_posts" ALTER COLUMN "category" TYPE "blog_post_category" USING "category"::"blog_post_category";

-- ================================================================
-- Drop redundant indexes (already covered by UNIQUE constraints or PKs)
-- ================================================================
DROP INDEX IF EXISTS "idx_user_profiles_username";
DROP INDEX IF EXISTS "idx_user_profiles_userId";
DROP INDEX IF EXISTS "idx_saved_posts_userId";
DROP INDEX IF EXISTS "idx_comment_likes_userId";
DROP INDEX IF EXISTS "idx_printlists_projectId";

-- ================================================================
-- Add triggers for updatedAt columns (Drizzle-style)
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON "blocks"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fabrics_updated_at BEFORE UPDATE ON "fabrics"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON "comments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pattern_templates_updated_at BEFORE UPDATE ON "pattern_templates"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designVariations_updated_at BEFORE UPDATE ON "designVariations"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
