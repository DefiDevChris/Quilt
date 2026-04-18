-- Migration: 0008_add_project_mode.sql
-- Purpose: Add mode column to projects table for locking project modes at creation.
--   Three modes: free-form, layout, template. Default 'layout' for backward compatibility.

-- Add the enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "project_mode" AS ENUM('free-form', 'layout', 'template');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the column with default
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "mode" "project_mode" NOT NULL DEFAULT 'layout';