import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3_UPLOAD_EXPIRY_SECONDS } from '@/lib/constants';

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
});

const bucket = process.env.AWS_S3_BUCKET ?? '';
const cloudfrontUrl = process.env.NEXT_PUBLIC_CLOUDFRONT_URL ?? '';

interface PresignedUrlParams {
  userId: string;
  filename: string;
  contentType: string;
  purpose: 'fabric' | 'thumbnail' | 'export';
}

export async function generatePresignedUrl({
  userId,
  filename,
  contentType,
  purpose,
}: PresignedUrlParams) {
  const ext = filename.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const fileKey = `${purpose}s/${userId}/${timestamp}-${sanitizeFilename(filename)}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: S3_UPLOAD_EXPIRY_SECONDS,
  });

  const publicUrl = cloudfrontUrl
    ? `${cloudfrontUrl}/${fileKey}`
    : `https://${bucket}.s3.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, publicUrl };
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 64)
    .toLowerCase();
}
