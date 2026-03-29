-- Create pattern_templates table for importable quilt patterns.
CREATE TABLE "pattern_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" varchar(255) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "description" text,
  "skillLevel" varchar(50) NOT NULL,
  "finishedWidth" double precision NOT NULL,
  "finishedHeight" double precision NOT NULL,
  "blockCount" integer,
  "fabricCount" integer,
  "thumbnailUrl" text,
  "patternData" jsonb NOT NULL,
  "tags" text[] NOT NULL DEFAULT '{}',
  "importCount" integer NOT NULL DEFAULT 0,
  "isPublished" boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "idx_pattern_templates_skillLevel" ON "pattern_templates" ("skillLevel");
CREATE INDEX "idx_pattern_templates_isPublished" ON "pattern_templates" ("isPublished");
