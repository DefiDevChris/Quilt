/**
 * MobileDrawer — "Design on Desktop" href
 *
 * Validates that the "Design on Desktop" link points to /dashboard, not /studio.
 * Mobile users are redirected away from studio (StudioGate), so the drawer
 * correctly routes them to the dashboard where they can see their projects.
 */

/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MobileDrawer } from '../MobileDrawer';

// Mock next/link to render a plain <a> so we can inspect href
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock useAuthStore to return an authenticated user
vi.mock('@/stores/authStore', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    image: null,
    role: 'free' as const,
  };

  const store = {
    user: mockUser,
    setUser: vi.fn(),
    isLoading: false,
    isPro: false,
    isAdmin: false,
  };

  return {
    useAuthStore: (selector: (s: typeof store) => unknown) => selector(store),
  };
});

describe('MobileDrawer — "Design on Desktop" href', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Design on Desktop" link with href="/dashboard" when authenticated', () => {
    render(<MobileDrawer isOpen={true} onClose={vi.fn()} />);

    const designLink = screen.getByText('Design on Desktop').closest('a');
    expect(designLink).not.toBeNull();
    expect(
      designLink!.getAttribute('href'),
      '"Design on Desktop" href should be "/dashboard"'
    ).toBe('/dashboard');
  });

  it('does not render Social Threads or Blog links in the drawer', () => {
    render(<MobileDrawer isOpen={true} onClose={vi.fn()} />);
    expect(screen.queryByText('Social Threads')).toBeNull();
    expect(screen.queryByText('Blog')).toBeNull();
  });
});
