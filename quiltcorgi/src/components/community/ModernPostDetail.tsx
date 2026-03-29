'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { formatRelativeTime } from '@/lib/format-time';
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
        setError(res.status === 404 ? 'not_found' : 'Failed to load design');
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
    if (fromStore && post) setPost(fromStore);
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
      if (!res.ok) setIsFollowing(!nextState);
    } catch {
      setIsFollowing(!nextState);
    }
  }, [post?.creatorId, user, isFollowing]);

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error === 'not_found' || error) {
    return (
      <div className="glass-panel-social rounded-[2rem] p-12 text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-slate-600 mb-5">
          {error === 'not_found' ? 'This design was not found.' : error}
        </p>
        {error === 'not_found' ? (
          <Link
            href="/socialthreads"
            className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:from-orange-500 hover:to-rose-500 transition-all"
          >
            Back to Feed
          </Link>
        ) : (
          <button
            type="button"
            onClick={fetchPost}
            className="bg-gradient-to-r from-orange-400 to-rose-400 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:from-orange-500 hover:to-rose-500 transition-all"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!post) return null;

  const isOwnPost = user?.id === post.creatorId;

  return (
    <div className="flex gap-5">
      {/* Main post column */}
      <main className="flex-1 min-w-0">
        <Link
          href="/socialthreads"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Feed
        </Link>

        {/* Post Card */}
        <article className="glass-panel-social rounded-[2rem] overflow-hidden">
          {/* Post Header */}
          <div className="p-5 flex items-center justify-between border-b border-white/40">
            <div className="flex items-center gap-3">
              {post.creatorAvatarUrl ? (
                <Image
                  src={post.creatorAvatarUrl}
                  alt={post.creatorName}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  unoptimized
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-100 ring-2 ring-white shadow-sm flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-500">
                    {post.creatorName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <Link
                  href={post.creatorUsername ? `/members/${post.creatorUsername}` : '#'}
                  className="font-bold text-slate-800 hover:text-orange-500 transition-colors"
                >
                  {post.creatorName}
                </Link>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  {formatRelativeTime(post.createdAt)}
                </p>
              </div>
            </div>

            {!isOwnPost && user && (
              <button
                onClick={handleFollowToggle}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                  isFollowing
                    ? 'bg-white/60 text-slate-700 hover:bg-white/80 border border-white/60'
                    : 'bg-gradient-to-r from-orange-400 to-rose-400 text-white hover:from-orange-500 hover:to-rose-500'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Post Content */}
          <div className="p-5">
            <h1 className="text-2xl font-extrabold text-slate-800 mb-3 leading-tight">
              {post.title}
            </h1>
            {post.description && (
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                {post.description}
              </p>
            )}
          </div>

          {/* Post Image */}
          {post.thumbnailUrl && (
            <div className="relative w-full bg-white/30">
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
            <div className="p-5 border-t border-white/40">
              <Link
                href={`/studio/${post.projectId}`}
                className="flex items-center gap-3 p-3 rounded-[1.5rem] bg-white/50 hover:bg-white/80 border border-white/60 transition-all group"
              >
                {post.projectThumbnailUrl ? (
                  <Image
                    src={post.projectThumbnailUrl}
                    alt={post.projectName || 'Project'}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-xl object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                      />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    View Project
                  </p>
                  <p className="font-bold text-slate-800 group-hover:text-orange-500 transition-colors">
                    {post.projectName || 'Untitled Project'}
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Link>
            </div>
          )}

          {/* Action Bar */}
          <div className="p-5 border-t border-white/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <VoteButtons
                postId={post.id}
                likeCount={post.likeCount}
                isLikedByUser={post.isLikedByUser}
              />

              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-600 hover:bg-white/60 transition-colors text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                  />
                </svg>
                {post.commentCount} Comments
              </button>

              <button
                onClick={handleShareLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-600 hover:bg-white/60 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                  />
                </svg>
                {copiedLink ? 'Copied!' : 'Share'}
              </button>
            </div>

            <SaveButton postId={post.id} isSaved={isSaved} onToggle={() => setIsSaved(!isSaved)} />
          </div>
        </article>

        {/* Comments */}
        <div className="mt-4">
          <RedditStyleComments
            postId={postId}
            currentUserId={user?.id}
            isAdmin={user?.role === 'admin'}
          />
        </div>
      </main>

      {/* Quilter Info Sidebar */}
      <aside className="w-64 hidden xl:block shrink-0 space-y-4 pt-10">
        <AboutQuilter
          creatorName={post.creatorName}
          creatorUsername={post.creatorUsername}
          creatorAvatarUrl={post.creatorAvatarUrl}
          isPro={post.isPro}
        />
        <MoreFromQuilter creatorId={post.creatorId} currentPostId={post.id} />
      </aside>
    </div>
  );
}

function VoteButtons({
  postId,
  likeCount,
  isLikedByUser,
}: {
  postId: string;
  likeCount: number;
  isLikedByUser: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const likePost = useCommunityStore((s) => s.likePost);
  const unlikePost = useCommunityStore((s) => s.unlikePost);

  function handleVote(upvote: boolean) {
    if (!user) return;
    if (isLikedByUser && upvote) unlikePost(postId);
    else if (!isLikedByUser && upvote) likePost(postId);
  }

  return (
    <div className="flex items-center bg-white/50 border border-white/60 rounded-full overflow-hidden">
      <button
        onClick={() => handleVote(true)}
        className={`p-2 hover:bg-white/70 transition-colors ${
          isLikedByUser ? 'text-rose-500' : 'text-slate-500'
        }`}
        title="Like"
      >
        <svg
          className="w-4 h-4"
          fill={isLikedByUser ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>
      <span
        className={`px-1 text-sm font-bold ${isLikedByUser ? 'text-rose-500' : 'text-slate-700'}`}
      >
        {likeCount}
      </span>
    </div>
  );
}

function SaveButton({
  postId,
  isSaved,
  onToggle,
}: {
  postId: string;
  isSaved: boolean;
  onToggle: () => void;
}) {
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
        isSaved ? 'text-orange-500' : 'text-slate-500 hover:bg-white/60'
      }`}
      title={isSaved ? 'Unsave' : 'Save'}
    >
      <svg
        className="w-5 h-5"
        fill={isSaved ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    </button>
  );
}

function PostDetailSkeleton() {
  return (
    <div className="glass-panel-social rounded-[2rem] overflow-hidden animate-pulse">
      <div className="p-5 flex items-center gap-3 border-b border-white/40">
        <div className="w-10 h-10 rounded-full bg-white/50" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/50 rounded-full" />
          <div className="h-3 w-20 bg-white/50 rounded-full" />
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="h-6 w-3/4 bg-white/50 rounded-full" />
        <div className="h-4 w-full bg-white/50 rounded-full" />
        <div className="h-4 w-2/3 bg-white/50 rounded-full" />
      </div>
      <div className="aspect-video bg-white/30" />
    </div>
  );
}

function AboutQuilter({
  creatorName,
  creatorUsername,
  creatorAvatarUrl,
  isPro,
}: {
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  isPro: boolean;
}) {
  return (
    <div className="glass-panel-social rounded-[1.5rem] p-5">
      <h3 className="text-sm font-extrabold text-slate-800 mb-4">About the Quilter</h3>

      <div className="flex items-center gap-3 mb-4">
        {creatorAvatarUrl ? (
          <Image
            src={creatorAvatarUrl}
            alt={creatorName}
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-white shadow-sm flex items-center justify-center">
            <span className="text-lg font-bold text-orange-500">
              {creatorName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{creatorName}</p>
          {creatorUsername && (
            <p className="text-xs text-slate-500 font-medium">@{creatorUsername}</p>
          )}
          {isPro && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full mt-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Pro Member
            </span>
          )}
        </div>
      </div>

      <Link
        href={creatorUsername ? `/members/${creatorUsername}` : '#'}
        className="block w-full text-center py-2 rounded-full bg-white/60 hover:bg-white/90 border border-white/60 hover:border-orange-300 text-sm font-bold text-slate-700 hover:text-orange-600 transition-all"
      >
        View Profile
      </Link>
    </div>
  );
}

function MoreFromQuilter({
  creatorId,
  currentPostId,
}: {
  creatorId: string | null;
  currentPostId: string;
}) {
  const [otherPosts, setOtherPosts] = useState<{ id: string; title: string; thumbnailUrl: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!creatorId) return;
    (async () => {
      try {
        const res = await fetch(`/api/community?sort=newest&limit=4`);
        const json = await res.json();
        if (res.ok && json.data?.posts) {
          const filtered = json.data.posts
            .filter((p: { id: string; creatorId: string }) => p.creatorId === creatorId && p.id !== currentPostId)
            .slice(0, 3);
          setOtherPosts(filtered);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    })();
  }, [creatorId, currentPostId]);

  if (!creatorId) return null;

  return (
    <div className="glass-panel-social rounded-[1.5rem] p-5">
      <h3 className="text-sm font-extrabold text-slate-800 mb-3">More from this Quilter</h3>
      {!loaded ? (
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-white/50 rounded-xl" />
          <div className="h-16 bg-white/50 rounded-xl" />
        </div>
      ) : otherPosts.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-3">No other designs yet</p>
      ) : (
        <div className="space-y-2">
          {otherPosts.map((p) => (
            <Link
              key={p.id}
              href={`/socialthreads/${p.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              {p.thumbnailUrl && (
                <Image
                  src={p.thumbnailUrl}
                  alt={p.title}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                  unoptimized
                />
              )}
              <p className="text-sm font-medium text-slate-700 truncate">{p.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
