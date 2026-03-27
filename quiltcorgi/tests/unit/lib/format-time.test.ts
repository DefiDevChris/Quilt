import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatRelativeTime } from '@/lib/format-time';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T12:00:30Z'));

    expect(formatRelativeTime(new Date('2026-03-27T12:00:00Z'))).toBe('just now');
    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('just now');
  });

  it('returns "just now" for timestamps 0 seconds ago', () => {
    vi.useFakeTimers();
    const now = new Date('2026-03-27T12:00:00Z');
    vi.setSystemTime(now);

    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('returns minutes ago for timestamps 1-59 minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T12:05:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('5m ago');
  });

  it('returns "1m ago" for exactly 60 seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T12:01:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('1m ago');
  });

  it('returns "59m ago" for 59 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T12:59:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('59m ago');
  });

  it('returns hours ago for timestamps 1-23 hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T15:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('3h ago');
  });

  it('returns "1h ago" for exactly 60 minutes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T13:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('1h ago');
  });

  it('returns "23h ago" for 23 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T11:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('23h ago');
  });

  it('returns days ago for timestamps 1-6 days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-30T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('3d ago');
  });

  it('returns "1d ago" for exactly 24 hours', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-28T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('1d ago');
  });

  it('returns "6d ago" for 6 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-02T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('6d ago');
  });

  it('returns weeks ago for timestamps 7+ days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('2w ago');
  });

  it('returns "1w ago" for exactly 7 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-03T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('1w ago');
  });

  it('handles Date object input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T14:00:00Z'));

    expect(formatRelativeTime(new Date('2026-03-27T12:00:00Z'))).toBe('2h ago');
  });

  it('handles ISO string input', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-27T14:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('2h ago');
  });

  it('handles large week values', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00Z'));

    expect(formatRelativeTime('2026-03-27T12:00:00Z')).toBe('13w ago');
  });
});
