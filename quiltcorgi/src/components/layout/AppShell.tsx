'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-background">
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 h-14 bg-surface/90 backdrop-blur-[24px] px-4 flex items-center justify-between transition-shadow ${
          scrolled ? 'shadow-elevation-1' : ''
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold text-on-surface">QuiltCorgi</span>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`text-label-lg transition-colors ${
              isActive('/dashboard')
                ? 'text-on-surface font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/community"
            className={`text-label-lg transition-colors ${
              isActive('/community')
                ? 'text-on-surface font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Community
          </Link>
          <Link
            href="/profile"
            className={`text-label-lg transition-colors ${
              isActive('/profile')
                ? 'text-on-surface font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Profile
          </Link>
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {user?.role === 'free' && (
            <span className="text-xs font-medium text-primary border border-primary/30 rounded-full px-2.5 py-0.5">
              Free
            </span>
          )}
          {user?.role === 'pro' && (
            <span className="text-xs font-medium text-primary bg-primary-container rounded-full px-2.5 py-0.5">
              Pro
            </span>
          )}

          <div className="relative">
            <NotificationBell />
            <NotificationDropdown />
          </div>

          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-label="User menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
          >
            {user?.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-primary">
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute top-12 right-4 z-50 w-48 rounded-lg bg-surface shadow-elevation-2 py-1">
              <div className="px-4 py-2 border-b border-outline-variant">
                <p className="text-sm font-medium text-on-surface truncate">{user?.name}</p>
                <p className="text-xs text-secondary truncate">{user?.email}</p>
              </div>
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/profile/billing"
                className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                Billing
              </Link>
              <button
                type="button"
                onClick={async () => {
                  await fetch('/api/auth/cognito/signout', { method: 'POST' });
                  router.push('/');
                  router.refresh();
                }}
                className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      <main id="main-content" className="p-6">
        {children}
      </main>
    </div>
  );
}
