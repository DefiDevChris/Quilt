'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { LikeButton } from '@/components/community/LikeButton';
import { formatRelativeTime } from '@/lib/format-time';
import { Calendar, MapPin, Globe, Pencil } from 'lucide-react';

interface UserProfilePageProps {
  username: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

type ProfileTab = 'posts' | 'about';

export function UserProfilePage({ username }: UserProfilePageProps) {
  const { profile, posts, pagination, isLoading, error, fetchProfile, loadMore } =
    useProfileStore();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  useEffect(() => {
    fetchProfile(username);
    return () => {
      useProfileStore.getState().reset();
    };
  }, [username, fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const isOwner = currentUser?.id === profile.userId;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;
  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-3xl mx-auto">
      {/* Cover + Avatar */}
      <div className="relative mb-16">
        <div className="h-36 rounded-xl bg-gradient-to-r from-primary/20 via-primary-container/40 to-primary/10" />
        <div className="absolute -bottom-12 left-6 flex items-end gap-5">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-elevation-1"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary-container border-4 border-white shadow-elevation-1 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-dark">
                {getInitials(profile.displayName)}
              </span>
            </div>
          )}
        </div>
        <div className="absolute -bottom-10 right-0 flex items-center gap-2">
          {isOwner ? (
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all shadow-elevation-1"
            >
              <Pencil size={14} />
              Edit Profile
            </Link>
          ) : (
            <FollowButton username={username} initialFollowing={profile.isFollowedByCurrentUser} />
          )}
        </div>
      </div>

      {/* Name + Meta */}
      <div className="px-1 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-on-surface">{profile.displayName}</h1>
        </div>
        <p className="text-sm text-secondary mb-3">@{profile.username}</p>

        {profile.bio && <p className="text-on-surface mb-4 leading-relaxed">{profile.bio}</p>}

        <div className="flex flex-wrap items-center gap-4 text-sm text-secondary">
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {profile.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            Joined {joinDate}
          </span>
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-primary hover:underline"
            >
              <Globe size={14} />
              Website
            </a>
          )}
        </div>

        <SocialLinks profile={profile} />
      </div>

      {/* Stats */}
      <div className="flex gap-6 px-1 mb-6 pb-6 border-b border-outline-variant">
        <div>
          <span className="text-xl font-bold text-on-surface">{pagination?.total ?? 0}</span>
          <span className="text-sm text-secondary ml-1.5">posts</span>
        </div>
        <div>
          <span className="text-xl font-bold text-on-surface">{profile.followerCount}</span>
          <span className="text-sm text-secondary ml-1.5">followers</span>
        </div>
        <div>
          <span className="text-xl font-bold text-on-surface">{profile.followingCount}</span>
          <span className="text-sm text-secondary ml-1.5">following</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'posts' ? 'text-on-surface' : 'text-secondary hover:text-on-surface'
            }`}
        >
          Posts
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-on-surface rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'about' ? 'text-on-surface' : 'text-secondary hover:text-on-surface'
            }`}
        >
          About
          {activeTab === 'about' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-on-surface rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-secondary">
                {isOwner
                  ? "You haven't shared any projects yet."
                  : `${profile.displayName} hasn't shared any projects yet.`}
              </p>
              {isOwner && (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 mt-4 bg-gradient-to-r from-primary to-primary-dark text-white px-5 py-2 rounded-full font-semibold hover:opacity-90 transition-all"
                >
                  Create Your First Design
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  creatorName={profile.displayName}
                  creatorUsername={profile.username}
                  creatorAvatarUrl={profile.avatarUrl ?? null}
                />
              ))}

              {hasMore && (
                <div className="col-span-full flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="glass-panel rounded-full px-6 py-2.5 text-sm font-medium text-on-surface hover:shadow-elevation-1 transition-all disabled:opacity-50"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'about' && <AboutTab profile={profile} />}
    </div>
  );
}

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
}

function FollowButton({ username, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);

  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(username)}/follow`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        setFollowing(json.data.following);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      onClick={handleFollow}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-elevation-1 ${following
        ? 'bg-surface-container border border-outline-variant text-secondary hover:bg-error/10 hover:text-error hover:border-error/20'
        : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:opacity-90'
        }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

interface PostCardProps {
  post: {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    likeCount: number;
    commentCount: number;
    category: string;
    createdAt: string;
    isLikedByUser: boolean;
  };
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
}

function PostCard({ post }: PostCardProps) {
  return (
    <article className="glass-panel rounded-xl overflow-hidden hover:shadow-elevation-2 transition-all">
      <Link href={`/socialthreads/${post.id}`} className="block">
        {post.thumbnailUrl ? (
          <div className="relative w-full aspect-[4/3] bg-primary-container/20">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-primary-container/30 flex items-center justify-center">
            <span className="text-4xl text-primary/30">&#9632;</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`/socialthreads/${post.id}`}>
          <h3 className="font-semibold text-on-surface line-clamp-1 mb-1 hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        <div className="flex items-center gap-4 mt-2">
          <LikeButton
            postId={post.id}
            likeCount={post.likeCount}
            isLikedByUser={post.isLikedByUser}
            size="sm"
          />
          <Link
            href={`/socialthreads/${post.id}`}
            className="flex items-center gap-1 text-sm text-secondary hover:text-on-surface transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              />
            </svg>
            {post.commentCount}
          </Link>
          <span className="text-xs text-secondary ml-auto">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>
      </div>
    </article>
  );
}

function AboutTab({
  profile,
}: {
  profile: {
    bio: string | null;
    location: string | null;
    websiteUrl: string | null;
    instagramHandle: string | null;
    youtubeHandle: string | null;
    tiktokHandle: string | null;
    publicEmail: string | null;
    createdAt: string;
    isPro: boolean;
  };
}) {
  return (
    <div className="space-y-6">
      {profile.bio && (
        <div>
          <h3 className="text-sm font-medium text-secondary mb-2">About</h3>
          <p className="text-on-surface whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-secondary mb-2">Details</h3>
        <div className="space-y-2">
          {profile.location && (
            <div className="flex items-center gap-2 text-on-surface text-sm">
              <MapPin size={14} className="text-secondary" />
              <span>{profile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-secondary text-sm">
            <Calendar size={14} />
            <span>
              Joined{' '}
              {new Date(profile.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <SocialLinks profile={profile} />
    </div>
  );
}

function SocialLinks({
  profile,
}: {
  profile: {
    websiteUrl: string | null;
    instagramHandle: string | null;
    youtubeHandle: string | null;
    tiktokHandle: string | null;
    publicEmail: string | null;
  };
}) {
  const links = [
    profile.instagramHandle && {
      href: `https://instagram.com/${profile.instagramHandle}`,
      label: 'Instagram',
    },
    profile.youtubeHandle && {
      href: `https://youtube.com/@${profile.youtubeHandle}`,
      label: 'YouTube',
    },
    profile.tiktokHandle && {
      href: `https://tiktok.com/@${profile.tiktokHandle}`,
      label: 'TikTok',
    },
    profile.publicEmail && {
      href: `mailto:${profile.publicEmail}`,
      label: 'Email',
    },
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-3 mt-3">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-secondary hover:text-primary transition-colors"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
