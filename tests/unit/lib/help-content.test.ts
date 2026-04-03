import { describe, it, expect } from 'vitest';
import {
  FAQ_ENTRIES,
  KEYBOARD_SHORTCUTS,
  FaqEntrySchema,
  FaqCategorySchema,
  KeyboardShortcutSchema,
  FAQ_CATEGORY_LABELS,
  getContextualHelp,
  searchFaq,
  getFaqByCategory,
} from '@/lib/help-content';

describe('help-content', () => {
  describe('FAQ_ENTRIES', () => {
    it('has at least 12 entries', () => {
      expect(FAQ_ENTRIES.length).toBeGreaterThanOrEqual(12);
    });

    it('all entries pass Zod validation', () => {
      for (const entry of FAQ_ENTRIES) {
        expect(() => FaqEntrySchema.parse(entry)).not.toThrow();
      }
    });

    it('all entry ids are unique', () => {
      const ids = FAQ_ENTRIES.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('covers all four categories', () => {
      const categories = new Set(FAQ_ENTRIES.map((e) => e.category));
      expect(categories.has('getting-started')).toBe(true);
      expect(categories.has('design-tools')).toBe(true);
      expect(categories.has('export')).toBe(true);
      expect(categories.has('account')).toBe(true);
    });
  });

  describe('KEYBOARD_SHORTCUTS', () => {
    it('has at least 10 shortcuts', () => {
      expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThanOrEqual(10);
    });

    it('all shortcuts pass Zod validation', () => {
      for (const shortcut of KEYBOARD_SHORTCUTS) {
        expect(() => KeyboardShortcutSchema.parse(shortcut)).not.toThrow();
      }
    });

    it('includes V for Select', () => {
      const selectShortcut = KEYBOARD_SHORTCUTS.find((s) => s.key === 'V');
      expect(selectShortcut).toBeDefined();
      expect(selectShortcut?.description).toContain('Select');
    });

    it('includes Ctrl+Z for Undo', () => {
      const undoShortcut = KEYBOARD_SHORTCUTS.find((s) => s.key === 'Ctrl+Z');
      expect(undoShortcut).toBeDefined();
      expect(undoShortcut?.description).toContain('Undo');
    });
  });

  describe('FaqCategorySchema', () => {
    it('accepts valid categories', () => {
      expect(() => FaqCategorySchema.parse('getting-started')).not.toThrow();
      expect(() => FaqCategorySchema.parse('design-tools')).not.toThrow();
      expect(() => FaqCategorySchema.parse('export')).not.toThrow();
      expect(() => FaqCategorySchema.parse('account')).not.toThrow();
    });

    it('rejects invalid categories', () => {
      expect(() => FaqCategorySchema.parse('invalid')).toThrow();
    });
  });

  describe('FAQ_CATEGORY_LABELS', () => {
    it('has labels for all categories', () => {
      expect(FAQ_CATEGORY_LABELS['getting-started']).toBe('Getting Started');
      expect(FAQ_CATEGORY_LABELS['design-tools']).toBe('Design Tools');
      expect(FAQ_CATEGORY_LABELS['export']).toBe('Export');
      expect(FAQ_CATEGORY_LABELS['account']).toBe('Account');
    });
  });

  describe('getContextualHelp', () => {
    it('returns help for known tools', () => {
      const selectHelp = getContextualHelp('select');
      expect(selectHelp).toContain('select');
    });

    it('returns help for rectangle tool', () => {
      const help = getContextualHelp('rectangle');
      expect(help).toContain('rectangle');
    });

    it('returns default message for unknown tool', () => {
      const help = getContextualHelp('nonexistent');
      expect(help).toContain('Select a tool');
    });
  });

  describe('searchFaq', () => {
    it('returns all entries for empty query', () => {
      const results = searchFaq('');
      expect(results).toHaveLength(FAQ_ENTRIES.length);
    });

    it('returns all entries for whitespace-only query', () => {
      const results = searchFaq('   ');
      expect(results).toHaveLength(FAQ_ENTRIES.length);
    });

    it('filters by title match', () => {
      const results = searchFaq('PDF');
      expect(results.length).toBeGreaterThan(0);
      for (const r of results) {
        const matchesTitle = r.title.toLowerCase().includes('pdf');
        const matchesContent = r.content.toLowerCase().includes('pdf');
        expect(matchesTitle || matchesContent).toBe(true);
      }
    });

    it('filters by content match', () => {
      const results = searchFaq('fabric');
      expect(results.length).toBeGreaterThan(0);
    });

    it('is case insensitive', () => {
      const upper = searchFaq('QUILT');
      const lower = searchFaq('quilt');
      expect(upper).toEqual(lower);
    });

    it('returns empty array when nothing matches', () => {
      const results = searchFaq('xyznonexistent12345');
      expect(results).toHaveLength(0);
    });
  });

  describe('getFaqByCategory', () => {
    it('returns only entries from the specified category', () => {
      const results = getFaqByCategory('getting-started');
      expect(results.length).toBeGreaterThan(0);
      for (const entry of results) {
        expect(entry.category).toBe('getting-started');
      }
    });

    it('returns entries for all categories', () => {
      const categories = ['getting-started', 'design-tools', 'export', 'account'] as const;
      for (const cat of categories) {
        const results = getFaqByCategory(cat);
        expect(results.length).toBeGreaterThan(0);
      }
    });
  });
});
