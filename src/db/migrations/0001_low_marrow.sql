CREATE TYPE "public"."mobile_upload_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mobile_upload_type" AS ENUM('unassigned', 'fabric', 'block', 'quilt');--> statement-breakpoint
CREATE TABLE "mobile_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"imageUrl" text NOT NULL,
	"thumbnailUrl" text,
	"originalFilename" varchar(255),
	"fileSizeBytes" integer,
	"status" "mobile_upload_status" DEFAULT 'pending' NOT NULL,
	"assignedType" "mobile_upload_type" DEFAULT 'unassigned' NOT NULL,
	"processedEntityId" uuid,
	"processedEntityType" varchar(50),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quilt_templates" ALTER COLUMN "createdAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "quilt_templates" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "mobile_uploads" ADD CONSTRAINT "mobile_uploads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_userId" ON "mobile_uploads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_status" ON "mobile_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_user_status" ON "mobile_uploads" USING btree ("userId","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_report_post" ON "reports" USING btree ("reporterId","postId");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_report_comment" ON "reports" USING btree ("reporterId","commentId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_createdAt" ON "social_threads" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "has_target" CHECK ("reports"."postId" IS NOT NULL OR "reports"."commentId" IS NOT NULL);