'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { formatRelativeTime } from '@/lib/format-time';
import { SocialThreadsHeader } from './SocialThreadsHeader';
import { SocialThreadsSidebar } from './SocialThreadsSidebar';
import { RedditStyleComments } from './comments/RedditStyleComments';
import type { CommunityPost } from '@/stores/communityStore';

interface ModernPostDetailProps {
  postId: string;
}

export function ModernPostDetail({ postId }: ModernPostDetailProps) {
  const user = useAuthStore((s) => s.user);
  const storePosts = useCommunityStore((s) => s.posts);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const currentStorePosts = useCommunityStore.getState().posts;
    const fromStore = currentStorePosts.find((p) => p.id === postId);
    if (fromStore) {
      setPost(fromStore);
      setIsSaved(fromStore.isSavedByUser);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/community/${encodeURIComponent(postId)}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setError('not_found');
        } else {
          setError('Failed to load design');
        }
        setIsLoading(false);
        return;
      }

      const found = json.data as CommunityPost | undefined;
      if (found) {
        setPost(found);
        setIsSaved(found.isSavedByUser);
      } else {
        setError('not_found');
      }
    } catch {
      setError('Failed to load design');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPost();
  }, [postId, fetchPost]);

  useEffect(() => {
    const fromStore = storePosts.find((p) => p.id === postId);
    if (fromStore && post) {
      setPost(fromStore);
    }
  }, [storePosts, postId, post]);

  const handleShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, []);

  const handleFollowToggle = useCallback(async () => {
    if (!post?.creatorId || !user) return;

    const nextState = !isFollowing;
    setIsFollowing(nextState);

    try {
      const res = await fetch(`/api/follows/${post.creatorId}`, {
        method: nextState ? 'POST' : 'DELETE',
      });
      if (!res.ok) {
        setIsFollowing(!nextState);
      }
    } catch {
      setIsFollowing(!nextState);
    }
  }, [post?.creatorId, user, isFollowing]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SocialThreadsHeader />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <SocialThreadsSidebar />
            <main className="flex-1">
              <PostDetailSkeleton />
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'not_found') {
    return (
      <div className="min-h-screen bg-background">
        <SocialThreadsHeader />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <SocialThreadsSidebar />
            <main className="flex-1">
              <div className="text-center py-16 bg-background rounded-2xl border border-outline-variant">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-container flex items-center justify-center">
                  <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-secondary mb-4">This design was not found.</p>
                <Link href="/socialthreads" className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-on hover:opacity-90 transition-opacity">
                  Back to Social Threads
                </Link>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <SocialThreadsHeader />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            <SocialThreadsSidebar />
            <main className="flex-1">
              <div className="text-center py-16 bg-background rounded-2xl border border-outline-variant">
                <p className="text-secondary mb-4">{error}</p>
                <button
                  type="button"
                  onClick={fetchPost}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-on hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwnPost = user?.id === post.creatorId;

  return (
    <div className="min-h-screen bg-background">
      <SocialThreadsHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <SocialThreadsSidebar />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Back Link */}
            <Link
              href="/socialthreads"
              className="inline-flex items-center gap-2 text-sm text-secondary hover:text-on-surface transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Social Threads
            </Link>

            {/* Post Card */}
            <article className="bg-background rounded-2xl border border-outline-variant overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-outline-variant">
                <div className="flex items-center gap-3">
                  {post.creatorAvatarUrl ? (
                    <Image
                      src={post.creatorAvatarUrl}
                      alt={post.creatorName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-outline-variant"
                      unoptimized
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center ring-2 ring-outline-variant">
                      <span className="text-sm font-semibold text-primary">{post.creatorName.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <Link
                      href={post.creatorUsername ? `/members/${post.creatorUsername}` : '#'}
                      className="font-semibold text-on-surface hover:text-primary transition-colors"
                    >
                      {post.creatorName}
                    </Link>
                    <p className="text-xs text-secondary">
                      {formatRelativeTime(post.createdAt)} · <CategoryBadge category={post.category} />
                    </p>
                  </div>
                </div>

                {!isOwnPost && user && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      isFollowing
                        ? 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                        : 'bg-primary text-primary-on hover:opacity-90'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Post Content */}
              <div className="p-4">
                <h1 className="text-2xl font-bold text-on-surface mb-3">{post.title}</h1>
                
                {post.description && (
                  <p className="text-on-surface whitespace-pre-wrap leading-relaxed mb-4">{post.description}</p>
                )}
              </div>

              {/* Post Image */}
              {post.thumbnailUrl && (
                <div className="relative w-full bg-surface-container">
                  <Image
                    src={post.thumbnailUrl}
                    alt={post.title}
                    width={1200}
                    height={800}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    unoptimized
                    priority
                  />
                </div>
              )}

              {/* Linked Project */}
              {post.projectId && (
                <div className="p-4 border-t border-outline-variant">
                  <Link
                    href={`/dashboard/projects/${post.projectId}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
                  >
                    {post.projectThumbnailUrl ? (
                      <Image
                        src={post.projectThumbnailUrl}
                        alt={post.projectName || 'Project'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs text-secondary uppercase tracking-wide">View Project</p>
                      <p className="font-semibold text-on-surface">{post.projectName || 'Untitled Project'}</p>
                    </div>
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                </div>
              )}

              {/* Action Bar */}
              <div className="p-4 border-t border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VoteButtons postId={post.id} likeCount={post.likeCount} isLikedByUser={post.isLikedByUser} />
                  
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-secondary hover:bg-surface-container transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                    </svg>
                    <span className="text-sm font-medium">{post.commentCount} Comments</span>
                  </button>

                  <button
                    onClick={handleShareLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-secondary hover:bg-surface-container transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                    </svg>
                    <span className="text-sm font-medium">{copiedLink ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                <SaveButton postId={post.id} isSaved={isSaved} onToggle={() => setIsSaved(!isSaved)} />
              </div>
            </article>

            {/* Comments Section */}
            <div className="mt-6">
              <RedditStyleComments postId={postId} currentUserId={user?.id} isAdmin={user?.role === 'admin'} />
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-80 hidden xl:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <AboutQuilter 
              creatorName={post.creatorName}
              creatorUsername={post.creatorUsername}
              creatorAvatarUrl={post.creatorAvatarUrl}
              isPro={post.isPro}
            />
            <MoreFromQuilter creatorId={post.creatorId} currentPostId={post.id} />
          </aside>
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    'Show & Tell': 'text-emerald-600 bg-emerald-50',
    'Work in Progress': 'text-amber-600 bg-amber-50',
    Help: 'text-rose-600 bg-rose-50',
    Inspiration: 'text-violet-600 bg-violet-50',
    General: 'text-slate-600 bg-slate-50',
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[category] || colors.General}`}>
      {category}
    </span>
  );
}

function VoteButtons({ postId, likeCount, isLikedByUser }: { postId: string; likeCount: number; isLikedByUser: boolean }) {
  const user = useAuthStore((s) => s.user);
  const likePost = useCommunityStore((s) => s.likePost);
  const unlikePost = useCommunityStore((s) => s.unlikePost);

  function handleVote(upvote: boolean) {
    if (!user) return;
    if (isLikedByUser && upvote) {
      unlikePost(postId);
    } else if (!isLikedByUser && upvote) {
      likePost(postId);
    }
  }

  return (
    <div className="flex items-center bg-surface-container rounded-full overflow-hidden">
      <button
        onClick={() => handleVote(true)}
        className={`p-2 hover:bg-surface-container-high transition-colors ${
          isLikedByUser ? 'text-error' : 'text-secondary'
        }`}
        title="Upvote"
      >
        <svg className="w-5 h-5" fill={isLikedByUser ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 15.75l7.5-7.5 7.5 7.5" />
        </svg>
      </button>
      
      <span className={`px-1 text-sm font-bold ${isLikedByUser ? 'text-error' : 'text-on-surface'}`}>
        {likeCount}
      </span>
      
      <button
        onClick={() => handleVote(false)}
        className="p-2 text-secondary hover:bg-surface-container-high transition-colors"
        title="Downvote"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
    </div>
  );
}

function SaveButton({ postId, isSaved, onToggle }: { postId: string; isSaved: boolean; onToggle: () => void }) {
  const user = useAuthStore((s) => s.user);
  const toggleSavePost = useCommunityStore((s) => s.toggleSavePost);

  function handleClick() {
    if (!user) return;
    toggleSavePost(postId, isSaved);
    onToggle();
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors ${
        isSaved ? 'text-primary' : 'text-secondary hover:bg-surface-container'
      }`}
      title={isSaved ? 'Unsave' : 'Save'}
    >
      <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
      </svg>
    </button>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="bg-background rounded-2xl border border-outline-variant overflow-hidden animate-pulse">
      <div className="p-4 flex items-center gap-3 border-b border-outline-variant">
        <div className="w-10 h-10 rounded-full bg-surface-container-high" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-container-high rounded" />
          <div className="h-3 w-20 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="h-6 w-3/4 bg-surface-container-high rounded" />
        <div className="h-4 w-full bg-surface-container-high rounded" />
        <div className="h-4 w-2/3 bg-surface-container-high rounded" />
      </div>
      <div className="aspect-video bg-surface-container-high" />
    </div>
  );
}

function AboutQuilter({ 
  creatorName, 
  creatorUsername, 
  creatorAvatarUrl, 
  isPro 
}: { 
  creatorName: string; 
  creatorUsername: string | null; 
  creatorAvatarUrl: string | null;
  isPro: boolean;
}) {
  return (
    <div className="bg-background rounded-2xl border border-outline-variant p-4 mb-4">
      <h3 className="font-semibold text-on-surface mb-4">About the Quilter</h3>
      
      <div className="flex items-center gap-3 mb-4">
        {creatorAvatarUrl ? (
          <Image
            src={creatorAvatarUrl}
            alt={creatorName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">{creatorName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        
        <div className="flex-1">
          <p className="font-semibold text-on-surface">{creatorName}</p>
          {creatorUsername && <p className="text-sm text-secondary">@{creatorUsername}</p>}
          {isPro && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary-container px-2 py-0.5 rounded-full mt-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Pro Member
            </span>
          )}
        </div>
      </div>

      <Link
        href={creatorUsername ? `/members/${creatorUsername}` : '#'}
        className="block w-full text-center py-2 rounded-full bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
      >
        View Profile
      </Link>
    </div>
  );
}

function MoreFromQuilter({ creatorId, currentPostId }: { creatorId: string | null; currentPostId: string }) {
  if (!creatorId) return null;

  return (
    <div className="bg-background rounded-2xl border border-outline-variant p-4">
      <h3 className="font-semibold text-on-surface mb-4">More from this Quilter</h3>
      <p className="text-sm text-secondary text-center py-4">More designs coming soon...</p>
    </div>
  );
}
