CREATE TABLE "affiliate_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fabricId" uuid NOT NULL,
	"retailerId" uuid NOT NULL,
	"userId" uuid,
	"sessionId" varchar(255),
	"referrerPath" text,
	"userAgent" text,
	"ipHash" varchar(64) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
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
	"tags" text[] DEFAULT '{}' NOT NULL,
	"isDefault" boolean DEFAULT false NOT NULL,
	"thumbnailUrl" text,
	"widthIn" numeric(5, 2) DEFAULT '12' NOT NULL,
	"heightIn" numeric(5, 2) DEFAULT '12' NOT NULL,
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
	"isAffiliate" boolean DEFAULT false NOT NULL,
	"retailerId" uuid,
	"retailerProductUrl" text,
	"retailerProductSku" varchar(100),
	"deeplinkOverride" text,
	"isInStockAtRetailer" boolean DEFAULT true,
	"lastVerifiedAt" timestamp with time zone,
	"pricePerYard" numeric(10, 2),
	"description" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingest_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"retailerSlug" varchar(100) NOT NULL,
	"sourceType" "ingest_source_type" NOT NULL,
	"status" varchar(20) DEFAULT 'running' NOT NULL,
	"startedAt" timestamp with time zone NOT NULL,
	"finishedAt" timestamp with time zone,
	"productsSeen" integer DEFAULT 0 NOT NULL,
	"productsUpserted" integer DEFAULT 0 NOT NULL,
	"productsSkipped" integer DEFAULT 0 NOT NULL,
	"productsErrored" integer DEFAULT 0 NOT NULL,
	"errorLog" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "retailers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"websiteUrl" text NOT NULL,
	"network" varchar(50) DEFAULT 'awin' NOT NULL,
	"networkMerchantId" varchar(50),
	"logoUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retailers_slug_unique" UNIQUE("slug")
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
ALTER TABLE "affiliate_clicks" ADD CONSTRAINT "affiliate_clicks_retailerId_retailers_id_fk" FOREIGN KEY ("retailerId") REFERENCES "public"."retailers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_retailerId_retailers_id_fk" FOREIGN KEY ("retailerId") REFERENCES "public"."retailers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "layout_templates" ADD CONSTRAINT "layout_templates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "printlists" ADD CONSTRAINT "printlists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_fabrics" ADD CONSTRAINT "user_fabrics_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_fabricId" ON "affiliate_clicks" USING btree ("fabricId");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_retailerId" ON "affiliate_clicks" USING btree ("retailerId");--> statement-breakpoint
CREATE INDEX "idx_affiliate_clicks_createdAt" ON "affiliate_clicks" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_blocks_category" ON "blocks" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_blocks_isDefault" ON "blocks" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_blocks_userId" ON "blocks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_userId" ON "fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isDefault" ON "fabrics" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_fabrics_colorFamily" ON "fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer" ON "fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "idx_fabrics_value" ON "fabrics" USING btree ("value");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isAffiliate" ON "fabrics" USING btree ("isAffiliate");--> statement-breakpoint
CREATE INDEX "idx_fabrics_retailerId" ON "fabrics" USING btree ("retailerId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_isActive" ON "fabrics" USING btree ("isActive");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fabrics_retailer_sku_unique" ON "fabrics" USING btree ("retailerId","retailerProductSku");--> statement-breakpoint
CREATE INDEX "idx_ingest_jobs_retailerSlug" ON "ingest_jobs" USING btree ("retailerSlug");--> statement-breakpoint
CREATE INDEX "idx_ingest_jobs_status" ON "ingest_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ingest_jobs_createdAt" ON "ingest_jobs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_category" ON "layout_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_isDefault" ON "layout_templates" USING btree ("isDefault");--> statement-breakpoint
CREATE INDEX "idx_layout_templates_isPublished" ON "layout_templates" USING btree ("isPublished");--> statement-breakpoint
CREATE INDEX "idx_printlists_userId" ON "printlists" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_projects_userId" ON "projects" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_userId" ON "user_fabrics" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_colorFamily" ON "user_fabrics" USING btree ("colorFamily");--> statement-breakpoint
CREATE INDEX "idx_user_fabrics_manufacturer" ON "user_fabrics" USING btree ("manufacturer");--> statement-breakpoint
CREATE INDEX "users_cognito_sub_unique" ON "users" USING btree ("cognito_sub") WHERE cognito_sub IS NOT NULL;