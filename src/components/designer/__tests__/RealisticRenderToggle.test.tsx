// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock designerStore
vi.mock('@/stores/designerStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/designerStore')>();
  return {
    ...actual,
    useDesignerStore: vi.fn((selector: unknown) => {
      const state = { realisticMode: false, setRealisticMode: vi.fn() };
      if (typeof selector === 'function') return selector(state);
      return state;
    }),
  };
});

vi.mock('@/lib/design-system', () => ({
  Z_INDEX: { overlay: 9999 },
}));

import { RealisticRenderToggle } from '@/components/designer/RealisticRenderToggle';
import { useDesignerStore } from '@/stores/designerStore';

describe('RealisticRenderToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: false, setRealisticMode: vi.fn() };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
  });

  it('renders a button with accessible label', () => {
    render(<RealisticRenderToggle />);

    expect(screen.getByRole('button', { name: /toggle realistic rendering/i })).toBeDefined();
  });

  it('shows as disabled/off when realisticMode is false', () => {
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: false, setRealisticMode: vi.fn() };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('shows as enabled/on when realisticMode is true', () => {
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: true, setRealisticMode: vi.fn() };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setRealisticMode(true) when clicked while off', () => {
    const setMock = vi.fn();
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: false, setRealisticMode: setMock };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });
    fireEvent.click(button);

    expect(setMock).toHaveBeenCalledWith(true);
  });

  it('calls setRealisticMode(false) when clicked while on', () => {
    const setMock = vi.fn();
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: true, setRealisticMode: setMock };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });
    fireEvent.click(button);

    expect(setMock).toHaveBeenCalledWith(false);
  });

  it('toggles state on consecutive clicks', () => {
    const setMock = vi.fn();
    vi.mocked(useDesignerStore).mockImplementation((selector: unknown) => {
      const state = { realisticMode: false, setRealisticMode: setMock };
      if (typeof selector === 'function') return selector(state);
      return state;
    });
    const { rerender } = render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });

    // First click: off -> on
    fireEvent.click(button);
    expect(setMock).toHaveBeenCalledWith(true);

    // Simulate state change and rerender
    vi.mocked(useDesignerStore).mockImplementation((sel: unknown) => {
      const s = { realisticMode: true, setRealisticMode: setMock };
      if (typeof sel === 'function') return sel(s);
      return s;
    });
    rerender(<RealisticRenderToggle />);

    // Second click: on -> off
    fireEvent.click(button);
    expect(setMock).toHaveBeenCalledWith(false);
  });

  it('has correct aria-label for accessibility', () => {
    render(<RealisticRenderToggle />);

    const button = screen.getByRole('button', { name: /toggle realistic rendering/i });
    expect(button.getAttribute('aria-label')).toBe('Toggle realistic rendering');
  });
});
