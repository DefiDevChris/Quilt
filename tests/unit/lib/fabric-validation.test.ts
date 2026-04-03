import { describe, it, expect } from 'vitest';
import {
  fabricSearchSchema,
  createFabricSchema,
  presignedUrlSchema,
} from '@/lib/validation';

describe('fabricSearchSchema', () => {
  it('parses valid search params with defaults', () => {
    const result = fabricSearchSchema.parse({});
    expect(result.scope).toBe('system');
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
    expect(result.search).toBeUndefined();
    expect(result.manufacturer).toBeUndefined();
    expect(result.colorFamily).toBeUndefined();
  });

  it('accepts all optional filters', () => {
    const result = fabricSearchSchema.parse({
      search: 'kona',
      manufacturer: 'Robert Kaufman',
      colorFamily: 'Blue',
      scope: 'all',
      page: '2',
      limit: '25',
    });
    expect(result.search).toBe('kona');
    expect(result.manufacturer).toBe('Robert Kaufman');
    expect(result.colorFamily).toBe('Blue');
    expect(result.scope).toBe('all');
    expect(result.page).toBe(2);
    expect(result.limit).toBe(25);
  });

  it('rejects invalid scope', () => {
    const result = fabricSearchSchema.safeParse({ scope: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('coerces string page and limit', () => {
    const result = fabricSearchSchema.parse({ page: '5', limit: '10' });
    expect(result.page).toBe(5);
    expect(result.limit).toBe(10);
  });

  it('rejects limit exceeding max', () => {
    const result = fabricSearchSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });
});

describe('createFabricSchema', () => {
  it('parses valid fabric data with defaults', () => {
    const result = createFabricSchema.parse({
      name: 'Kona Cotton - White',
      imageUrl: 'https://example.com/white.jpg',
    });
    expect(result.name).toBe('Kona Cotton - White');
    expect(result.imageUrl).toBe('https://example.com/white.jpg');
    expect(result.scaleX).toBe(1.0);
    expect(result.scaleY).toBe(1.0);
    expect(result.rotation).toBe(0.0);
  });

  it('accepts optional fields', () => {
    const result = createFabricSchema.parse({
      name: 'My Fabric',
      imageUrl: 'https://example.com/img.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      manufacturer: 'Test Manufacturer',
      sku: 'SKU-123',
      scaleX: 1.5,
      scaleY: 1.5,
      rotation: 45,
    });
    expect(result.manufacturer).toBe('Test Manufacturer');
    expect(result.sku).toBe('SKU-123');
    expect(result.scaleX).toBe(1.5);
    expect(result.rotation).toBe(45);
  });

  it('rejects empty name', () => {
    const result = createFabricSchema.safeParse({
      name: '',
      imageUrl: 'https://example.com/img.jpg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing imageUrl', () => {
    const result = createFabricSchema.safeParse({
      name: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects scale out of range', () => {
    const result = createFabricSchema.safeParse({
      name: 'Test',
      imageUrl: 'https://example.com/img.jpg',
      scaleX: 0.01,
    });
    expect(result.success).toBe(false);
  });
});

describe('presignedUrlSchema', () => {
  it('parses valid presigned URL request', () => {
    const result = presignedUrlSchema.parse({
      filename: 'fabric-photo.jpg',
      contentType: 'image/jpeg',
      purpose: 'fabric',
    });
    expect(result.filename).toBe('fabric-photo.jpg');
    expect(result.contentType).toBe('image/jpeg');
    expect(result.purpose).toBe('fabric');
  });

  it('accepts all valid content types', () => {
    expect(presignedUrlSchema.parse({ filename: 'a.png', contentType: 'image/png', purpose: 'thumbnail' }).contentType).toBe('image/png');
    expect(presignedUrlSchema.parse({ filename: 'a.webp', contentType: 'image/webp', purpose: 'export' }).contentType).toBe('image/webp');
  });

  it('rejects invalid content type', () => {
    const result = presignedUrlSchema.safeParse({
      filename: 'a.gif',
      contentType: 'image/gif',
      purpose: 'fabric',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid purpose', () => {
    const result = presignedUrlSchema.safeParse({
      filename: 'a.jpg',
      contentType: 'image/jpeg',
      purpose: 'avatar',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty filename', () => {
    const result = presignedUrlSchema.safeParse({
      filename: '',
      contentType: 'image/jpeg',
      purpose: 'fabric',
    });
    expect(result.success).toBe(false);
  });
});
