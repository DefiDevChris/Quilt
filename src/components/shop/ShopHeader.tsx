'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, User, ShoppingBag, Menu, X, Palette } from 'lucide-react';
import { COLORS } from '@/lib/design-system';
import { useCartStore } from '@/stores/cartStore';
import { BrandLogo } from '@/components/layout/BrandLogo';
import Mascot from '@/components/landing/Mascot';

const navLinks = [
  { name: 'Fabric', href: '/shop/catalog' },
  { name: 'Precuts', href: '/shop/catalog?category=charm-packs' },
  { name: 'Kits', href: '/shop/catalog?category=kits' },
  { name: 'Thread', href: '/shop/catalog?category=thread' },
  { name: 'Batting', href: '/shop/catalog?category=batting' },
  { name: 'Notions', href: '/shop/catalog?category=notions' },
  { name: 'New', href: '/shop/catalog?sort=newest' },
  { name: 'Sale', href: '/shop/catalog' },
  { name: 'Picture my Blocks', href: '/picture-my-blocks', external: true },
] as const;

export default function ShopHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantityInYards / 0.25, 0);

  return (
    <header
      className="w-full border-b sticky top-0 z-50"
      style={{
        backgroundColor: COLORS.surface,
        borderColor: `${COLORS.text}1a`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center gap-8">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <BrandLogo href="/shop" />
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              type="text"
              name="shopSearch"
              placeholder="Search for fabric, patterns, kits, and more…"
              aria-label="Search the shop"
              autoComplete="off"
              className="w-full rounded-lg border px-4 py-3 pr-12 text-sm transition-[border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/20"
              style={{
                borderColor: `${COLORS.text}1a`,
                color: COLORS.text,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = COLORS.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = `${COLORS.text}1a`;
              }}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: COLORS.textDim }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.textDim;
              }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-6 shrink-0">
            <Link
              href="/design-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 transition-colors flex-col"
              style={{ color: COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
            >
              <Palette className="w-6 h-6" strokeWidth={1.5} />
              <span className="hidden text-[11px] font-semibold sm:block">Studio</span>
            </Link>
            <Link
              href="/auth/signin"
              className="flex flex-col items-center gap-1 transition-colors"
              style={{ color: COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
              aria-label="Sign in"
            >
              <User className="w-6 h-6" />
              <span className="hidden text-[11px] font-semibold sm:block">Sign In</span>
            </Link>
            <button
              onClick={toggleDrawer}
              className="transition-colors flex flex-col items-center gap-1 relative"
              style={{ color: COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
              aria-label="Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-6 h-6" strokeWidth={1.5} />
                {cartItems.length > 0 && (
                  <span
                    className="absolute -top-2 -right-2 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2"
                    style={{
                      backgroundColor: COLORS.secondary,
                      color: COLORS.text,
                      borderColor: COLORS.surface,
                    }}
                  >
                    {Math.min(Math.round(itemCount), 9)}
                  </span>
                )}
              </div>
              <span className="hidden text-[11px] font-semibold sm:block">Cart</span>
            </button>
            <button
              className="md:hidden transition-colors"
              style={{ color: COLORS.text }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="hidden md:block border-t" style={{ borderColor: `${COLORS.text}1a` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center items-center py-3 gap-x-8 gap-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                {...('external' in link && link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="whitespace-nowrap text-sm font-semibold transition-colors"
                style={{ color: COLORS.text }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.text;
                }}
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden border-t"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: `${COLORS.text}1a`,
          }}
        >
          <nav className="flex flex-col px-6 py-4 space-y-4">
            <Link
              href="/design-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-base font-semibold transition-colors"
              style={{ color: COLORS.primary }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Palette className="w-4 h-4" strokeWidth={1.75} />
              Design Studio
            </Link>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                {...('external' in link && link.external
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                className="text-base font-semibold transition-colors"
                style={{ color: COLORS.text }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = COLORS.text;
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
