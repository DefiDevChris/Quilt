'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface ProfileStats {
  projectCount: number;
  postCount: number;
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProfileStats>({ projectCount: 0, postCount: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const [projectsRes, postsRes] = await Promise.all([
        fetch('/api/projects?limit=1'),
        fetch('/api/community?limit=1'),
      ]);
      const projectsData = projectsRes.ok ? await projectsRes.json() : null;
      const postsData = postsRes.ok ? await postsRes.json() : null;
      setStats({
        projectCount: projectsData?.data?.projects?.length ?? 0,
        postCount: postsData?.data?.total ?? 0,
      });
    } catch {
      /* stats are non-critical */
    }
  }, []);

  useEffect(() => {
    if (user) fetchStats();
  }, [user, fetchStats]);

  async function handleUpgrade() {
    setIsUpgradeLoading(true);
    setUpgradeError(null);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setUpgradeError(data.error ?? 'Failed to start checkout. Please try again.');
      }
    } catch {
      setUpgradeError('Unable to connect. Please check your connection and try again.');
    } finally {
      setIsUpgradeLoading(false);
    }
  }

  async function handleSignOut() {
    await fetch('/api/auth/cognito/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-1/2" />
        </div>
      </div>
    );
  }

  const roleBadge = {
    free: { label: 'Free', className: 'text-secondary border-outline-variant' },
    pro: { label: 'Pro', className: 'text-primary bg-primary-container border-primary/30' },
    admin: { label: 'Admin', className: 'text-error bg-error/10 border-error/30' },
  }[user.role];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Profile</h1>

      {/* Profile Card */}
      <div className="rounded-xl glass-elevated p-6 mb-4">
        <div className="flex items-start gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary-container flex items-center justify-center text-2xl font-bold text-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-semibold text-on-surface truncate">{user.name}</h2>
              <span
                className={`inline-block text-xs font-medium border rounded-full px-2.5 py-0.5 flex-shrink-0 ${roleBadge.className}`}
              >
                {roleBadge.label}
              </span>
            </div>
            <p className="text-sm text-secondary truncate">{user.email}</p>
          </div>
          <Link
            href="/profile/edit"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex-shrink-0"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href="/dashboard"
          className="rounded-xl glass-elevated p-4 hover:shadow-elevation-3 transition-colors"
        >
          <p className="text-2xl font-bold text-on-surface">{stats.projectCount}</p>
          <p className="text-sm text-secondary">
            {stats.projectCount === 1 ? 'Project' : 'Projects'}
          </p>
        </Link>
        <Link
          href="/socialthreads"
          className="rounded-xl glass-elevated p-4 hover:shadow-elevation-3 transition-colors"
        >
          <p className="text-2xl font-bold text-on-surface">{stats.postCount}</p>
          <p className="text-sm text-secondary">{stats.postCount === 1 ? 'Post' : 'Posts'}</p>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl glass-elevated divide-y divide-white/30 mb-4">
        <Link
          href="/profile/billing"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors first:rounded-t-xl"
        >
          <div>
            <p className="text-sm font-medium text-on-surface">Billing & Plan</p>
            <p className="text-xs text-secondary mt-0.5">
              {user.role === 'pro' ? 'Pro plan active' : 'Free plan — upgrade for more features'}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors"
        >
          <div>
            <p className="text-sm font-medium text-on-surface">My Projects</p>
            <p className="text-xs text-secondary mt-0.5">View and manage your quilt designs</p>
          </div>
          <svg
            className="w-4 h-4 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <Link
          href="/tutorials"
          className="flex items-center justify-between p-4 hover:bg-white/40 transition-colors last:rounded-b-xl"
        >
          <div>
            <p className="text-sm font-medium text-on-surface">Tutorials</p>
            <p className="text-xs text-secondary mt-0.5">Step-by-step quilting guides</p>
          </div>
          <svg
            className="w-4 h-4 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Upgrade CTA (free users only) */}
      {user.role === 'free' && (
        <div className="rounded-xl bg-primary-container p-4 mb-4 border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-1">Upgrade to Pro</h3>
          <p className="text-xs text-secondary mb-3">
            Unlock unlimited projects, full block library, fabric system, pattern export, and more.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isUpgradeLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isUpgradeLoading ? 'Loading...' : 'Upgrade Now'}
            </button>
            <Link
              href="/profile/billing"
              className="text-sm text-primary hover:underline transition-colors"
            >
              View plans
            </Link>
            {upgradeError && <p className="text-sm text-error">{upgradeError}</p>}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full rounded-xl glass-elevated p-4 text-sm font-medium text-error hover:bg-white/40 transition-colors text-left"
      >
        Sign Out
      </button>
    </div>
  );
}
