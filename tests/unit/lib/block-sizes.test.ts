import { describe, it, expect } from 'vitest';
import { createBlockSchema } from '@/lib/validation';

describe('block sizing 1:1 invariant', () => {
  it('validates default block dimensions are 12 inches', () => {
    const parsed = createBlockSchema.safeParse({
      name: 'Test Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: {},
    });
    
    expect(parsed.success).toBe(true);
    expect(parsed.data?.widthIn).toBe(12);
    expect(parsed.data?.heightIn).toBe(12);
  });

  it('accepts custom block dimensions', () => {
    const parsed = createBlockSchema.safeParse({
      name: 'Test Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: {},
      widthIn: 6,
      heightIn: 6,
    });
    
    expect(parsed.success).toBe(true);
    expect(parsed.data?.widthIn).toBe(6);
    expect(parsed.data?.heightIn).toBe(6);
  });

  it('accepts non-square block dimensions', () => {
    const parsed = createBlockSchema.safeParse({
      name: 'Test Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: {},
      widthIn: 8,
      heightIn: 12,
    });
    
    expect(parsed.success).toBe(true);
    expect(parsed.data?.widthIn).toBe(8);
    expect(parsed.data?.heightIn).toBe(12);
  });

  it('converts string dimensions to numbers', () => {
    const parsed = createBlockSchema.safeParse({
      name: 'Test Block',
      category: 'Custom',
      svgData: '<svg></svg>',
      fabricJsData: {},
      widthIn: '6',
      heightIn: '6',
    });
    
    expect(parsed.success).toBe(true);
    expect(parsed.data?.widthIn).toBe(6);
    expect(parsed.data?.heightIn).toBe(6);
  });
});