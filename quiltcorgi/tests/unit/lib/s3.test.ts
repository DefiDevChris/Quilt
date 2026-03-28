import { describe, it, expect } from 'vitest';

// sanitizeFilename is the only pure function we can test without AWS credentials
// We import it directly to avoid triggering the S3 client initialization
const { sanitizeFilename } = await import('@/lib/s3');

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
