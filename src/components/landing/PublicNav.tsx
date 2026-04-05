'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Mascot from './Mascot';

export default function PublicNav() {
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
      className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl transition-shadow duration-200"
      style={{ boxShadow: scrolled ? '0 4px 24px rgba(74, 59, 50, 0.06)' : 'none' }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-4">
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
            className="text-secondary hover:text-primary transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="text-secondary hover:text-primary transition-colors font-medium"
          >
            Social Threads
          </a>
          <Link
            href="/blog"
            className="text-secondary hover:text-primary transition-colors font-medium"
          >
            Blog
          </Link>
          <Link
            href="/help"
            className="text-secondary hover:text-primary transition-colors font-medium"
          >
            Help
          </Link>
          <Link href="/auth/signup" className="btn-primary-xs whitespace-nowrap">
            Start Designing
          </Link>
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
        <div className="lg:hidden border-t border-outline-variant bg-background px-6 py-4 space-y-3">
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
            Social Threads
          </a>
          <Link
            href="/blog"
            className="block text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            href="/help"
            className="block text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Help
          </Link>
          <Link
            href="/auth/signup"
            className="btn-primary-sm block text-center"
            onClick={() => setMenuOpen(false)}
          >
            Start Designing
          </Link>
        </div>
      )}
    </header>
  );
}
