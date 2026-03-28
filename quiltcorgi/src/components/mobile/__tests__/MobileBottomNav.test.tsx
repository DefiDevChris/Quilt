// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/community',
}));

describe('MobileBottomNav', () => {
  it('renders all 5 nav items', () => {
    render(<MobileBottomNav onFabPress={() => {}} />);
    expect(screen.getByText('Feed')).toBeDefined();
    expect(screen.getByText('Library')).toBeDefined();
    expect(screen.getByText('Discover')).toBeDefined();
    expect(screen.getByText('Profile')).toBeDefined();
    expect(screen.getByLabelText('Upload')).toBeDefined();
  });

  it('highlights Feed as active when on /community', () => {
    render(<MobileBottomNav onFabPress={() => {}} />);
    const feedLink = screen.getByText('Feed').closest('a');
    expect(feedLink?.getAttribute('aria-current')).toBe('page');
  });

  it('calls onFabPress when FAB is tapped', () => {
    const onFabPress = vi.fn();
    render(<MobileBottomNav onFabPress={onFabPress} />);
    fireEvent.click(screen.getByLabelText('Upload'));
    expect(onFabPress).toHaveBeenCalledOnce();
  });
});
