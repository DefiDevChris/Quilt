import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { createHash } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

const bucket = process.env.AWS_S3_BUCKET ?? '';
const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL ?? '';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

export async function rehostImage(
  sourceUrl: string,
): Promise<{ imageUrl: string; thumbnailUrl: string; contentHash: string }> {
  const contentHash = await computeContentHash(sourceUrl);

  const mainKey = `affiliate-fabrics/${contentHash}.jpg`;
  const thumbKey = `affiliate-fabrics/thumbs/${contentHash}.webp`;

  const existing = await checkExisting(mainKey, thumbKey);
  if (existing) return existing;

  const sourceBuffer = await downloadImage(sourceUrl);

  const jpegBuffer = await sharp(sourceBuffer)
    .jpeg({ quality: 90 })
    .toBuffer();

  const thumbnailBuffer = await sharp(sourceBuffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  await Promise.all([
    s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: mainKey,
        Body: jpegBuffer,
        ContentType: 'image/jpeg',
      }),
    ),
    s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
      }),
    ),
  ]);

  return {
    imageUrl: buildUrl(mainKey),
    thumbnailUrl: buildUrl(thumbKey),
    contentHash,
  };
}

async function computeContentHash(url: string): Promise<string> {
  const buffer = await downloadImage(url);
  return createHash('sha256').update(buffer).digest('hex');
}

async function checkExisting(
  mainKey: string,
  thumbKey: string,
): Promise<{ imageUrl: string; thumbnailUrl: string; contentHash: string } | null> {
  try {
    await s3Client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: mainKey }),
    );
    const hash = mainKey.replace('affiliate-fabrics/', '').replace('.jpg', '');
    return {
      imageUrl: buildUrl(mainKey),
      thumbnailUrl: buildUrl(thumbKey),
      contentHash: hash,
    };
  } catch {
    return null;
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Failed to download image: ${response.status}`);

  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_IMAGE_SIZE) {
    throw new Error(`Image exceeds max size: ${contentLength} bytes`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error(`Image exceeds max size: ${buffer.length} bytes`);
  }

  return buffer;
}

function buildUrl(key: string): string {
  if (cloudfrontUrl) return `${cloudfrontUrl}/${key}`;
  return `https://${bucket}.s3.amazonaws.com/${key}`;
}
