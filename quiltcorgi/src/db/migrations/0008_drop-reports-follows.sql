-- Drop reports and follows tables and their associated enums
-- These features were removed from the product (no UI surface exists)

DROP TABLE IF EXISTS "reports";
DROP TABLE IF EXISTS "follows";

DROP TYPE IF EXISTS "public"."report_reason";
DROP TYPE IF EXISTS "public"."report_status";
DROP TYPE IF EXISTS "public"."report_target_type";
