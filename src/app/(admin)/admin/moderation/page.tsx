'use client';

import { useState, useEffect } from 'react';
import { formatCreatorName } from '@/lib/format-utils';

interface Report {
  id: string;
  postId: string | null;
  commentId: string | null;
  reason: string;
  createdAt: string;
  reporterId: string;
  reporterName: string | null;
  reporterEmail: string | null;
}

interface SocialPost {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  likeCount: number;
  creatorName: string;
  userId: string;
  createdAt: string;
}

interface Comment {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  postId: string;
  postTitle: string | null;
}

type Tab = 'reports' | 'posts' | 'comments' | 'users';

export default function AdminModerationPage() {
  const [activeTab, setActiveTab] = useState<Tab>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      try {
        if (activeTab === 'reports') {
          const res = await fetch('/api/admin/reports');
          if (res.ok) {
            const data = await res.json();
            setReports(data.data?.reports ?? []);
          }
        } else if (activeTab === 'posts') {
          const res = await fetch('/api/admin/community');
          if (res.ok) {
            const data = await res.json();
            setPosts(data.data?.posts ?? []);
          }
        } else if (activeTab === 'comments') {
          const res = await fetch('/api/admin/comments?reported=true');
          if (res.ok) {
            const data = await res.json();
            setComments(data.data?.comments ?? []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, [activeTab]);

  async function handleDismissReport(reportId: string) {
    if (!confirm('Dismiss this report?')) return;
    setActionInProgress(reportId);
    try {
      const res = await fetch(`/api/admin/reports?id=${reportId}`, { method: 'DELETE' });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
      }
    } catch (error) {
      console.error('Failed to dismiss report:', error);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleRemovePost(postId: string) {
    if (!confirm('Remove this post? This action cannot be undone.')) return;
    setActionInProgress(postId);
    try {
      const res = await fetch(`/api/admin/community/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error('Failed to remove post:', error);
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleRemoveComment(commentId: string) {
    if (!confirm('Remove this comment?')) return;
    setActionInProgress(commentId);
    try {
      const res = await fetch(`/api/admin/comments?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error('Failed to remove comment:', error);
    } finally {
      setActionInProgress(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-on-surface">Community Moderation</h1>
        <p className="text-sm text-secondary mt-1">Review reports and moderate community content</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-outline-variant">
        {[
          { id: 'reports', label: 'Reports' },
          { id: 'posts', label: 'Posts' },
          { id: 'comments', label: 'Comments' },
          { id: 'users', label: 'Users' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Reporter
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 bg-surface">
                  {reports.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-secondary">
                        No reports to review
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id} className="hover:bg-surface-container-low">
                        <td className="px-4 py-3">
                          <span className="text-sm">{report.postId ? 'Post' : 'Comment'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-on-surface max-w-md truncate">
                            {report.reason}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {report.reporterName || report.reporterEmail || 'Anonymous'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDismissReport(report.id)}
                            disabled={actionInProgress === report.id}
                            className="text-sm font-medium text-primary hover:text-primary-dark disabled:opacity-50"
                          >
                            {actionInProgress === report.id ? '...' : 'Dismiss'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Creator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Likes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 bg-surface">
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-secondary">
                        No posts found
                      </td>
                    </tr>
                  ) : (
                    posts.map((post) => (
                      <tr key={post.id} className="hover:bg-surface-container-low">
                        <td className="px-4 py-3">
                          <div className="max-w-md">
                            <p className="font-medium text-on-surface truncate">{post.title}</p>
                            {post.description && (
                              <p className="text-xs text-secondary mt-0.5 line-clamp-1">
                                {post.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {formatCreatorName(post.creatorName)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">{post.likeCount}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemovePost(post.id)}
                            disabled={actionInProgress === post.id}
                            className="text-sm font-medium text-error hover:text-error/80 disabled:opacity-50"
                          >
                            {actionInProgress === post.id ? '...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <table className="w-full">
                <thead className="bg-surface-container-high">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Comment
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Author
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      On Post
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 bg-surface">
                  {comments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-secondary">
                        No reported comments
                      </td>
                    </tr>
                  ) : (
                    comments.map((comment) => (
                      <tr key={comment.id} className="hover:bg-surface-container-low">
                        <td className="px-4 py-3">
                          <p className="text-sm text-on-surface max-w-md truncate">
                            {comment.content}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {formatCreatorName(comment.authorName)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary max-w-xs truncate block">
                            {comment.postTitle || 'Deleted Post'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-secondary">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRemoveComment(comment.id)}
                            disabled={actionInProgress === comment.id}
                            className="text-sm font-medium text-error hover:text-error/80 disabled:opacity-50"
                          >
                            {actionInProgress === comment.id ? '...' : 'Remove'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Users Tab - Placeholder */}
          {activeTab === 'users' && (
            <div className="p-8 text-center text-secondary bg-surface-container-low rounded-xl">
              <p>User management coming soon. Use the role update API for now.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
