'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

type ModerationStatus = 'pending' | 'approved' | 'rejected';

interface ModerationPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  creatorName: string;
  createdAt: string;
  status: ModerationStatus;
}

export function ModerationPanel() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [activeTab, setActiveTab] = useState<ModerationStatus>('pending');
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async (status: ModerationStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/community?status=${status}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to load posts');
        setIsLoading(false);
        return;
      }

      setPosts(json.data?.posts ?? []);
    } catch {
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin()) {
      fetchPosts(activeTab);
    }
  }, [activeTab, isAdmin, fetchPosts]);

  async function handleModerate(postId: string, status: 'approved' | 'rejected') {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/admin/community/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch {
      // Silently handle — post remains in list so admin can retry
    } finally {
      setActionLoading(null);
    }
  }

  if (!isAdmin()) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-secondary">Access denied.</p>
      </div>
    );
  }

  const tabs: { label: string; value: ModerationStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Moderation Queue</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-container rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-8">
          <p className="text-secondary mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchPosts(activeTab)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-secondary">No {activeTab} posts.</p>
        </div>
      )}

      {/* Post List */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 rounded-lg bg-surface-container p-4"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-surface-container-high">
                {post.thumbnailUrl ? (
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-primary-container flex items-center justify-center">
                    <span className="text-lg text-primary/40">&#9632;</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-on-surface truncate">{post.title}</h3>
                <p className="text-xs text-secondary">
                  by {post.creatorName} &middot; {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              {activeTab === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModerate(post.id, 'approved')}
                    disabled={actionLoading === post.id}
                    className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModerate(post.id, 'rejected')}
                    disabled={actionLoading === post.id}
                    className="rounded-md bg-error px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
