import { describe, it, expect } from 'vitest';
import {
  FABRICS_PAGINATION_DEFAULT_LIMIT,
  FABRICS_PAGINATION_MAX_LIMIT,
  THUMBNAIL_SIZE,
  FABRIC_IMAGE_MAX_SIZE,
  S3_UPLOAD_EXPIRY_SECONDS,
  COLOR_FAMILIES,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_IMAGE_TYPES,
} from '@/lib/constants';

describe('fabric constants', () => {
  it('has correct pagination limits', () => {
    expect(FABRICS_PAGINATION_DEFAULT_LIMIT).toBe(50);
    expect(FABRICS_PAGINATION_MAX_LIMIT).toBe(100);
  });

  it('has correct image dimensions', () => {
    expect(THUMBNAIL_SIZE).toBe(200);
    expect(FABRIC_IMAGE_MAX_SIZE).toBe(2048);
  });

  it('has correct S3 upload expiry', () => {
    expect(S3_UPLOAD_EXPIRY_SECONDS).toBe(300);
  });

  it('has all expected color families', () => {
    expect(COLOR_FAMILIES).toContain('Red');
    expect(COLOR_FAMILIES).toContain('Blue');
    expect(COLOR_FAMILIES).toContain('Green');
    expect(COLOR_FAMILIES).toContain('White');
    expect(COLOR_FAMILIES).toContain('Black');
    expect(COLOR_FAMILIES).toContain('Multi');
    expect(COLOR_FAMILIES.length).toBe(13);
  });

  it('has correct file upload limits', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/png');
    expect(ACCEPTED_IMAGE_TYPES).toContain('image/webp');
  });
});
