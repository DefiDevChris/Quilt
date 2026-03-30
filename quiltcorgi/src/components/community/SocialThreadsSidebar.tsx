'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface SidebarItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function SocialThreadsSidebar() {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  const mainItems: SidebarItem[] = [
    {
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
      label: 'Dashboard',
    },
    {
      href: '/socialthreads',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
      label: 'Home Feed',
    },
    {
      href: '/profile?tab=saved',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 019.186 0z"
          />
        </svg>
      ),
      label: 'Saved',
    },
    {
      href: '/profile?tab=notifications',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
      ),
      label: 'Notifications',
    },
  ];

  const profileItems: SidebarItem[] = [
    {
      href: '/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
      label: 'My Profile',
    },
  ];

  const discoverItems: SidebarItem[] = [
    {
      href: '/tutorials',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
      label: 'Tutorials',
    },
    {
      href: '/blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
          />
        </svg>
      ),
      label: 'Blog',
    },
  ];

  return (
    <aside className="w-64 hidden lg:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
      <nav className="space-y-1">
        {mainItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={pathname === item.href || pathname.startsWith(item.href + '/')}
          />
        ))}
      </nav>

      {user && (
        <>
          <div className="border-t border-outline-variant my-4"></div>
          <nav className="space-y-1">
            {profileItems.map((item) => (
              <SidebarLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </nav>
        </>
      )}

      <div className="border-t border-outline-variant my-4"></div>
      <p className="px-3 py-2 text-xs font-semibold text-secondary uppercase tracking-wider">
        Discover
      </p>
      <nav className="space-y-1">
        {discoverItems.map((item) => (
          <SidebarLink key={item.href} item={item} active={pathname === item.href} />
        ))}
      </nav>

      <div className="border-t border-outline-variant my-4"></div>
      <div className="px-3 py-2">
        <p className="text-xs text-secondary">&copy; 2026 QuiltCorgi</p>
        <div className="flex gap-3 mt-2">
          <Link href="/privacy" className="text-xs text-secondary hover:text-on-surface">
            Privacy
          </Link>
          <Link href="/terms" className="text-xs text-secondary hover:text-on-surface">
            Terms
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: SidebarItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-primary-container text-primary font-semibold'
          : 'text-on-surface hover:bg-surface-container'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-secondary'}>{item.icon}</span>
      <span>{item.label}</span>
      {item.badge ? (
        <span className="ml-auto bg-error text-error-on text-xs font-bold px-2 py-0.5 rounded-full">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}
