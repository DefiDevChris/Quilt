import { describe, it, expect } from 'vitest';
import { generateUsername } from '@/lib/username';

describe('generateUsername', () => {
  it('lowercases the display name', () => {
    const result = generateUsername('Alice Smith');
    expect(result).toMatch(/^alice-smith-[0-9a-f]{4}$/);
  });

  it('removes special characters', () => {
    const result = generateUsername('Jane!@#$%Doe');
    expect(result).toMatch(/^janedoe-[0-9a-f]{4}$/);
  });

  it('replaces spaces with hyphens', () => {
    const result = generateUsername('John Quincy Adams');
    expect(result).toMatch(/^john-quincy-adams-[0-9a-f]{4}$/);
  });

  it('collapses multiple spaces into a single hyphen', () => {
    const result = generateUsername('Too   Many    Spaces');
    expect(result).toMatch(/^too-many-spaces-[0-9a-f]{4}$/);
  });

  it('strips leading and trailing hyphens from the base', () => {
    const result = generateUsername(' -Hello World- ');
    expect(result).toMatch(/^hello-world-[0-9a-f]{4}$/);
  });

  it('truncates the base to at most 55 characters', () => {
    const longName = 'a'.repeat(100);
    const result = generateUsername(longName);
    // 55 chars base + '-' + 4 hex = 60 chars total
    expect(result.length).toBe(60);
    expect(result).toMatch(/^a{55}-[0-9a-f]{4}$/);
  });

  it('appends 4 random hex characters', () => {
    const result = generateUsername('Test');
    const suffix = result.split('-').pop();
    expect(suffix).toMatch(/^[0-9a-f]{4}$/);
  });

  it('generates unique usernames for the same input', () => {
    const results = new Set(
      Array.from({ length: 20 }, () => generateUsername('Same Name'))
    );
    // With 4 hex chars (65536 possibilities), 20 calls should all be unique
    expect(results.size).toBe(20);
  });

  it('handles single word names', () => {
    const result = generateUsername('Quilter');
    expect(result).toMatch(/^quilter-[0-9a-f]{4}$/);
  });

  it('handles names with numbers', () => {
    const result = generateUsername('Quilter42');
    expect(result).toMatch(/^quilter42-[0-9a-f]{4}$/);
  });

  it('handles empty string by producing only suffix', () => {
    const result = generateUsername('');
    expect(result).toMatch(/^-[0-9a-f]{4}$/);
  });

  it('handles all-special-character input', () => {
    const result = generateUsername('!@#$%^&*()');
    expect(result).toMatch(/^-[0-9a-f]{4}$/);
  });

  it('preserves existing hyphens in names', () => {
    const result = generateUsername('Mary-Jane Watson');
    expect(result).toMatch(/^mary-jane-watson-[0-9a-f]{4}$/);
  });
});
