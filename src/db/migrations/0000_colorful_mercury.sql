CREATE TYPE "public"."blog_post_category" AS ENUM('Product Updates', 'Behind the Scenes', 'Tutorials', 'Community', 'Tips', 'Inspiration', 'History', 'Organization');--> statement-breakpoint
CREATE TYPE "public"."blog_post_layout" AS ENUM('standard', 'hero-cover', 'staggered-media');--> statement-breakpoint
CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."grid_granularity" AS ENUM('inch', 'half', 'quarter');--> statement-breakpoint
CREATE TYPE "public"."mobile_upload_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."mobile_upload_type" AS ENUM('unassigned', 'fabric', 'block', 'quilt');--> statement-breakpoint
CREATE TYPE "public"."paper_size" AS ENUM('letter', 'a4');--> statement-breakpoint
CREATE TYPE "public"."project_mode" AS ENUM('free-form', 'layout', 'template');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('imperial', 'metric');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('free', 'pro', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"svgData" text NOT NULL,
	"fabricJsData" jsonb,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"thumbnailUrl" text,
	"widthIn" numeric(5, 2) DEFAULT '12' NOT NULL,
	"heightIn" numeric(5, 2) DEFAULT '12' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"authorId" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"content" jsonb,
	"excerpt" text,
	"featuredImageUrl" text,
	"category" "blog_post_category" NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"layout" "blog_post_layout" DEFAULT 'standard' NOT NULL,
	"publishedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"name" varchar(255) NOT NULL,
	"imageUrl" text NOT NULL,
	"thumbnailUrl" text,
	"manufacturer" varchar(255),
	"sku" varchar(100),
	"collection" varchar(255),
	"colorFamily" varchar(50),
	"value" varchar(10),
	"hex" varchar(7),
	"scaleX" double precision DEFAULT 1 NOT NULL,
	"scaleY" double precision DEFAULT 1 NOT NULL,
	"rotation" double precision DEFAULT 0 NOT NULL,
	"ppi" numeric(10, 4),
	"calibrated" boolean DEFAULT false NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"isPurchasable" boolean DEFAULT false NOT NULL,
	"shopifyProductId" varchar(255),
	"shopifyVariantId" varchar(255),
	"pricePerYard" numeric(10, 2),
	"description" text,
	"inStock" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layout_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) DEFAULT 'custom' NOT NULL,
	"templateData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"thumbnailSvg" text,
	"isDefault" boolean DEFAULT false NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"from_status" varchar(50),
	"to_status" varchar(50) NOT NULL,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"shopify_order_id" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"subtotal_cents" integer,
	"tax_cents" integer,
	"shipping_cents" integer,
	"line_items" jsonb NOT NULL,
	"shipping_address" jsonb,
	"checkout_url" varchar(1024),
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "printlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paperSize" "paper_size" DEFAULT 'letter' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "printlists_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Untitled Quilt' NOT NULL,
	"description" text,
	"mode" "project_mode" DEFAULT 'layout' NOT NULL,
	"canvasData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"canvasDataS3Key" text,
	"worktables" jsonb DEFAULT '[{"id":"main","name":"Main","canvasData":{},"order":0}]'::jsonb NOT NULL,
	"worktablesS3Key" text,
	"unitSystem" "unit_system" DEFAULT 'imperial' NOT NULL,
	"gridSettings" jsonb DEFAULT '{"enabled":true,"size":1,"snapToGrid":true}'::jsonb NOT NULL,
	"fabricPresets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"canvasWidth" double precision DEFAULT 48 NOT NULL,
	"canvasHeight" double precision DEFAULT 48 NOT NULL,
	"gridGranularity" "grid_granularity" DEFAULT 'inch',
	"thumbnailUrl" text,
	"version" integer DEFAULT 1 NOT NULL,
	"lastSavedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"stripeCustomerId" varchar(255) NOT NULL,
	"stripeSubscriptionId" varchar(255),
	"stripePriceId" varchar(255),
	"plan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"currentPeriodStart" timestamp with time zone,
	"currentPeriodEnd" timestamp with time zone,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId"),
	CONSTRAINT "subscriptions_stripeCustomerId_unique" UNIQUE("stripeCustomerId"),
	CONSTRAINT "subscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
);
--> statement-breakpoint
CREATE TABLE "user_fabrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"imageUrl" text NOT NULL,
	"thumbnailUrl" text,
	"manufacturer" varchar(255),
	"sku" varchar(100),
	"collection" varchar(255),
	"colorFamily" varchar(50),
	"scaleX" double precision DEFAULT 1 NOT NULL,
	"scaleY" double precision DEFAULT 1 NOT NULL,
	"rotation" double precision DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"displayName" varchar(60) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cognito_sub" varchar(255),
	"name" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'free' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layout_templates" ADD CONSTRAINT "layout_templates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_uploads" ADD CONSTRAINT "mobile_uploads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fabrics" ADD CONSTRAINT "user_fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blocks_category" ON "blocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_blocks_isDefault" ON "blocks" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_blocks_userId" ON "blocks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_category" ON "blog_posts" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_publishedAt" ON "blog_posts" USING btree ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_authorId" ON "blog_posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_userId" ON "fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isDefault" ON "fabrics" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_fabrics_colorFamily" ON "fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer" ON "fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "idx_fabrics_value" ON "fabrics" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_category" ON "layout_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_isDefault" ON "layout_templates" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_isPublished" ON "layout_templates" USING btree ("isPublished");--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_userId" ON "mobile_uploads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_status" ON "mobile_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_mobile_uploads_user_status" ON "mobile_uploads" USING btree ("userId","status");--> statement-breakpoint
CREATE INDEX "idx_orders_userId" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_shopifyOrderId" ON "orders" USING btree ("shopify_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_createdAt" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_printlists_userId" ON "printlists" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_projects_userId" ON "projects" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_userId" ON "user_fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_colorFamily" ON "user_fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_manufacturer" ON "user_fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "users_cognito_sub_unique" ON "users" USING btree ("cognito_sub") WHERE cognito_sub IS NOT NULL;