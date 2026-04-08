-- Migration: 0003_drop_orphaned_tables.sql
-- Purpose: Remove orphaned tables that have no Drizzle schema files and no TypeScript references.
--   - quilt_templates: never had a schema file, zero TS references
--   - project_templates: never had a schema file, zero TS references
--   - published_templates: never had a schema file, zero TS references
-- Also drops the stray templateId FK column from social_threads that referenced published_templates.

-- Drop the stray FK column first (depends on published_templates)
ALTER TABLE "social_threads" DROP COLUMN IF EXISTS "templateId";
DROP INDEX IF EXISTS "idx_community_posts_templateId";

-- Drop orphaned tables
DROP TABLE IF EXISTS "quilt_templates" CASCADE;
DROP TABLE IF EXISTS "project_templates" CASCADE;
DROP TABLE IF EXISTS "published_templates" CASCADE;
