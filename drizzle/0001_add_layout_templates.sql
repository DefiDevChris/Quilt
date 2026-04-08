-- Migration: 0001_add_layout_templates.sql
-- Created: 2026-04-08
-- Purpose: Add layout_templates table for admin layout template management

CREATE TABLE IF NOT EXISTS "layout_templates" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid REFERENCES "users"(id) ON DELETE SET NULL,
  name varchar(255) NOT NULL,
  category varchar(100) NOT NULL DEFAULT 'custom',
  "templateData" jsonb NOT NULL DEFAULT '{}',
  "thumbnailSvg" text,
  "isDefault" boolean NOT NULL DEFAULT false,
  "isPublished" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp with time zone NOT NULL DEFAULT NOW(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_layout_templates_category" ON "layout_templates"(category);
CREATE INDEX IF NOT EXISTS "idx_layout_templates_isDefault" ON "layout_templates"("isDefault");
CREATE INDEX IF NOT EXISTS "idx_layout_templates_isPublished" ON "layout_templates"("isPublished");
