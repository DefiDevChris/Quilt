'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import { SHADOW } from '@/lib/design-system';
import Mascot from '@/components/landing/Mascot';
import { BrandLogo } from '@/components/layout/BrandLogo';

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
    <header className="sticky top-0 z-50 h-20 px-12 flex items-center justify-between shrink-0 bg-white border-b border-black/[0.04]">
        <BrandLogo href="/" />

        <div className="hidden lg:flex items-center gap-10 font-sans text-[9px] uppercase tracking-[0.4em] font-bold text-[var(--color-text)]/30">
          {shopEnabled && (
            <Link
              href="/shop"
              className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
            >
              Shop
            </Link>
          )}
          <Link
            href="/design-studio"
            className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
          >
            Design Studio
          </Link>
          <Link
            href="/picture-my-blocks"
            className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
          >
            Picture my Blocks
          </Link>
          <a
            href="/blog"
            className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
          >
            Blog
          </a>

          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] font-bold text-black hover:bg-black/5 transition-colors"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="flex items-center gap-2 rounded-full border border-black/10 bg-[var(--color-primary)] px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] font-bold text-white hover:bg-[var(--color-primary)]/90 transition-colors"
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
          {shopEnabled && (
            <Link
              href="/shop"
              className="block text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
              onClick={() => setMenuOpen(false)}
            >
              Shop
            </Link>
          )}
          <Link
            href="/design-studio"
            className="block text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
            onClick={() => setMenuOpen(false)}
          >
            Design Studio
          </Link>
          <Link
            href="/picture-my-blocks"
            className="block text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
            onClick={() => setMenuOpen(false)}
          >
            Picture my Blocks
          </Link>
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-dim font-medium py-2 hover:text-primary transition-colors duration-150"
            onClick={() => setMenuOpen(false)}
          >
            Blog
          </a>
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="block text-center px-6 py-2 bg-primary text-default rounded-full font-semibold hover:bg-primary-dark transition-colors duration-150"
              onClick={() => setMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signup"
                className="block text-center px-6 py-2 bg-primary text-default rounded-full font-semibold hover:bg-primary-dark transition-colors duration-150"
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
