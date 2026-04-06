'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

type BlogModerationStatus = 'pending' | 'published' | 'rejected' | 'draft';

interface BlogModerationPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  authorName: string;
  status: BlogModerationStatus;
  createdAt: string;
  publishedAt: string | null;
  readTimeMinutes: number;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return '--';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const STATUS_STYLES: Record<BlogModerationStatus, string> = {
  pending: 'bg-primary-container/40 text-primary-dark',
  published: 'bg-primary-container/40 text-primary',
  rejected: 'bg-primary-container/40 text-error',
  draft: 'bg-secondary/40 text-secondary',
};

export function BlogModerationPanel() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const [activeTab, setActiveTab] = useState<BlogModerationStatus>('pending');
  const [posts, setPosts] = useState<BlogModerationPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPosts = useCallback(async (status: BlogModerationStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/blog/admin?status=${status}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to load blog posts');
        setIsLoading(false);
        return;
      }

      setPosts(json.data?.posts ?? []);
    } catch {
      setError('Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPosts(activeTab);
    }
  }, [activeTab, isAdmin, fetchPosts]);

  async function handleModerate(postId: string, status: 'published' | 'rejected') {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/blog/admin/${postId}/status`, {
        method: 'PUT',
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

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <p className="text-secondary">Access denied.</p>
      </div>
    );
  }

  const tabs: { label: string; value: BlogModerationStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Published', value: 'published' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Drafts', value: 'draft' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Blog Moderation</h1>

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
          <p className="text-secondary">No {activeTab} blog posts.</p>
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
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-on-surface truncate">{post.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[post.status]}`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="text-xs text-secondary">
                  by {post.authorName} &middot; {post.category} &middot;{' '}
                  {formatDate(post.createdAt)} &middot; {post.readTimeMinutes} min read
                </p>
                {post.excerpt && (
                  <p className="text-xs text-secondary mt-1 line-clamp-1">{post.excerpt}</p>
                )}
              </div>

              {/* Actions */}
              {activeTab === 'pending' && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleModerate(post.id, 'published')}
                    disabled={actionLoading === post.id}
                    className="rounded-md bg-success px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    Publish
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
