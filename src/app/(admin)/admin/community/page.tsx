'use client';

import { useEffect, useState } from 'react';
import { SectionTitle } from '@/components/ui/SectionTitle';

interface SocialPost {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  userId: string;
  createdAt: string;
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch('/api/admin/community');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data?.posts ?? []);
        }
      } catch (err) {
        console.error('Failed to fetch posts', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleRemovePost = async (postId: string) => {
    if (!confirm('Are you sure you want to remove this post?')) return;
    try {
      const res = await fetch(`/api/admin/community/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error('Failed to remove post', err);
    }
  };

  const handleUpdateUserStatus = async (userId: string, status: 'suspended' | 'banned') => {
    if (!confirm(`Are you sure you want to mark this user as ${status}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        alert(`User successfully marked as ${status}.`);
      } else {
        const error = await res.json();
        alert(`Error: ${error.error}`);
      }
    } catch (err) {
      console.error('Failed to update user status', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-secondary animate-pulse">Loading community posts...</div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle>Community Moderation</SectionTitle>
      <p className="text-secondary text-sm">Manage social posts and users.</p>

      <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">
                Post
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">
                Author
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-secondary">
                  No posts found.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-on-surface">{post.title || 'Untitled'}</p>
                    {post.description && (
                      <p className="text-sm text-secondary truncate max-w-xs">{post.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-secondary">{post.creatorName}</td>
                  <td className="px-4 py-3 text-sm text-secondary">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleUpdateUserStatus(post.userId, 'suspended')}
                        className="text-sm font-medium text-secondary hover:text-on-surface transition-colors"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={() => handleUpdateUserStatus(post.userId, 'banned')}
                        className="text-sm font-medium text-error hover:opacity-80 transition-opacity"
                      >
                        Ban User
                      </button>
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        className="text-sm font-medium text-error hover:opacity-80 transition-opacity"
                      >
                        Remove Post
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
