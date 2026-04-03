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

ALTER TABLE "project_templates" ADD CONSTRAINT "project_templates_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "idx_project_templates_userId" ON "project_templates" USING btree ("userId");
