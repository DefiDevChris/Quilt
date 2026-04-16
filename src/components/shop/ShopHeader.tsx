'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, User, ShoppingBag, Menu, X, Palette } from 'lucide-react';
import { COLORS } from '@/lib/design-system';
import { useCartStore } from '@/stores/cartStore';

const navLinks = [
  { name: 'Fabric', href: '#fabrics' },
  { name: 'Precuts', href: '#categories' },
  { name: 'Kits', href: '#kits' },
  { name: 'Thread', href: '#categories' },
  { name: 'Batting', href: '#categories' },
  { name: 'Notions', href: '#categories' },
  { name: 'New', href: '#new' },
  { name: 'Sale', href: '#fabrics' },
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
            <a
              href="/shop"
              className="text-4xl font-bold"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.primary,
                letterSpacing: '-0.02em',
              }}
            >
              QuiltCorgi
            </a>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <input
              type="text"
              placeholder="Search for fabric, patterns, kits, and more..."
              className="w-full pl-5 pr-12 py-3 border-2 rounded-full text-sm transition-colors"
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
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                Studio
              </span>
            </Link>
            <button
              className="transition-colors flex flex-col items-center gap-1"
              style={{ color: COLORS.text }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text;
              }}
              aria-label="Account"
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                Sign In
              </span>
            </button>
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
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                Cart
              </span>
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
                className="whitespace-nowrap text-sm font-bold uppercase tracking-wider transition-colors"
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
              className="inline-flex items-center gap-2 text-base font-bold uppercase tracking-wider transition-colors"
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
                className="text-base font-bold uppercase tracking-wider transition-colors"
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
