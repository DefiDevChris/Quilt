CREATE TYPE "public"."blog_post_status" AS ENUM('draft', 'pending', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('visible', 'hidden', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."community_category" AS ENUM('show-and-tell', 'wip', 'help', 'inspiration', 'general');--> statement-breakpoint
CREATE TYPE "public"."paper_size" AS ENUM('letter', 'a4');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('spam', 'harassment', 'inappropriate', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target_type" AS ENUM('post', 'comment', 'user');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing');--> statement-breakpoint
CREATE TYPE "public"."unit_system" AS ENUM('imperial', 'metric');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('free', 'pro', 'admin');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"svgData" text NOT NULL,
	"fabricJsData" jsonb,
	"tags" text[] DEFAULT '{}',
	"isDefault" boolean DEFAULT false NOT NULL,
	"thumbnailUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
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
	"category" varchar(50) NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" "blog_post_status" DEFAULT 'draft' NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "comment_likes" (
	"userId" uuid NOT NULL,
	"commentId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "comment_likes_userId_commentId_pk" PRIMARY KEY("userId","commentId")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postId" uuid NOT NULL,
	"authorId" uuid NOT NULL,
	"content" text NOT NULL,
	"replyToId" uuid,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"status" "comment_status" DEFAULT 'visible' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"projectId" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnailUrl" text NOT NULL,
	"likeCount" integer DEFAULT 0 NOT NULL,
	"status" "post_status" DEFAULT 'pending' NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL,
	"category" "community_category" DEFAULT 'general' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "community_posts_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
CREATE TABLE "designVariations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Variation' NOT NULL,
	"canvasData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"thumbnailUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
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
	"scaleX" double precision DEFAULT 1 NOT NULL,
	"scaleY" double precision DEFAULT 1 NOT NULL,
	"rotation" double precision DEFAULT 0 NOT NULL,
	"ppi" double precision,
	"calibrated" boolean DEFAULT false NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"followerId" uuid NOT NULL,
	"followingId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "follows_followerId_followingId_pk" PRIMARY KEY("followerId","followingId"),
	CONSTRAINT "no_self_follow" CHECK ("follows"."followerId" != "follows"."followingId")
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"communityPostId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idx_likes_userId_communityPostId" UNIQUE("userId","communityPostId")
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
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "printlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"projectId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"paperSize" "paper_size" DEFAULT 'letter' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "printlists_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(255) DEFAULT 'Untitled Quilt' NOT NULL,
	"description" text,
	"canvasData" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"unitSystem" "unit_system" DEFAULT 'imperial' NOT NULL,
	"gridSettings" jsonb DEFAULT '{"enabled":true,"size":1,"snapToGrid":true}'::jsonb NOT NULL,
	"canvasWidth" double precision DEFAULT 48 NOT NULL,
	"canvasHeight" double precision DEFAULT 48 NOT NULL,
	"thumbnailUrl" text,
	"isPublic" boolean DEFAULT false NOT NULL,
	"lastSavedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"targetType" "report_target_type" NOT NULL,
	"targetId" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_posts" (
	"userId" uuid NOT NULL,
	"postId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_posts_userId_postId_pk" PRIMARY KEY("userId","postId")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sessionToken" varchar(255) NOT NULL,
	"userId" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken")
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
	"currentPeriodStart" timestamp,
	"currentPeriodEnd" timestamp,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId"),
	CONSTRAINT "subscriptions_stripeCustomerId_unique" UNIQUE("stripeCustomerId"),
	CONSTRAINT "subscriptions_stripeSubscriptionId_unique" UNIQUE("stripeSubscriptionId")
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
	"websiteUrl" varchar(255),
	"instagramHandle" varchar(50),
	"youtubeHandle" varchar(50),
	"tiktokHandle" varchar(50),
	"publicEmail" varchar(255),
	"followerCount" integer DEFAULT 0 NOT NULL,
	"followingCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId"),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"passwordHash" text,
	"role" "user_role" DEFAULT 'free' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_commentId_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designVariations" ADD CONSTRAINT "designVariations_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designVariations" ADD CONSTRAINT "designVariations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_users_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_users_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_communityPostId_community_posts_id_fk" FOREIGN KEY ("communityPostId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_users_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_posts" ADD CONSTRAINT "saved_posts_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_accounts_provider_providerAccountId" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "idx_blocks_category" ON "blocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_blocks_isDefault" ON "blocks" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_blocks_userId" ON "blocks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_publishedAt" ON "blog_posts" USING btree ("status","publishedAt");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_slug" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_authorId" ON "blog_posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "idx_comments_postId_createdAt" ON "comments" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_comments_authorId" ON "comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "idx_comments_replyToId" ON "comments" USING btree ("replyToId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_status_createdAt" ON "community_posts" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "idx_community_posts_status_likeCount" ON "community_posts" USING btree ("status","likeCount");--> statement-breakpoint
CREATE INDEX "idx_community_posts_userId" ON "community_posts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_community_posts_category" ON "community_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_community_posts_isFeatured" ON "community_posts" USING btree ("isFeatured");--> statement-breakpoint
CREATE INDEX "idx_designVariations_projectId" ON "designVariations" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "idx_designVariations_userId" ON "designVariations" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_userId" ON "fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isDefault" ON "fabrics" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_fabrics_colorFamily" ON "fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer" ON "fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "idx_likes_communityPostId" ON "likes" USING btree ("communityPostId");--> statement-breakpoint
CREATE INDEX "idx_notifications_userId_isRead" ON "notifications" USING btree ("userId","isRead");--> statement-breakpoint
CREATE INDEX "idx_notifications_userId_createdAt" ON "notifications" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_projects_userId" ON "projects" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_targetType_targetId" ON "reports" USING btree ("targetType","targetId");--> statement-breakpoint
CREATE INDEX "idx_reports_reporterId" ON "reports" USING btree ("reporterId");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_userId" ON "user_profiles" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_profiles_username" ON "user_profiles" USING btree ("username");