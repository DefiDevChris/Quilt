'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [isUpgradeLoading, setIsUpgradeLoading] = useState(false);

  async function handleUpgrade() {
    setIsUpgradeLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch {
      console.error('Failed to create checkout session');
    } finally {
      setIsUpgradeLoading(false);
    }
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

      <div className="rounded-lg bg-surface-container p-6">
        <div className="flex items-start gap-4 mb-6">
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
          <div>
            <h2 className="text-lg font-semibold text-on-surface">{user.name}</h2>
            <p className="text-sm text-secondary">{user.email}</p>
            <span
              className={`inline-block mt-2 text-xs font-medium border rounded-full px-2.5 py-0.5 ${roleBadge.className}`}
            >
              {roleBadge.label}
            </span>
          </div>
        </div>

        {user.role === 'free' && (
          <div className="rounded-lg bg-primary-container p-4">
            <h3 className="text-sm font-semibold text-primary mb-1">Upgrade to Pro</h3>
            <p className="text-xs text-secondary mb-3">
              Unlock unlimited projects, full block library, fabric system, pattern export, and
              more.
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
