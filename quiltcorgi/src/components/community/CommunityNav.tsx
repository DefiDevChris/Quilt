'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function CommunityNav() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  return (
    <nav className="sticky top-0 z-40 h-14 bg-surface/90 backdrop-blur-[24px] px-4 flex items-center justify-between shadow-elevation-1">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-bold text-on-surface">QuiltCorgi</span>
      </Link>

      <div className="flex items-center gap-6">
        {user && (
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
        )}
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
      </div>

      <div className="flex items-center gap-3" ref={dropdownRef}>
        {isLoading ? (
          <div className="h-8 w-8 rounded-full bg-surface-container animate-pulse" />
        ) : user ? (
          <>
            {user.role === 'free' && (
              <span className="text-xs font-medium text-primary border border-primary/30 rounded-full px-2.5 py-0.5">
                Free
              </span>
            )}
            {user.role === 'pro' && (
              <span className="text-xs font-medium text-primary bg-primary-container rounded-full px-2.5 py-0.5">
                Pro
              </span>
            )}

            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary/30 transition-all"
            >
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-sm font-medium text-primary">
                  {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute top-12 right-4 z-50 w-48 rounded-lg bg-surface shadow-elevation-2 py-1">
                <div className="px-4 py-2 border-b border-outline-variant">
                  <p className="text-sm font-medium text-on-surface truncate">{user.name}</p>
                  <p className="text-xs text-secondary truncate">{user.email}</p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
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
          </>
        ) : (
          <Link
            href="/auth/signin"
            className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
