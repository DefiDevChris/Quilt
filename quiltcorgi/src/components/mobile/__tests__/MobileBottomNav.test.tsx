// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('@/stores/authStore', () => {
  const store = {
    user: null,
    setUser: vi.fn(),
    isLoading: false,
    isPro: false,
    isAdmin: false,
  };
  return {
    useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
  };
});

describe('MobileBottomNav', () => {
  it('renders 3 nav items: Home, Upload FAB, and Sign In for guests', () => {
    render(<MobileBottomNav onFabPress={() => {}} />);
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByLabelText('Upload')).toBeDefined();
    expect(screen.getByText('Sign In')).toBeDefined();
  });

  it('highlights Home as active when on /', () => {
    render(<MobileBottomNav onFabPress={() => {}} />);
    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink?.getAttribute('aria-current')).toBe('page');
  });

  it('calls onFabPress when FAB is tapped', () => {
    const onFabPress = vi.fn();
    render(<MobileBottomNav onFabPress={onFabPress} />);
    fireEvent.click(screen.getByLabelText('Upload'));
    expect(onFabPress).toHaveBeenCalledOnce();
  });

  it('does not render Feed, Library, or Discover tabs', () => {
    render(<MobileBottomNav onFabPress={() => {}} />);
    expect(screen.queryByText('Feed')).toBeNull();
    expect(screen.queryByText('Library')).toBeNull();
    expect(screen.queryByText('Discover')).toBeNull();
  });
});
