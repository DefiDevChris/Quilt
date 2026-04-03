import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock AWS SDK before importing
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor() {}
  },
  PutObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.url'),
}));

vi.stubEnv('AWS_ACCESS_KEY_ID', 'test-key');
vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'test-secret');
vi.stubEnv('AWS_S3_BUCKET', 'test-bucket');
vi.stubEnv('AWS_REGION', 'us-west-2');
vi.stubEnv('NEXT_PUBLIC_CLOUDFRONT_URL', 'https://cdn.test.com');

const { sanitizeFilename, generatePresignedUrl } = await import('@/lib/s3');

describe('sanitizeFilename', () => {
  it('strips the file extension', () => {
    expect(sanitizeFilename('photo.jpg')).toBe('photo');
  });

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(sanitizeFilename('my file (copy).png')).toBe('my-file-copy');
  });

  it('collapses consecutive hyphens into a single hyphen', () => {
    expect(sanitizeFilename('foo...bar.png')).toBe('foo-bar');
  });

  it('trims leading hyphens', () => {
    expect(sanitizeFilename('!!!hello.jpg')).toBe('hello');
  });

  it('trims trailing hyphens', () => {
    expect(sanitizeFilename('hello!!!.jpg')).toBe('hello');
  });

  it('trims both leading and trailing hyphens', () => {
    expect(sanitizeFilename('---hello---.png')).toBe('hello');
  });

  it('converts to lowercase', () => {
    expect(sanitizeFilename('MyPhoto.PNG')).toBe('myphoto');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeFilename('my-file_name.webp')).toBe('my-file_name');
  });

  it('truncates to 64 characters', () => {
    const longName = 'a'.repeat(100) + '.jpg';
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(64);
  });

  it('handles a name with only special characters', () => {
    const result = sanitizeFilename('!!!@@@###.jpg');
    expect(result).toBe('');
  });

  it('handles a name with no extension', () => {
    expect(sanitizeFilename('noextension')).toBe('noextension');
  });

  it('handles multiple dots (only removes last extension)', () => {
    expect(sanitizeFilename('file.backup.tar.gz')).toBe('file-backup-tar');
  });
});

describe('generatePresignedUrl', () => {
  it('generates presigned URL with correct params', async () => {
    const result = await generatePresignedUrl({
      userId: 'user-123',
      filename: 'test-image.png',
      contentType: 'image/png',
      purpose: 'fabric',
    });

    expect(result.uploadUrl).toBe('https://signed.url');
    expect(result.fileKey).toContain('fabrics/user-123/');
    expect(result.fileKey).toContain('-test-image.png');
    expect(result.publicUrl).toBe('https://cdn.test.com/' + result.fileKey);
  });

  it('uses jpg extension for jpeg content type', async () => {
    const result = await generatePresignedUrl({
      userId: 'user-123',
      filename: 'photo',
      contentType: 'image/jpeg',
      purpose: 'thumbnail',
    });
    expect(result.fileKey).toContain('.jpg');
  });

  it('uses webp extension for webp content type', async () => {
    const result = await generatePresignedUrl({
      userId: 'user-123',
      filename: 'photo',
      contentType: 'image/webp',
      purpose: 'export',
    });
    expect(result.fileKey).toContain('.webp');
  });

  it('falls back to jpg for unknown content type', async () => {
    const result = await generatePresignedUrl({
      userId: 'user-123',
      filename: 'photo',
      contentType: 'application/octet-stream',
      purpose: 'fabric',
    });
    expect(result.fileKey).toContain('.jpg');
  });
});
