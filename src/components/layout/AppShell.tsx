'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { Sparkles } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
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
    <div
      className="min-h-screen relative"
      style={{ background: "url('/background.png') center top / cover no-repeat fixed, #fafafa" }}
    >
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 backdrop-blur-xl px-6 lg:px-12 py-2 flex items-center justify-between transition-all duration-200 border-b ${
          scrolled
            ? 'bg-white/95 border-outline-variant shadow-elevation-1'
            : 'bg-white/95 border-transparent'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="QuiltCorgi Logo"
            width={52}
            height={52}
            className="object-contain w-[52px] h-[52px]"
          />
          <span
            className="text-[28px] font-bold text-on-surface tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            QuiltCorgi
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`font-medium transition-colors ${
              isActive('/dashboard') ? 'text-on-surface' : 'text-secondary hover:text-primary'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/socialthreads"
            className={`font-medium transition-colors ${
              isActive('/socialthreads') ? 'text-on-surface' : 'text-secondary hover:text-primary'
            }`}
          >
            Social Threads
          </Link>
          {isAuthenticated && (
            <Link
              href="/profile"
              className={`font-medium transition-colors ${
                isActive('/profile') ? 'text-on-surface' : 'text-secondary hover:text-primary'
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
                <button
                  onClick={() => setShowProUpgrade(true)}
                  className="btn-primary-xs gap-1.5 mr-2"
                >
                  <Sparkles size={14} className="text-white" />
                  Upgrade
                </button>
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
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary transition-all"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary transition-all">
                    <Image
                      src="/mascots&avatars/corgi1.png"
                      alt="Default Avatar"
                      width={32}
                      height={32}
                      className="object-cover scale-110 translate-y-1"
                    />
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
                    href="/socialthreads"
                    className="block px-4 py-2 text-sm text-secondary hover:bg-surface-container transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
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
                className="bg-primary text-primary-on px-5 py-2 rounded-full font-semibold hover:bg-primary-dark transition-colors"
              >
                Start Designing
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main id="main-content" className="relative z-10 p-6 max-w-7xl mx-auto">
        {children}
      </main>

      {showProUpgrade && <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />}
    </div>
  );
}
