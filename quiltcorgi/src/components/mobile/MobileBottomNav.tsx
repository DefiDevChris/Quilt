'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface MobileBottomNavProps {
  onFabPress: () => void;
}

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const stroke = active ? 'var(--color-primary-golden)' : 'var(--color-outline-variant)';
  const strokeWidth = active ? 1.8 : 1.5;

  switch (label) {
    case 'Feed':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'Library':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'Discover':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'Profile':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'Sign In':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
      );
    default:
      return null;
  }
}

export function MobileBottomNav({ onFabPress }: MobileBottomNavProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;

  function isActive(match: string): boolean {
    if (!match) return false;
    return pathname.startsWith(match);
  }

  const NAV_ITEMS = [
    { href: '/socialthreads', label: 'Feed', match: '/socialthreads' },
    { href: '/dashboard', label: 'Library', match: '/dashboard' },
    { href: '', label: 'fab', match: '' },
    { href: '/blog', label: 'Discover', match: '/blog' },
    isAuthenticated
      ? { href: '/profile', label: 'Profile', match: '/profile' }
      : { href: '/auth/signin', label: 'Sign In', match: '/auth/signin' },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around pb-7 pt-2 px-3"
      style={{
        background: 'var(--glass-surface)',
        backdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.4)',
        WebkitBackdropFilter: 'blur(var(--glass-blur-heavy)) saturate(1.4)',
      }}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map((item) => {
        if (item.label === 'fab') {
          return (
            <button
              key="fab"
              type="button"
              onClick={onFabPress}
              aria-label="Upload"
              className="flex flex-col items-center mb-2"
            >
              <div
                className="w-[46px] h-[46px] rounded-full flex items-center justify-center transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(145deg, var(--color-primary-golden), var(--color-primary-golden-light))',
                  boxShadow: 'var(--shadow-fab)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-on)" strokeWidth={2} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </button>
          );
        }

        const active = isActive(item.match);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="flex flex-col items-center gap-1 min-w-[48px] py-1"
          >
            <NavIcon label={item.label} active={active} />
            <span
              className="text-[9px] font-semibold uppercase tracking-wide"
              style={{ color: active ? 'var(--color-primary-golden)' : 'var(--color-outline-variant)' }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
