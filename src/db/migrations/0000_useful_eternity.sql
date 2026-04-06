CREATE TYPE "public"."blog_post_category" AS ENUM('Product Updates', 'Behind the Scenes', 'Tutorials', 'Community', 'Tips', 'Inspiration', 'History', 'Organization');--> statement-breakpoint
CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."paper_size" AS ENUM('letter', 'a4');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('imperial', 'metric');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('free', 'pro', 'admin');--> statement-breakpoint
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
CREATE TABLE "bookmarks" (
	"userId" uuid NOT NULL,
	"postId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_userId_postId_pk" PRIMARY KEY("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"content" text NOT NULL,
	"replyToId" uuid,
	"status" "comment_status" DEFAULT 'visible' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
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
	"inStock" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"followerId" uuid NOT NULL,
	"followingId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_followerId_followingId_pk" PRIMARY KEY("followerId","followingId"),
	CONSTRAINT "no_self_follow" CHECK ("follows"."followerId" != "follows"."followingId")
);
--> statement-breakpoint
CREATE TABLE "quilt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"skillLevel" varchar(50),
	"finishedWidth" double precision,
	"finishedHeight" double precision,
	"blockCount" integer,
	"fabricCount" integer,
	"thumbnailUrl" text,
	"templateData" jsonb,
	"tags" text[] DEFAULT '{}',
	"importCount" integer DEFAULT 0,
	"isPublished" boolean DEFAULT true,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now(),
	CONSTRAINT "quilt_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"userId" uuid NOT NULL,
	"communityPostId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "likes_userId_communityPostId_pk" PRIMARY KEY("userId","communityPostId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "project_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"unitSystem" "unit_system" DEFAULT 'imperial' NOT NULL,
	"gridSettings" jsonb DEFAULT '{"enabled":true,"size":1,"snapToGrid":true}'::jsonb NOT NULL,
	"canvasWidth" double precision DEFAULT 48 NOT NULL,
	"canvasHeight" double precision DEFAULT 48 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Untitled Quilt' NOT NULL,
	"description" text,
	"canvasData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"canvasDataS3Key" text,
	"worktables" jsonb DEFAULT '[{"id":"main","name":"Main","canvasData":{},"order":0}]'::jsonb NOT NULL,
	"worktablesS3Key" text,
	"unitSystem" "unit_system" DEFAULT 'imperial' NOT NULL,
	"gridSettings" jsonb DEFAULT '{"enabled":true,"size":1,"snapToGrid":true}'::jsonb NOT NULL,
	"fabricPresets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"canvasWidth" double precision DEFAULT 48 NOT NULL,
	"canvasHeight" double precision DEFAULT 48 NOT NULL,
	"thumbnailUrl" text,
	"isPublic" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"lastSavedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"projectId" uuid,
	"title" text NOT NULL,
	"description" text,
	"thumbnailUrl" text,
	"snapshotData" jsonb NOT NULL,
	"isPublic" boolean DEFAULT true NOT NULL,
	"addToQuiltbookCount" integer DEFAULT 0 NOT NULL,
	"rethreadCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"postId" uuid,
	"commentId" uuid,
	"reason" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now(),
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "social_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"projectId" uuid,
	"templateId" uuid,
	"title" text NOT NULL,
	"description" text,
	"thumbnailUrl" text NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"deletedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
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
	"username" varchar(60) NOT NULL,
	"bio" text,
	"avatarUrl" text,
	"location" varchar(100),
	"websiteUrl" text,
	"instagramHandle" varchar(50),
	"youtubeHandle" varchar(50),
	"tiktokHandle" varchar(50),
	"publicEmail" varchar(255),
	"privacyMode" text DEFAULT 'public' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
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
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_postId_social_threads_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."social_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_social_threads_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."social_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_replyToId_comments_id_fk" FOREIGN KEY ("replyToId") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_users_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_users_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_communityPostId_social_threads_id_fk" FOREIGN KEY ("communityPostId") REFERENCES "public"."social_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_templates" ADD CONSTRAINT "published_templates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "published_templates" ADD CONSTRAINT "published_templates_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_users_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_postId_social_threads_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."social_threads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_commentId_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_threads" ADD CONSTRAINT "social_threads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_threads" ADD CONSTRAINT "social_threads_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_threads" ADD CONSTRAINT "social_threads_templateId_published_templates_id_fk" FOREIGN KEY ("templateId") REFERENCES "public"."published_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fabrics" ADD CONSTRAINT "user_fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_blocks_category" ON "blocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_blocks_isDefault" ON "blocks" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_blocks_userId" ON "blocks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_category" ON "blog_posts" USING btree ("status","category");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_publishedAt" ON "blog_posts" USING btree ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_authorId" ON "blog_posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "idx_bookmarks_postId" ON "bookmarks" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "idx_comments_postId_createdAt" ON "comments" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_comments_authorId" ON "comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "idx_comments_replyToId" ON "comments" USING btree ("replyToId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_userId" ON "fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isDefault" ON "fabrics" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_fabrics_colorFamily" ON "fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer" ON "fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "idx_fabrics_value" ON "fabrics" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_follows_followingId" ON "follows" USING btree ("followingId");--> statement-breakpoint
CREATE INDEX "idx_quilt_templates_skillLevel" ON "quilt_templates" USING btree ("skillLevel");--> statement-breakpoint
CREATE INDEX "idx_quilt_templates_isPublished" ON "quilt_templates" USING btree ("isPublished");--> statement-breakpoint
CREATE INDEX "idx_likes_communityPostId" ON "likes" USING btree ("communityPostId");--> statement-breakpoint
CREATE INDEX "idx_notifications_userId_isRead" ON "notifications" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "idx_notifications_userId_createdAt" ON "notifications" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_printlists_userId" ON "printlists" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_project_templates_userId" ON "project_templates" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_projects_userId" ON "projects" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_published_templates_userId" ON "published_templates" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_published_templates_isPublic" ON "published_templates" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX "idx_reports_postId" ON "reports" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "idx_reports_commentId" ON "reports" USING btree ("commentId");--> statement-breakpoint
CREATE INDEX "idx_reports_reporterId" ON "reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_userId" ON "social_threads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_projectId" ON "social_threads" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_templateId" ON "social_threads" USING btree ("templateId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_deletedAt" ON "social_threads" USING btree ("deletedAt");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_userId" ON "user_fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_colorFamily" ON "user_fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_manufacturer" ON "user_fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "users_cognito_sub_unique" ON "users" USING btree ("cognito_sub") WHERE cognito_sub IS NOT NULL;