'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BrandLogo } from '@/components/layout/BrandLogo';

const NAV_LINKS = [
  { href: '/design-studio', label: 'Design Studio' },
  { href: '/fabrics', label: 'Fabrics' },
  { href: '/picture-my-blocks', label: 'Picture my Blocks' },
  { href: '/photo-to-quilt', label: 'Photo to Quilt' },
  { href: '/blog', label: 'Blog' },
] as const;

export default function PublicNav() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!user;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleLinks = NAV_LINKS.filter(
    (link) => !pathname.startsWith(link.href)
  );

  return (
    <header className="sticky top-0 z-50 h-20 px-12 flex items-center justify-between shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-text)]/[0.04]">
      <BrandLogo href="/" />

      <div className="hidden lg:flex items-center gap-8 font-sans text-xs uppercase tracking-[0.25em] font-bold text-[var(--color-text)]/30">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-[var(--color-primary)] transition duration-200 cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
          >
            {link.label}
          </Link>
        ))}

        {isAuthenticated ? (
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-full border border-black/10 bg-[var(--color-primary)] px-5 py-2 text-xs uppercase tracking-[0.15em] font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors duration-150"
          >
            Dashboard
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="hover:text-[var(--color-primary)] transition duration-200 cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-[var(--color-primary)] px-5 py-2 text-xs uppercase tracking-[0.15em] font-bold text-white hover:bg-[var(--color-primary)]/90 transition-colors"
            >
              Start Designing
            </Link>
          </div>
        )}
      </div>

      <button
        className="lg:hidden p-2 text-default"
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

      {menuOpen && (
        <div className="lg:hidden border-t border-default bg-surface px-6 py-4 space-y-3">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="block text-center px-6 py-2 bg-primary text-default rounded-full font-semibold hover:bg-primary-hover transition-colors duration-150"
              onClick={() => setMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="block text-center px-6 py-2 bg-primary text-default rounded-full font-semibold hover:bg-primary-hover transition-colors duration-150"
                onClick={() => setMenuOpen(false)}
              >
                Start Designing
              </Link>
              <Link
                href="/auth/signin"
                className="block text-center text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
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
