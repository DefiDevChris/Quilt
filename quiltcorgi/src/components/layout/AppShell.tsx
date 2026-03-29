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
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAuthenticated = !!user;

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background orbs for glassmorphism depth */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute top-[-15%] right-[-10%] w-[45vw] h-[45vw] bg-[#FFE4D0]/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] bg-[#FFD166]/20 rounded-full blur-[100px]" />
        <div className="absolute top-[40%] left-[20%] w-[25vw] h-[25vw] bg-white/50 rounded-full blur-[80px]" />
      </div>
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 h-14 backdrop-blur-[28px] px-4 flex items-center justify-between transition-all duration-300 border-b ${
          scrolled
            ? 'bg-white/70 border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_2px_4px_rgba(74,59,50,0.03),0_8px_24px_rgba(74,59,50,0.06)]'
            : 'bg-surface/80 border-transparent'
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
            href="/socialthreads"
            className={`text-label-lg transition-colors ${
              isActive('/socialthreads')
                ? 'text-on-surface font-semibold'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Social Threads
          </Link>
          {isAuthenticated && (
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
          )}
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
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
                <div className="absolute top-12 right-4 z-50 w-48 rounded-xl glass-elevated py-1.5">
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
                      setUser(null);
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
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-label-lg text-secondary hover:text-on-surface transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-primary text-primary-on px-4 py-2 rounded-md text-label-lg font-medium hover:opacity-90 transition-opacity"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main id="main-content" className="relative z-10 p-6">
        {children}
      </main>
    </div>
  );
}
