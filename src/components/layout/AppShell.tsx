'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { useShopEnabled } from '@/hooks/useShopEnabled';
import { useCartStore } from '@/stores/cartStore';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { ShoppingBag } from 'lucide-react';
import { logout } from '@/lib/logout';

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const shopEnabled = useShopEnabled();
  const cartItems = useCartStore((s) => s.items);
  const toggleCartDrawer = useCartStore((s) => s.toggleDrawer);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAuthenticated = !!user;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function isActive(path: string) {
    return pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen relative">
      <nav
        aria-label="Main navigation"
        className={`sticky top-0 z-40 px-6 lg:px-12 py-2 flex items-center justify-between transition-colors duration-150 border-b ${
          scrolled
            ? 'bg-[var(--color-bg)] border-[var(--color-border)] shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
            : 'bg-[var(--color-bg)] border-transparent'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="QuiltCorgi Logo"
            width={52}
            height={52}
            className="object-contain w-[52px] h-[52px]"
          />
          <span
            className="text-[28px] font-bold text-[var(--color-text)] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            QuiltCorgi
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-6">
          <Link
            href="/dashboard"
            className={`font-medium transition-colors ${
              isActive('/dashboard')
                ? 'text-[var(--color-text)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-primary)]'
            }`}
          >
            Dashboard
          </Link>
          {shopEnabled && (
            <Link
              href="/shop"
              className={`font-medium transition-colors ${
                isActive('/shop')
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-primary)]'
              }`}
            >
              Shop
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/profile"
              className={`font-medium transition-colors ${
                isActive('/profile')
                  ? 'text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-primary)]'
              }`}
            >
              Profile
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              {user?.role === 'free' && <ProUpgradeButton variant="nav" />}

              {shopEnabled && cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={toggleCartDrawer}
                  className="relative p-1.5 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                  aria-label="Shopping cart"
                >
                  <ShoppingBag size={20} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-full hover:bg-[var(--color-primary)]/5 transition-colors duration-150"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover "
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-[var(--color-primary)]/20 flex items-center justify-center overflow-hidden ">
                    <Image
                      src="/mascots&avatars/corgi1.png"
                      alt="Default Avatar"
                      width={32}
                      height={32}
                      className="object-cover scale-110 translate-y-1"
                    />
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute top-12 right-4 z-50 w-48 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] py-1.5">
                  <div className="px-4 py-2 border-b border-[var(--color-border)]">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-dim)] truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-[var(--color-text-dim)] hover:bg-[var(--color-bg)] transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.push('/');
                      router.refresh();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-accent)] hover:bg-[var(--color-bg)] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/signin"
                className="text-label-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[var(--color-primary)] text-[var(--color-text)] px-5 py-2 rounded-full font-semibold hover:opacity-90 transition-colors duration-150"
              >
                Start Designing
              </Link>
            </div>
          )}
        </div>
      </nav>

      <main id="main-content" className="relative z-10 p-6 max-w-7xl mx-auto">
        {children}
      </main>

      <CartDrawer />
    </div>
  );
}
