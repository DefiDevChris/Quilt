ALTER TABLE "fabrics" ADD COLUMN "isPurchasable" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "shopifyProductId" varchar(255);--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "shopifyVariantId" varchar(255);--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "pricePerYard" integer;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "inStock" boolean NOT NULL DEFAULT true;--> statement-breakpoint
CREATE INDEX "idx_fabrics_isPurchasable" ON "fabrics" USING btree ("isPurchasable");--> statement-breakpoint
CREATE INDEX "idx_fabrics_shopifyProductId" ON "fabrics" USING btree ("shopifyProductId");--> statement-breakpoint
CREATE INDEX "idx_fabrics_inStock" ON "fabrics" USING btree ("inStock");
