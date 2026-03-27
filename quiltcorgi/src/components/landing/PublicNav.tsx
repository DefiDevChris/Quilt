'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-40 h-14 bg-surface/90 backdrop-blur-[24px] transition-shadow duration-200 ${
        scrolled ? 'shadow-[var(--shadow-elevation-1)]' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            className="text-primary"
            aria-hidden="true"
          >
            <ellipse cx="14" cy="16" rx="10" ry="8" fill="currentColor" opacity="0.15" />
            <circle cx="10" cy="10" r="3.5" fill="currentColor" />
            <circle cx="18" cy="10" r="3.5" fill="currentColor" />
            <ellipse cx="14" cy="16" rx="7" ry="5.5" fill="currentColor" />
            <circle cx="11.5" cy="14.5" r="1.2" fill="var(--color-primary-on)" />
            <circle cx="16.5" cy="14.5" r="1.2" fill="var(--color-primary-on)" />
            <ellipse cx="14" cy="17" rx="1.8" ry="1" fill="var(--color-primary-dark)" />
          </svg>
          <span className="text-lg font-bold text-on-surface">QuiltCorgi</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Pricing
          </a>
          <a
            href="#community"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Community
          </a>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/signin"
            className="hidden md:inline-block text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="bg-primary text-primary-on text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
