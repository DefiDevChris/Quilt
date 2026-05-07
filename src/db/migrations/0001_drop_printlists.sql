-- Drop printlists table (no longer needed - PDF generation is client-side only)
ALTER TABLE "printlists" DROP CONSTRAINT IF EXISTS "printlists_projectId_projects_id_fk";--> statement-breakpoint
ALTER TABLE "printlists" DROP CONSTRAINT IF EXISTS "printlists_userId_users_id_fk";--> statement-breakpoint
DROP TABLE IF EXISTS "printlists";--> statement-breakpoint
DROP TYPE IF EXISTS "paper_size";
