'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Library,
  Menu,
  Settings,
} from 'lucide-react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { COLORS, withAlpha } from '@/lib/design-system';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/blocks', label: 'Blocks', Icon: LayoutGrid },
  { href: '/admin/layouts', label: 'Layouts', Icon: LayoutTemplate },
  { href: '/admin/libraries', label: 'Libraries', Icon: Library },
  { href: '/admin/settings', label: 'Settings', Icon: Settings },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: withAlpha(COLORS.text, 0.3) }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-auto w-64 flex-shrink-0 flex flex-col bg-surface border-r border-default transition-transform duration-150 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-default">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-[var(--color-text-on-primary)]" />
            </div>
            <span className="text-lg font-semibold text-default">Admin</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-dim hover:text-default hover:bg-default'
              }`}
              style={
                isActive(item.href)
                  ? { backgroundColor: withAlpha(COLORS.primary, 0.1) }
                  : undefined
              }
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-default">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-dim hover:text-default hover:bg-default transition-colors duration-150"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-surface border-b border-default px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-default transition-colors duration-150"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5 text-dim" />
          </button>
          <div className="flex-1">
            <SectionTitle>{getPageTitle(pathname)}</SectionTitle>
          </div>
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-default text-sm font-medium text-dim transition-colors duration-150 hover:bg-[var(--color-bg)]/80"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Admin
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 px-6 py-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((n) => {
    if (n.href === '/admin') return pathname === '/admin';
    return pathname.startsWith(n.href);
  });
  return item?.label ?? 'Admin';
}
