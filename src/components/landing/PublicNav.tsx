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
      className="sticky top-0 z-50 bg-warm-bg/90 backdrop-blur-xl transition-shadow duration-200"
      style={{ boxShadow: scrolled ? '0 4px 24px rgba(74, 59, 50, 0.06)' : 'none' }}
    >
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-12 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Mascot pose="waving" size="sm" />
          <span
            className="text-2xl font-bold text-warm-text"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            QuiltCorgi
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <a
            href="#features"
            className="text-warm-text-secondary hover:text-warm-peach transition-colors font-medium"
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="text-warm-text-secondary hover:text-warm-peach transition-colors font-medium"
          >
            Social Threads
          </a>
          <Link
            href="/blog"
            className="text-warm-text-secondary hover:text-warm-peach transition-colors font-medium"
          >
            Blog
          </Link>
          <Link
            href="/auth/signup"
            className="px-5 py-2 bg-warm-peach text-warm-text rounded-full font-semibold hover:bg-warm-peach-dark transition-colors whitespace-nowrap"
          >
            Start Designing
          </Link>
          <Link
            href="/auth/signin"
            className="text-warm-text-secondary hover:text-warm-peach transition-colors font-medium"
          >
            Sign In
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-warm-text"
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
        <div className="lg:hidden border-t border-warm-border bg-warm-bg px-6 py-4 space-y-3">
          <a
            href="#features"
            className="block text-warm-text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Features
          </a>
          <a
            href="#social-threads"
            className="block text-warm-text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Social Threads
          </a>
          <Link
            href="/blog"
            className="block text-warm-text-secondary font-medium py-2"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </Link>
          <Link
            href="/auth/signup"
            className="block text-center px-6 py-3 bg-warm-peach text-warm-text rounded-full font-semibold"
            onClick={() => setMenuOpen(false)}
          >
            Start Designing
          </Link>
          <Link
            href="/auth/signin"
            className="block text-center text-warm-text-secondary font-medium py-2 hover:text-warm-peach transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}
