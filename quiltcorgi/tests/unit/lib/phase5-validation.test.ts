import { describe, it, expect } from 'vitest';
import { createBlockSchema } from '@/lib/validation';

describe('createBlockSchema', () => {
  it('validates a valid custom block', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group', objects: [] },
      tags: ['custom', 'modern'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = createBlockSchema.safeParse({
      name: '',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing category', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: '',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing svgData', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('defaults tags to empty array', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
    }
  });

  it('rejects name over 255 chars', () => {
    const result = createBlockSchema.safeParse({
      name: 'A'.repeat(256),
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects category over 100 chars', () => {
    const result = createBlockSchema.safeParse({
      name: 'My Block',
      category: 'C'.repeat(101),
      svgData: '<svg></svg>',
      fabricJsData: { type: 'Group' },
    });
    expect(result.success).toBe(false);
  });
});
