import { db } from '@/lib/db';
import { blocks } from '@/db/schema/blocks';
import { fabrics } from '@/db/schema/fabrics';
import { users } from '@/db/schema/users';
import { count, eq } from 'drizzle-orm';
import Link from 'next/link';
import { COLORS, SHADOW } from '@/lib/design-system';

async function getStats() {
  const [blockCount, fabricCount, userCount] = await Promise.all([
    db
      .select({ count: count() })
      .from(blocks)
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: count() })
      .from(fabrics)
      .where(eq(fabrics.isDefault, true))
      .then((r) => r[0]?.count ?? 0),
    db
      .select({ count: count() })
      .from(users)
      .then((r) => r[0]?.count ?? 0),
  ]);

  return {
    blockCount,
    fabricCount,
    userCount,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Welcome back, Admin</h2>
        <p className="text-sm text-[var(--color-text-dim)] mt-1">
          Here&apos;s what&apos;s happening with QuiltCorgi.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="System Blocks" value={stats.blockCount} href="/admin/blocks" />
        <StatCard label="System Fabrics" value={stats.fabricCount} href="/admin/libraries" />
        <StatCard label="Total Users" value={stats.userCount} href="/admin/libraries" />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-dim)] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <QuickActionCard
            title="New Block"
            description="Add a system block to the library"
            href="/admin/blocks"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
            }
          />
          <QuickActionCard
            title="Manage Shop"
            description="Configure pricing and availability"
            href="/admin/libraries"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 hover:bg-[var(--color-bg)] transition-colors duration-150 block"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: `${COLORS.primary}1a`, color: COLORS.primary }}
        >
          {value}
        </div>
        <p className="text-sm font-medium text-[var(--color-text-dim)]">{label}</p>
      </div>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5 hover:bg-[var(--color-bg)] transition-colors duration-150 block group"
    >
      <div className="flex items-start gap-3">
        <div className="text-dim group-hover:text-primary transition-colors duration-150">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </p>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
