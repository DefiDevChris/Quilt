import { describe, it, expect } from 'vitest';
import { formatCreatorName } from '@/lib/format-utils';

describe('format-utils', () => {
  describe('formatCreatorName', () => {
    it('formats two-part names as "First L."', () => {
      expect(formatCreatorName('John Doe')).toBe('John D.');
      expect(formatCreatorName('Jane Smith')).toBe('Jane S.');
    });

    it('returns single-word names as-is', () => {
      expect(formatCreatorName('Bob')).toBe('Bob');
    });

    it('handles empty strings', () => {
      expect(formatCreatorName('')).toBe('');
    });

    it('handles multiple spaces', () => {
      expect(formatCreatorName('Mary Jane Watson')).toBe('Mary J.');
    });
  });
});
