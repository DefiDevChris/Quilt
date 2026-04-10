'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { motion } from 'framer-motion';
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
        <div className="w-8 h-8 border-2 border-on-surface border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">{error ?? 'Profile not found.'}</p>
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
    <div className="max-w-5xl mx-auto space-y-16 py-8">
      {/* Editorial Profile Header */}
      <header className="relative flex flex-col md:flex-row items-center md:items-start gap-12">
        <div className="relative group shrink-0">
          {profile.avatarUrl ? (
            <div className="relative w-48 h-48 rounded-full overflow-hidden ring-1 ring-outline-variant/30 shadow-elevation-1 transition-all group-hover:shadow-elevation-3 group-hover:-translate-y-1 duration-500">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-full bg-neutral-container-high border border-neutral-200/30 shadow-elevation-1 flex items-center justify-center text-neutral-800 ring-1 ring-outline-variant/10 group-hover:shadow-elevation-2 transition-all duration-500">
              <span className="text-6xl font-black uppercase tracking-tighter opacity-20">
                {getInitials(profile.displayName)}
              </span>
            </div>
          )}
          {isOwner && (
            <Link
              href="/settings"
              className="absolute -bottom-2 -right-2 p-3 bg-neutral rounded-full shadow-elevation-1 border border-neutral-200/50 text-primary hover:text-neutral-800 transition-all hover:scale-110 z-20 group/edit"
              title="Edit Profile"
            >
              <Pencil size={18} strokeWidth={2.5} className="group-hover/edit:rotate-12 transition-transform" />
            </Link>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 mb-4">
              <h1 className="text-4xl font-bold text-neutral-900 tracking-tight leading-tight">
                {profile.displayName}
              </h1>
              {!isOwner && (
                <FollowButton username={username} initialFollowing={profile.isFollowedByCurrentUser} />
              )}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <p className="px-3 py-1 bg-neutral-100 text-neutral-700 text-sm font-medium">
                @{profile.username}
              </p>
              {profile.isPro && (
                <span className="px-2 py-0.5 border border-primary/30 text-primary text-xs font-medium">
                  Pro Member
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {profile.bio && (
              <p className="text-neutral-700 text-base leading-relaxed max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-3 text-sm text-neutral-600">
              {profile.location && (
                <span className="flex items-center gap-2">
                  <MapPin size={14} />
                  {profile.location}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Calendar size={14} />
                Joined {joinDate}
              </span>
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:opacity-80 transition-colors"
                >
                  <Globe size={14} />
                  Website
                </a>
              )}
            </div>
          </motion.div>

          {/* Social Links Bar */}
          <div className="pt-2">
            <SocialLinks profile={profile} />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-8 py-8 border-y border-neutral-200">
        <div className="text-center md:text-left space-y-1">
          <p className="text-xs font-medium text-neutral-500">Projects</p>
          <p className="text-3xl font-bold text-neutral-900">{pagination?.total ?? 0}</p>
        </div>
        <div className="text-center md:text-left space-y-1">
          <p className="text-xs font-medium text-neutral-500">Followers</p>
          <p className="text-3xl font-bold text-neutral-900">{profile.followerCount}</p>
        </div>
        <div className="text-center md:text-left space-y-1">
          <p className="text-xs font-medium text-neutral-500">Following</p>
          <p className="text-3xl font-bold text-neutral-900">{profile.followingCount}</p>
        </div>
      </div>

      {/* Content Navigation */}
      <div className="flex items-center gap-8 border-b border-neutral-200">
        <button
          onClick={() => setActiveTab('posts')}
          className={`relative pb-4 text-sm font-medium transition-all ${activeTab === 'posts' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
        >
          Projects
          {activeTab === 'posts' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`relative pb-4 text-sm font-medium transition-all ${activeTab === 'about' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
            }`}
        >
          About
          {activeTab === 'about' && (
            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'posts' && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-neutral-200 space-y-6">
                <p className="text-sm text-neutral-500">
                  {isOwner
                    ? "You haven't shared any projects yet."
                    : "No public projects found."}
                </p>
                {isOwner && (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center px-8 bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    Start Your First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
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
                  <div className="col-span-full flex justify-center pt-8">
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="px-8 py-3 border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
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
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${following
        ? 'bg-neutral-100 border border-neutral-300 text-neutral-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
        : 'bg-primary text-white hover:opacity-90'
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
    <article className="bg-neutral border border-neutral-200 overflow-hidden hover:shadow-elevation-3 transition-all group">
      <Link href={`/socialthreads/${post.id}`} className="block">
        {post.thumbnailUrl ? (
          <div className="relative w-full aspect-[4/3] bg-neutral-100 overflow-hidden">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-neutral-100 flex items-center justify-center">
            <span className="text-2xl text-neutral-300 font-medium">STUDIO</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`/socialthreads/${post.id}`}>
          <h3 className="text-sm font-semibold text-neutral-900 line-clamp-1 mb-1 hover:text-primary transition-colors">
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
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
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
          <span className="text-xs text-neutral-500 ml-auto">
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
    <div className="space-y-12 max-w-2xl">
      {profile.bio && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 opacity-50">Studio Philosophy</h3>
          <p className="text-lg text-neutral-800/80 leading-relaxed font-medium">{profile.bio}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 opacity-50">Operational Details</h3>
        <div className="space-y-3">
          {profile.location && (
            <div className="flex items-center gap-3 text-neutral-800 text-[11px] font-black uppercase tracking-widest">
              <div className="w-1 h-1 rounded-full bg-primary/30" />
              <span>{profile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-neutral-500 text-[11px] font-black uppercase tracking-widest">
            <div className="w-1 h-1 rounded-full bg-secondary/30" />
            <span>
              Commissioned{' '}
              {new Date(profile.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 opacity-50">Communication</h3>
        <SocialLinks profile={profile} />
      </div>
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
          className="text-[11px] font-black uppercase tracking-widest text-neutral-800 border border-neutral-200/30 px-4 py-2 hover:bg-primary hover:text-white transition-all"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
