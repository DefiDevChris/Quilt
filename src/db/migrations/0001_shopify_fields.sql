ALTER TABLE "fabrics" ADD COLUMN "isPurchasable" boolean DEFAULT false NOT NULL;
ALTER TABLE "fabrics" ADD COLUMN "shopifyProductId" varchar(255);
ALTER TABLE "fabrics" ADD COLUMN "shopifyVariantId" varchar(255);
ALTER TABLE "fabrics" ADD COLUMN "pricePerYard" integer;
ALTER TABLE "fabrics" ADD COLUMN "inStock" boolean DEFAULT true NOT NULL;
