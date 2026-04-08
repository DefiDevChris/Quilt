import { db } from '@/lib/db';
import { blocks } from '@/db/schema/blocks';
import { blogPosts } from '@/db/schema/blogPosts';
import { reports } from '@/db/schema/reports';
import { socialPosts } from '@/db/schema/socialPosts';
import { fabrics } from '@/db/schema/fabrics';
import { mobileUploads } from '@/db/schema/mobileUploads';
import { users } from '@/db/schema/users';
import { count, eq } from 'drizzle-orm';
import Link from 'next/link';

async function getStats() {
  const [blockCount, blogCount, reportCount, socialCount, fabricCount, userCount, pendingUploads] =
    await Promise.all([
      db.select({ count: count() }).from(blocks).then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published'))
        .then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(reports)
        .then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(socialPosts).then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(fabrics)
        .where(eq(fabrics.isDefault, true))
        .then((r) => r[0]?.count ?? 0),
      db.select({ count: count() }).from(users).then((r) => r[0]?.count ?? 0),
      db
        .select({ count: count() })
        .from(mobileUploads)
        .where(eq(mobileUploads.status, 'pending'))
        .then((r) => r[0]?.count ?? 0),
    ]);

  return {
    blockCount,
    blogCount,
    reportCount,
    socialCount,
    fabricCount,
    userCount,
    pendingUploads,
  };
}

async function getRecentBlogPosts() {
  const { desc } = await import('drizzle-orm');
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      status: blogPosts.status,
      createdAt: blogPosts.createdAt,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt))
    .limit(5);
  return posts;
}

async function getRecentSocialPosts() {
  const { desc, eq } = await import('drizzle-orm');
  const { userProfiles } = await import('@/db/schema/userProfiles');
  const rows = await db
    .select({
      id: socialPosts.id,
      title: socialPosts.title,
      likeCount: socialPosts.likeCount,
      createdAt: socialPosts.createdAt,
      displayName: userProfiles.displayName,
    })
    .from(socialPosts)
    .leftJoin(userProfiles, eq(userProfiles.userId, socialPosts.userId))
    .orderBy(desc(socialPosts.createdAt))
    .limit(5);
  return rows.map((r) => ({
    ...r,
    creatorName: r.displayName ?? 'Anonymous',
  }));
}

export default async function AdminDashboardPage() {
  const stats = await getStats();
  const recentPosts = await getRecentBlogPosts();
  const recentSocial = await getRecentSocialPosts();

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-xl font-semibold text-on-surface">Welcome back, Admin</h2>
        <p className="text-sm text-secondary mt-1">Here&apos;s what&apos;s happening with QuiltCorgi.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="System Blocks" value={stats.blockCount} href="/admin/blocks" color="from-blue-500 to-indigo-500" />
        <StatCard label="Published Posts" value={stats.blogCount} href="/admin/blog" color="from-emerald-500 to-teal-500" />
        <StatCard label="Pending Reports" value={stats.reportCount} href="/admin/moderation" color="from-amber-500 to-orange-500" />
        <StatCard label="System Fabrics" value={stats.fabricCount} href="/admin/libraries" color="from-pink-500 to-rose-500" />
      </div>

      {/* Secondary stat row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Social Posts" value={stats.socialCount} href="/admin/moderation" color="from-violet-500 to-purple-500" />
        <StatCard label="Total Users" value={stats.userCount} href="/admin/moderation" color="from-cyan-500 to-blue-500" />
        <StatCard label="Pending Uploads" value={stats.pendingUploads} href="/admin/libraries" color="from-lime-500 to-green-500" />
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="New Block"
            description="Add a system block to the library"
            href="/admin/blocks"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            }
          />
          <QuickActionCard
            title="New Blog Post"
            description="Write and publish a blog post"
            href="/admin/blog/new"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <QuickActionCard
            title="Moderate Social"
            description="Review reports and community posts"
            href="/admin/moderation"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <QuickActionCard
            title="Manage Shop"
            description="Configure pricing and availability"
            href="/admin/libraries"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent blog posts */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Recent Blog Posts</h3>
            <Link href="/admin/blog" className="text-xs font-medium text-primary hover:text-primary-dark">
              View all
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-secondary py-8 text-center">No blog posts yet</p>
          ) : (
            <ul className="space-y-3">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/blog/${post.id}`} className="text-sm font-medium text-on-surface truncate hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                    <p className="text-xs text-secondary mt-0.5">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${post.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-primary-container/40 text-secondary'
                      }`}
                  >
                    {post.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent social posts */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-secondary uppercase tracking-wider">Recent Social Posts</h3>
            <Link href="/admin/moderation" className="text-xs font-medium text-primary hover:text-primary-dark">
              Moderate
            </Link>
          </div>
          {recentSocial.length === 0 ? (
            <p className="text-sm text-secondary py-8 text-center">No social posts yet</p>
          ) : (
            <ul className="space-y-3">
              {recentSocial.map((post) => (
                <li key={post.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{post.title}</p>
                    <p className="text-xs text-secondary mt-0.5">
                      by {post.creatorName} · {post.likeCount} likes
                    </p>
                  </div>
                  <span className="text-xs text-secondary">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  color,
}: {
  label: string;
  value: number;
  href: string;
  color: string;
}) {
  return (
    <Link href={href} className="glass-panel rounded-2xl p-5 hover:shadow-elevation-2 transition-shadow block">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-lg font-bold`}>
          {value}
        </div>
        <div>
          <p className="text-sm font-medium text-secondary">{label}</p>
        </div>
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
    <Link href={href} className="glass-panel rounded-2xl p-5 hover:shadow-elevation-2 transition-shadow block group">
      <div className="flex items-start gap-3">
        <div className="text-secondary group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-on-surface">{title}</p>
          <p className="text-xs text-secondary mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
