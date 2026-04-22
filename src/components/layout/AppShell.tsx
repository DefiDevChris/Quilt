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
import { ShoppingBag, Plus, Clock, Scissors, Camera, Settings } from 'lucide-react';
import { logout } from '@/lib/logout';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';

const StarQuiltBlock = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10H90V90H10V10Z" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
    <path d="M50 15L65 50L50 85L35 50L50 15Z" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1.5" />
    <path d="M15 50L50 65L85 50L50 35L15 50Z" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="3" fill="currentColor" />
  </svg>
);

interface SidebarNavItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
}

function SidebarNavItem({ icon: Icon, label, href, active = false }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-6 py-3 transition-quilt border-r-4 ${
        active
          ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
          : 'border-transparent text-black/40 hover:text-[var(--color-primary)] hover:bg-black/[0.02]'
      }`}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10px] uppercase tracking-[0.3em] font-bold">{label}</span>
    </Link>
  );
}

/**
 * AppShell variants:
 *
 * - "default" (dashboards, fabric pages, etc.): renders the editorial
 *   top-bar + a vertical rail of primary nav, with children rendered inside
 *   a padded, max-width-constrained `<main>`.
 *
 * - "studio": same top-bar (for consistent branding and user menu) but the
 *   vertical rail is hidden and children are rendered full-bleed so the
 *   studio canvas can own the viewport. This is how the design studio
 *   adopts the new global chrome without losing its full-width workspace.
 */
export type AppShellVariant = 'default' | 'studio';

export function AppShell({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: AppShellVariant;
}) {
  const user = useAuthStore((s) => s.user);
  const shopEnabled = useShopEnabled();
  const cartItems = useCartStore((s) => s.items);
  const toggleCartDrawer = useCartStore((s) => s.toggleDrawer);
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isStudio = variant === 'studio';

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
    if (path === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(path);
  }

  return (
    <div className="h-screen bg-[var(--color-bg)] text-black selection:bg-[var(--color-accent)] font-sans flex flex-col overflow-hidden antialiased relative">
      <header className="h-20 px-12 flex items-center justify-between shrink-0 bg-white border-b border-black/[0.04] z-50">
        <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-bg)] rounded-lg text-[var(--color-primary)] transition-quilt">
            <Image
              src="/logo.png"
              alt="QuiltCorgi"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-black leading-none">
            QuiltCorgi
          </h1>
        </Link>

        <div className="flex items-center gap-10" ref={dropdownRef}>
          <div className="hidden lg:flex items-center gap-10 font-sans text-[9px] uppercase tracking-[0.4em] font-bold text-black/30">
            <Link
              href="/blog"
              className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
            >
              Blog
            </Link>
            <Link
              href="/projects"
              className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
            >
              QuiltCorgi Pro
            </Link>
            <Link
              href="/settings"
              className="hover:text-[var(--color-primary)] transition-quilt cursor-pointer border-b border-transparent hover:border-[var(--color-primary)] pb-0.5"
            >
              My Account
            </Link>
          </div>

          {isAuthenticated ? (
            <>
              {shopEnabled && cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={toggleCartDrawer}
                  className="relative p-1.5 text-black/40 hover:text-[var(--color-primary)] transition-quilt"
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
                className="w-10 h-10 rounded-full bg-[var(--color-secondary)] border-2 border-white shadow-[var(--shadow-quilt)] overflow-hidden shrink-0 hover:opacity-80 transition-quilt"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src="/mascots&avatars/corgi1.png"
                    alt="Default Avatar"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover scale-110 translate-y-1"
                  />
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute top-20 right-12 z-50 w-48 rounded-lg bg-white border border-black/[0.06] py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                  <div className="px-4 py-2 border-b border-black/[0.06]">
                    <p className="text-sm font-medium text-black truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-black/40 truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-black/60 hover:bg-[var(--color-bg)] transition-quilt"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  {user?.role === 'free' && (
                    <div className="px-4 py-2">
                      <ProUpgradeButton variant="nav" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await logout();
                      router.push('/');
                      router.refresh();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-bg)] transition-quilt"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-[11px] tracking-[0.15em] text-black/40 hover:text-black transition-quilt font-bold uppercase"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[var(--color-primary)] text-black px-5 py-2 rounded-full text-[11px] tracking-[0.1em] font-bold uppercase hover:opacity-90 transition-quilt shadow-[var(--shadow-quilt)]"
              >
                Start Designing
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {!isStudio && (
          <aside className="w-64 border-r border-black/[0.06] bg-white hidden md:flex flex-col shrink-0">
            <div className="p-8 flex flex-col h-full">
              <div className="mb-14">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="w-full py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.4em] shadow-[var(--shadow-quilt)] transition-quilt flex items-center justify-center gap-3 bg-[var(--color-primary)] text-black hover:opacity-95"
                >
                  <Plus size={14} />
                  <span>New Project</span>
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                <p className="font-sans text-[9px] uppercase tracking-[0.5em] font-bold text-black/20 mb-6 px-6">Workbench</p>
                <SidebarNavItem icon={Clock} label="Recent" href="/dashboard" active={isActive('/dashboard')} />
                <SidebarNavItem icon={Scissors} label="Fabrics" href="/fabrics" active={isActive('/fabrics')} />
                <SidebarNavItem icon={Camera} label="Uploads" href="/picture-my-blocks" active={isActive('/picture-my-blocks')} />
                <SidebarNavItem icon={Settings} label="Settings" href="/settings" active={isActive('/settings')} />
              </nav>

              <div className="mt-auto pt-10 border-t border-black/[0.04]">
                <div className="text-center text-[var(--color-primary)]/40">
                  <StarQuiltBlock className="w-5 h-5 mx-auto mb-2" />
                </div>
              </div>
            </div>
          </aside>
        )}

        <main
          className={
            isStudio
              ? 'flex-1 flex flex-col h-full overflow-hidden relative bg-[var(--color-bg)]'
              : 'flex-1 p-8 lg:p-12 flex flex-col h-full overflow-y-auto relative bg-[var(--color-bg)]'
          }
        >
          {isStudio ? (
            <div className="flex-1 relative z-10 min-h-0 w-full">{children}</div>
          ) : (
            <div className="flex-1 relative z-10 min-h-0 max-w-6xl mx-auto w-full">
              {children}
            </div>
          )}
        </main>
      </div>

      <CartDrawer />
      <NewProjectWizard
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
