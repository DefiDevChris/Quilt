import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_UPLOAD_EXPIRY_SECONDS, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

const awsVarsPresent =
  process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_S3_BUCKET;

if (awsVarsPresent) {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID must be set when any AWS variable is configured');
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY must be set when any AWS variable is configured');
  }
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET must be set when any AWS variable is configured');
  }
}

const s3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

const s3Client = s3Configured
  ? new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

const bucket = process.env.AWS_S3_BUCKET ?? '';
const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL ?? '';

interface PresignedUrlParams {
  userId: string;
  filename: string;
  contentType: string;
  purpose: 'fabric' | 'thumbnail' | 'export' | 'block';
}

export async function generatePresignedUrl({
  userId,
  filename,
  contentType,
  purpose,
}: PresignedUrlParams) {
  if (!s3Client) {
    throw new Error(
      'S3 is not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET.'
    );
  }
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[contentType] ?? 'jpg';
  const timestamp = Date.now();
  const fileKey = `${purpose}s/${userId}/${timestamp}-${sanitizeFilename(filename)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: contentType,
    ContentLength: MAX_FILE_SIZE_BYTES,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: S3_UPLOAD_EXPIRY_SECONDS,
  });

  const publicUrl = cloudfrontUrl
    ? `${cloudfrontUrl}/${fileKey}`
    : `https://${bucket}.s3.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, publicUrl };
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64)
    .toLowerCase();
}

export async function uploadCanvasDataToS3(
  userId: string,
  projectId: string,
  data: Record<string, unknown>
): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 is not configured.');
  }
  const timestamp = Date.now();
  const fileKey = `canvas-data/${userId}/${projectId}/${timestamp}.json`;
  const jsonString = JSON.stringify(data);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: jsonString,
      ContentType: 'application/json',
    })
  );

  return fileKey;
}

export async function downloadCanvasDataFromS3(
  s3Key: string
): Promise<Record<string, unknown> | null> {
  if (!s3Client) return null;

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      })
    );

    const bodyString = await response.Body?.transformToString();
    return bodyString ? JSON.parse(bodyString) : null;
  } catch {
    return null;
  }
}
