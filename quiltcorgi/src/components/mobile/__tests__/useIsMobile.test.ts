// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/useIsMobile';

describe('useIsMobile', () => {
  let listeners: Array<(e: { matches: boolean }) => void> = [];
  let currentMatches = false;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: currentMatches,
        media: query,
        addEventListener: (_event: string, fn: (e: { matches: boolean }) => void) => {
          listeners.push(fn);
        },
        removeEventListener: (_event: string, fn: (e: { matches: boolean }) => void) => {
          listeners = listeners.filter((l) => l !== fn);
        },
      }))
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when viewport is below 768px', () => {
    currentMatches = true;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when viewport is 768px or wider', () => {
    currentMatches = false;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when viewport changes', () => {
    currentMatches = false;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      listeners.forEach((fn) => fn({ matches: true }));
    });
    expect(result.current).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    currentMatches = false;
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners.length).toBe(1);
    unmount();
    expect(listeners.length).toBe(0);
  });
});
