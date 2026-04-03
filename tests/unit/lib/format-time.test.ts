import { formatRelativeTime } from '@/lib/format-time';

describe('formatRelativeTime', () => {
  it('returns "just now" for future dates', () => {
    const future = new Date(Date.now() + 1000);
    expect(formatRelativeTime(future)).toBe('just now');
  });

  it('returns years for dates over 365 days ago', () => {
    const past = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(past)).toBe('1y ago');
  });
});
