'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import Mascot from './Mascot';

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
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl transition-all duration-200"
      style={{
        boxShadow: scrolled ? '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' : 'none',
        borderBottom: scrolled ? '1px solid #e5e5e5' : '1px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Mascot pose="waving" size="sm" />
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
            className="text-secondary hover:text-on-surface transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="text-secondary hover:text-on-surface transition-colors font-medium"
          >
            Community
          </a>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary hover:text-on-surface transition-colors font-medium"
          >
            Blog
          </a>
          {shopEnabled && (
            <Link
              href="/shop"
              className="text-secondary hover:text-on-surface transition-colors font-medium"
            >
              Shop
            </Link>
          )}

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="px-5 py-2 bg-primary text-on-surface rounded-full font-semibold hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="text-secondary hover:text-on-surface transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-5 py-2 bg-primary text-on-surface rounded-full font-semibold hover:bg-primary-dark transition-colors whitespace-nowrap"
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
        <div className="lg:hidden border-t border-outline-variant bg-white px-6 py-4 space-y-3">
          <a
            href="#features"
            className="block text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="block text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Community
          </a>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </a>
          {shopEnabled && (
            <Link
              href="/shop"
              className="block text-secondary font-medium py-2"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
          )}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="block text-center px-6 py-3 bg-primary text-on-surface rounded-full font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="block text-center px-6 py-3 bg-primary text-on-surface rounded-full font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                Start Designing
              </Link>
              <Link
                href="/auth/signin"
                className="block text-center text-secondary font-medium py-2 hover:text-primary transition-colors"
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
