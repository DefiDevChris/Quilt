'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPosts = useCallback(
    async (page: number) => {
      try {
        const res = await fetch(`/api/admin/blog?page=${page}&limit=${pagination.limit}`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data?.posts ?? []);
          setPagination(data.data?.pagination ?? pagination);
        }
      } catch {
        // fetch failed silently
      } finally {
        setLoading(false);
      }
    },
    [pagination]
  );

  useEffect(() => {
    fetchPosts(pagination.page);
  }, [fetchPosts, pagination.page]);

  async function handleTogglePublish(postId: string, currentStatus: string) {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: newStatus as BlogPost['status'] } : p))
        );
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
    }
  }

  async function handleDelete(postId: string) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    setDeletingId(postId);
    try {
      const res = await fetch(`/api/admin/blog/${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setDeletingId(null);
    }
  }

  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'published':
        return 'bg-success/10 text-success border-success/20';
      case 'draft':
        return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'archived':
        return 'bg-surface-container-highest text-secondary border-outline-variant';
      default:
        return 'bg-surface-container-highest text-secondary border-outline-variant';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-sm h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-secondary">Manage your blog content</p>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-primary text-white font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      <div className="rounded-sm border border-outline-variant overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container-high">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                Published
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30 bg-surface">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-secondary">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="font-medium text-on-surface truncate">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-secondary mt-0.5 line-clamp-1">{post.excerpt}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-secondary">{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-medium border ${getStatusBadgeClass(
                        post.status
                      )}`}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.publishedAt ? (
                      <span className="text-sm text-secondary">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-secondary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(post.id, post.status)}
                        className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        disabled={deletingId === post.id}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className={`text-sm font-medium transition-colors ${deletingId === post.id ? 'pointer-events-none opacity-50 text-secondary' : 'text-secondary hover:text-on-surface'}`}
                        aria-disabled={deletingId === post.id}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-sm font-medium text-error hover:text-error/80 transition-colors disabled:opacity-50"
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            posts
          </p>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1.5 rounded-sm border border-outline-variant text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.totalPages, prev.page + 1),
                }))
              }
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-sm border border-outline-variant text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
