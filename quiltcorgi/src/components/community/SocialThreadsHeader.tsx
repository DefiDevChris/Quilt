'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import Mascot from '@/components/landing/Mascot';

export function SocialThreadsHeader() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
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

  return (
    <header
      className={`sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b transition-all duration-200 ${
        scrolled ? 'border-outline-variant shadow-sm' : 'border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <Mascot pose="waving" size="sm" className="w-full h-full" />
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <span className="text-xl font-bold text-on-surface leading-none">QuiltCorgi</span>
            <span className="text-xs text-secondary leading-none mt-0.5">Social Threads</span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink href="/socialthreads" active={pathname === '/socialthreads'} icon="home">
            Feed
          </NavLink>
          <NavLink
            href="/socialthreads?tab=featured"
            active={pathname === '/socialthreads'}
            icon="explore"
          >
            Explore
          </NavLink>
          <NavLink href="/profile?tab=saved" active={pathname === '/profile'} icon="saved">
            Saved
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3" ref={dropdownRef}>
          <div className="relative">
            <NotificationBell />
            <NotificationDropdown />
          </div>

          {user ? (
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-primary">
                  {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
            </button>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-on hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          )}

          {dropdownOpen && user && (
            <div className="absolute top-14 right-4 z-50 w-56 rounded-2xl bg-surface shadow-elevation-3 py-2 border border-outline-variant">
              <div className="px-4 py-3 border-b border-outline-variant">
                <p className="text-sm font-semibold text-on-surface truncate">{user.name}</p>
                <p className="text-xs text-secondary truncate">{user.email}</p>
              </div>
              <DropdownLink href="/dashboard" onClick={() => setDropdownOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </DropdownLink>
              <DropdownLink href="/profile" onClick={() => setDropdownOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Profile
              </DropdownLink>
              <DropdownLink href="/profile/billing" onClick={() => setDropdownOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                  />
                </svg>
                Billing
              </DropdownLink>
              <div className="border-t border-outline-variant mt-1 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/auth/cognito/signout', { method: 'POST' });
                    setUser(null);
                    router.push('/');
                    router.refresh();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-surface-container transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: string;
  children: React.ReactNode;
}) {
  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg
        className="w-5 h-5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
        />
      </svg>
    ),
    explore: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
    saved: (
      <svg
        className="w-5 h-5"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 019.186 0z"
        />
      </svg>
    ),
  };

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
        active
          ? 'bg-surface-container text-on-surface'
          : 'text-secondary hover:text-on-surface hover:bg-surface-container/50'
      }`}
    >
      {icons[icon]}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}

function DropdownLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors"
    >
      {children}
    </Link>
  );
}
