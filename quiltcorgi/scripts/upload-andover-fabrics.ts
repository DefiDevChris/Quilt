/**
 * Upload Andover Fabrics print images to S3 and generate seed data.
 *
 * Reads each collection's manifest.json from the local graphics directory,
 * uploads images to S3 under `fabrics/andover/<collection-slug>/<sku>.jpg`,
 * then writes a generated TypeScript seed file with CloudFront URLs.
 *
 * Usage:
 *   npx tsx scripts/upload-andover-fabrics.ts
 *
 * Required environment variables:
 *   AWS_ACCESS_KEY_ID      — AWS credentials
 *   AWS_SECRET_ACCESS_KEY  — AWS credentials
 *   AWS_S3_BUCKET          — Target S3 bucket name
 *   AWS_REGION             — AWS region (defaults to us-east-1)
 *   NEXT_PUBLIC_CLOUDFRONT_URL — CloudFront distribution URL (optional, falls back to S3 URL)
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SOURCE_DIR = '/home/chrishoran/Downloads/quilting-graphics/andover-fabrics';
const OUTPUT_FILE = resolve(__dirname, '../src/db/seed/generated-andover-seed.ts');
const BATCH_SIZE = 10;

interface ManifestEntry {
  sku: string;
  name: string;
  colorFamily: string;
  filename: string;
}

interface CollectionManifest {
  collection: string;
  fabrics: ManifestEntry[];
}

interface UploadedFabric {
  name: string;
  manufacturer: string;
  sku: string;
  collection: string;
  colorFamily: string;
  imageUrl: string;
}

// ---------------------------------------------------------------------------
// S3 setup
// ---------------------------------------------------------------------------

function createS3Client(): S3Client {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Missing required environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET'
    );
  }

  return new S3Client({
    region: process.env.AWS_REGION ?? 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
  });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildPublicUrl(key: string): string {
  const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  const bucket = process.env.AWS_S3_BUCKET!;

  return cloudfrontUrl ? `${cloudfrontUrl}/${key}` : `https://${bucket}.s3.amazonaws.com/${key}`;
}

// ---------------------------------------------------------------------------
// Upload logic
// ---------------------------------------------------------------------------

async function uploadFile(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

async function uploadBatch(
  client: S3Client,
  bucket: string,
  collectionSlug: string,
  collectionDir: string,
  entries: ManifestEntry[]
): Promise<UploadedFabric[]> {
  const results = await Promise.all(
    entries.map(async (entry) => {
      const filePath = join(collectionDir, entry.filename);

      if (!existsSync(filePath)) {
        console.warn(`  [SKIP] File not found: ${filePath}`);
        return null;
      }

      const body = readFileSync(filePath);
      const key = `fabrics/andover/${collectionSlug}/${entry.sku}.jpg`;

      await uploadFile(client, bucket, key, body, 'image/jpeg');

      const imageUrl = buildPublicUrl(key);
      console.log(`  [OK] ${entry.sku} -> ${key}`);

      return { imageUrl, ...entry };
    })
  );

  return results
    .filter((r): r is ManifestEntry & { imageUrl: string } => r !== null)
    .map((r) => ({
      name: r.name,
      manufacturer: 'Andover Fabrics',
      sku: r.sku,
      collection: '', // filled by caller
      colorFamily: r.colorFamily,
      imageUrl: r.imageUrl,
    }));
}

async function processCollection(
  client: S3Client,
  bucket: string,
  collectionDir: string
): Promise<UploadedFabric[]> {
  const manifestPath = join(collectionDir, 'manifest.json');

  if (!existsSync(manifestPath)) {
    console.warn(`[SKIP] No manifest.json in ${collectionDir}`);
    return [];
  }

  const raw = readFileSync(manifestPath, 'utf-8');
  const manifest: CollectionManifest = JSON.parse(raw);
  const collectionSlug = slugify(manifest.collection);

  console.log(
    `\nProcessing collection: ${manifest.collection} (${manifest.fabrics.length} fabrics)`
  );

  const allUploaded: UploadedFabric[] = [];

  // Process fabrics in batches to avoid overwhelming S3
  for (let i = 0; i < manifest.fabrics.length; i += BATCH_SIZE) {
    const batch = manifest.fabrics.slice(i, i + BATCH_SIZE);
    const uploaded = await uploadBatch(client, bucket, collectionSlug, collectionDir, batch);

    // Assign collection name
    const withCollection = uploaded.map((f) => ({
      ...f,
      collection: manifest.collection,
    }));

    allUploaded.push(...withCollection);

    const progress = Math.min(i + BATCH_SIZE, manifest.fabrics.length);
    console.log(`  Progress: ${progress}/${manifest.fabrics.length}`);
  }

  return allUploaded;
}

// ---------------------------------------------------------------------------
// Code generation
// ---------------------------------------------------------------------------

function generateSeedFile(fabrics: UploadedFabric[]): string {
  const fabricsByCollection = new Map<string, UploadedFabric[]>();

  for (const fabric of fabrics) {
    const existing = fabricsByCollection.get(fabric.collection) ?? [];
    fabricsByCollection.set(fabric.collection, [...existing, fabric]);
  }

  const entries = fabrics
    .map(
      (f) =>
        `  {\n` +
        `    name: '${escapeString(f.name)}',\n` +
        `    manufacturer: '${escapeString(f.manufacturer)}',\n` +
        `    sku: '${escapeString(f.sku)}',\n` +
        `    collection: '${escapeString(f.collection)}',\n` +
        `    colorFamily: '${escapeString(f.colorFamily)}',\n` +
        `    imageUrl: '${escapeString(f.imageUrl)}',\n` +
        `  }`
    )
    .join(',\n');

  return (
    `/**\n` +
    ` * Generated Andover Fabrics seed data with resolved CloudFront URLs.\n` +
    ` *\n` +
    ` * AUTO-GENERATED — do not edit manually.\n` +
    ` * Re-run: npx tsx scripts/upload-andover-fabrics.ts\n` +
    ` *\n` +
    ` * Collections: ${Array.from(fabricsByCollection.keys()).join(', ')}\n` +
    ` * Total fabrics: ${fabrics.length}\n` +
    ` */\n\n` +
    `import { FabricDefinition } from './fabricDefinitions';\n\n` +
    `export interface AndoverFabricDefinition extends FabricDefinition {\n` +
    `  imageUrl: string;\n` +
    `}\n\n` +
    `export const andoverFabrics: AndoverFabricDefinition[] = [\n` +
    entries +
    `\n];\n`
  );
}

function escapeString(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('Andover Fabrics Upload Script');
  console.log('============================');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_FILE}`);

  if (!existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`);
  }

  const client = createS3Client();
  const bucket = process.env.AWS_S3_BUCKET!;

  // Discover collection directories
  const collectionDirs = readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(SOURCE_DIR, entry.name))
    .sort();

  if (collectionDirs.length === 0) {
    throw new Error(`No collection directories found in ${SOURCE_DIR}`);
  }

  console.log(`\nFound ${collectionDirs.length} collection(s)`);

  const allFabrics: UploadedFabric[] = [];

  // Process collections sequentially to keep logs readable
  for (const dir of collectionDirs) {
    try {
      const fabrics = await processCollection(client, bucket, dir);
      allFabrics.push(...fabrics);
    } catch (error) {
      console.error(`[ERROR] Failed to process ${dir}:`, error);
    }
  }

  if (allFabrics.length === 0) {
    console.warn('\nNo fabrics were uploaded. Check your manifest files.');
    return;
  }

  // Write the generated seed file
  const seedContent = generateSeedFile(allFabrics);
  writeFileSync(OUTPUT_FILE, seedContent, 'utf-8');

  console.log(`\nDone! Uploaded ${allFabrics.length} fabric(s).`);
  console.log(`Generated seed file: ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
