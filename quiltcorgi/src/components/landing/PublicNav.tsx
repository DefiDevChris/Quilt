'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
        <Link href="/" className="flex items-center gap-2 group">
          <div className="group-hover:-translate-y-0.5 transition-transform bg-primary-container rounded-lg p-0.5">
            <Image src="/corgi3.png" alt="QuiltCorgi Logo" width={32} height={32} className="object-contain drop-shadow-sm" />
          </div>
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
            href="#community"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Community
          </a>
          <Link
            href="/tutorials"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Tutorials
          </Link>
          <Link
            href="/blog"
            className="text-[length:var(--font-size-label-lg)] font-medium text-secondary hover:text-on-surface transition-colors"
          >
            Blog
          </Link>
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
            className="bg-primary text-primary-on text-sm font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
