'use client';

import { useState, useEffect } from 'react';
import { Search, User, ShoppingBag, Menu, X } from 'lucide-react';
import { COLORS, MOTION } from '@/lib/design-system';
import { useCartStore } from '@/stores/cartStore';

const navLinks = [
  { name: 'Fabrics', href: '#fabrics' },
  { name: 'Precuts', href: '#categories' },
  { name: 'Kits', href: '#kits' },
  { name: 'Patterns', href: '#patterns' },
  { name: 'Notions', href: '#categories' },
  { name: 'New', href: '#new' },
];

export default function ShopHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartItems = useCartStore((s) => s.items);
  const toggleDrawer = useCartStore((s) => s.toggleDrawer);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantityInYards / 0.25), 0);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'shadow-sm'
          : ''
      }`}
      style={{
        backgroundColor: isScrolled ? `${COLORS.bg}e6` : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div className="w-full px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="/shop" className="flex items-center">
            <span
              className="text-2xl lg:text-3xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 300,
                color: isScrolled ? COLORS.text : COLORS.surface,
                fontStyle: 'italic',
                transition: `color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
              }}
            >
              QuiltCorgi
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200"
                style={{
                  color: isScrolled ? `${COLORS.text}cc` : `${COLORS.surface}cc`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isScrolled ? `${COLORS.text}cc` : `${COLORS.surface}cc`;
                }}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Utility Icons */}
          <div className="flex items-center space-x-4">
            <button
              className="p-2 transition-colors"
              style={{
                color: isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`;
              }}
              aria-label="Search"
            >
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              className="p-2 transition-colors"
              style={{
                color: isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`;
              }}
              aria-label="Account"
            >
              <User className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <button
              onClick={toggleDrawer}
              className="p-2 relative transition-colors"
              style={{
                color: isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`;
              }}
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
              {cartItems.length > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.surface,
                  }}
                >
                  {Math.min(Math.round(itemCount), 9)}
                </span>
              )}
            </button>
            <button
              className="lg:hidden p-2 transition-colors"
              style={{
                color: isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`,
              }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isScrolled ? `${COLORS.text}70` : `${COLORS.surface}70`;
              }}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden border-t"
          style={{
            backgroundColor: `${COLORS.bg}f2`,
            backdropFilter: 'blur(12px)',
            borderColor: `${COLORS.text}1a`,
          }}
        >
          <nav className="flex flex-col px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-medium transition-colors"
                style={{ color: `${COLORS.text}cc` }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = `${COLORS.text}cc`;
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
