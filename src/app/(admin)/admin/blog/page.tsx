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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-[#ffc8a6]/10 text-[#6b655e] border-[#ffc8a6]/20';
      case 'archived':
        return 'bg-[#fdfaf7] text-[#6b655e] border-[#e8e1da]';
      default:
        return 'bg-[#fdfaf7] text-[#6b655e] border-[#e8e1da]';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse rounded-lg h-8 w-8 bg-[#ff8d49]/20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6b655e]">Manage your blog content</p>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#ff8d49] text-[#ffffff] font-medium hover:bg-[#e67d3f] transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Post
        </Link>
      </div>

      <div className="rounded-lg border border-[#e8e1da] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#fdfaf7]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b655e]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b655e]">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b655e]">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b655e]">
                Published
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#6b655e]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e1da]/30 bg-[#ffffff]">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#6b655e]">
                  No blog posts yet. Create your first post!
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-[#fdfaf7]/60 transition-colors duration-150">
                  <td className="px-4 py-3">
                    <div className="max-w-md">
                      <p className="font-medium text-[#2d2a26] truncate">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-[#6b655e] mt-0.5 line-clamp-1">{post.excerpt}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#6b655e]">{post.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${getStatusBadgeClass(
                        post.status
                      )}`}
                    >
                      {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {post.publishedAt ? (
                      <span className="text-sm text-[#6b655e]">
                        {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-sm text-[#6b655e]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTogglePublish(post.id, post.status)}
                        className="text-sm font-medium text-[#ff8d49] hover:text-[#e67d3f] transition-colors duration-150"
                        disabled={deletingId === post.id}
                      >
                        {post.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className={`text-sm font-medium transition-colors duration-150 ${deletingId === post.id ? 'pointer-events-none opacity-50 text-[#6b655e]' : 'text-[#6b655e] hover:text-[#2d2a26]'}`}
                        aria-disabled={deletingId === post.id}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors duration-150 disabled:opacity-50"
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
          <p className="text-sm text-[#6b655e]">
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
              className="px-3 py-1.5 rounded-lg border border-[#e8e1da] text-sm font-medium text-[#6b655e] hover:bg-[#fdfaf7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
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
              className="px-3 py-1.5 rounded-lg border border-[#e8e1da] text-sm font-medium text-[#6b655e] hover:bg-[#fdfaf7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
