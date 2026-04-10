'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useShopEnabled } from '@/hooks/useShopEnabled';

export default function PublicNav() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;
  const shopEnabled = useShopEnabled();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 bg-surface transition-all duration-200"
      style={{
        boxShadow: scrolled ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-neutral-200)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="QuiltCorgi Logo"
            width={40}
            height={40}
            unoptimized
            className="object-contain"
          />
          <span
            className="text-2xl font-bold text-on-surface"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            QuiltCorgi
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <a
            href="#features"
            className="text-on-surface/70 hover:text-on-surface transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="text-on-surface/70 hover:text-on-surface transition-colors font-medium"
          >
            Social Threads
          </a>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-on-surface/70 hover:text-on-surface transition-colors font-medium"
          >
            Blog
          </a>
          {shopEnabled && (
            <Link
              href="/shop"
              className="text-on-surface/70 hover:text-on-surface transition-colors font-medium"
            >
              Shop
            </Link>
          )}

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-all whitespace-nowrap"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-on-surface/70 hover:text-on-surface transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-all whitespace-nowrap"
              >
                Start Designing
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-on-surface"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </nav>

      {menuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-surface px-6 py-4 space-y-3">
          <a
            href="#features"
            className="block text-on-surface/70 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="block text-on-surface/70 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Social Threads
          </a>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-on-surface/70 font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </a>
          {shopEnabled && (
            <Link
              href="/shop"
              className="block text-on-surface/70 font-medium py-2"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
          )}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="block text-center px-6 py-3 bg-primary text-white rounded-full font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="block text-center px-6 py-3 bg-primary text-white rounded-full font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Start Designing
              </Link>
              <Link
                href="/auth/signin"
                className="block text-center text-on-surface/70 font-medium py-2 hover:text-primary transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
