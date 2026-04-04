'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { LikeButton } from '@/components/community/LikeButton';
import { FollowButton } from '@/components/community/FollowButton';
import { FollowListModal } from '@/components/community/FollowListModal';
import { formatRelativeTime } from '@/lib/format-time';

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

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433a19.695 19.695 0 002.683-2.006c1.9-1.7 3.945-4.29 3.945-7.344 0-3.866-3.134-7-7-7S4 5.134 4 9c0 3.053 2.045 5.644 3.945 7.344a19.695 19.695 0 002.683 2.006 10.18 10.18 0 00.757.433l.281.14.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0zM10 3.5a6.5 6.5 0 00-5.58 3.18A22.2 22.2 0 0010 5.5c2.05 0 3.96.42 5.58 1.18A6.5 6.5 0 0010 3.5zM3.5 10c0 .93.2 1.82.55 2.62A22.2 22.2 0 0110 11.5c2.33 0 4.48.43 6.05 1.12.35-.8.55-1.69.55-2.62"
        clipRule="evenodd"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.08 4.08 0 011.47.958c.453.453.77.882.957 1.47.163.46.35 1.26.404 2.43.058 1.265.069 1.645.069 4.849s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.08 4.08 0 01-.957 1.47 4.08 4.08 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.265.058-1.645.069-4.849.069s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.08 4.08 0 01-1.47-.957 4.08 4.08 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.08 4.08 0 01.957-1.47A4.08 4.08 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.759 1.83 9.139 1.82 12 1.82zm0-1.82C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.88 5.88 0 001.384 2.126A5.88 5.88 0 004.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.297-.763.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.16V11.7a4.79 4.79 0 01-3.58-1.43V6.69h3.58z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

type ProfileTab = 'posts' | 'about';

export function UserProfilePage({ username }: UserProfilePageProps) {
  const { profile, posts, pagination, isLoading, error, fetchProfile, loadMore } =
    useProfileStore();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');
  const [followListTab, setFollowListTab] = useState<'followers' | 'following'>('followers');
  const [showFollowList, setShowFollowList] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchProfile(username);
    return () => {
      useProfileStore.getState().reset();
    };
  }, [username, fetchProfile]);

  // Sync follow counts from profile data
  useEffect(() => {
    if (profile) {
      const p = profile as unknown as Record<string, unknown>;
      setFollowerCount(typeof p.followerCount === 'number' ? p.followerCount : 0);
      setFollowingCount(typeof p.followingCount === 'number' ? p.followingCount : 0);
    }
  }, [profile]);

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
        <p className="text-secondary text-body-lg">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const isOwner = currentUser?.id === profile.userId;
  const hasMore = pagination ? pagination.page < pagination.totalPages : false;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-surface-container rounded-xl p-6 shadow-elevation-1 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName}
              width={120}
              height={120}
              className="w-[120px] h-[120px] rounded-full object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-[120px] h-[120px] rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="text-display-md font-bold text-primary-on-container">
                {getInitials(profile.displayName)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-on-surface">{profile.displayName}</h1>
              {profile.isPro && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-label-sm font-semibold">
                  PRO
                </span>
              )}
            </div>

            <p className="text-body-md text-secondary mb-2">@{profile.username}</p>

            {/* Follow counts */}
            <div className="flex items-center gap-4 mb-3">
              <button
                type="button"
                onClick={() => {
                  setFollowListTab('followers');
                  setShowFollowList(true);
                }}
                className="text-sm hover:underline"
              >
                <span className="font-semibold text-on-surface">{followerCount}</span>{' '}
                <span className="text-secondary">followers</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFollowListTab('following');
                  setShowFollowList(true);
                }}
                className="text-sm hover:underline"
              >
                <span className="font-semibold text-on-surface">{followingCount}</span>{' '}
                <span className="text-secondary">following</span>
              </button>
            </div>

            {profile.bio && <p className="text-body-md text-secondary mb-3">{profile.bio}</p>}

            {profile.location && (
              <div className="flex items-center gap-1.5 text-body-sm text-secondary mb-3">
                <MapPinIcon />
                <span>{profile.location}</span>
              </div>
            )}

            <SocialLinks profile={profile} />

            <div className="mt-4 flex items-center gap-3">
              {isOwner ? (
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-body-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit Profile
                </Link>
              ) : currentUser ? (
                <FollowButton
                  username={profile.username}
                  initialFollowing={
                    !!(profile as unknown as Record<string, unknown>).isFollowedByCurrentUser
                  }
                  onToggle={(isFollowing) => {
                    setFollowerCount((prev) => prev + (isFollowing ? 1 : -1));
                  }}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-outline-variant mb-6">
        <button
          onClick={() => setActiveTab('posts')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'posts' ? 'text-primary' : 'text-secondary hover:text-on-surface'
          }`}
        >
          Posts ({pagination?.total ?? 0})
          {activeTab === 'posts' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'about' ? 'text-primary' : 'text-secondary hover:text-on-surface'
          }`}
        >
          About
          {activeTab === 'about' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary text-body-lg">
                {isOwner
                  ? "You haven't shared any projects yet."
                  : `${profile.displayName} hasn't shared any projects yet.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  creatorName={profile.displayName}
                  creatorUsername={profile.username}
                  creatorAvatarUrl={profile.avatarUrl}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="rounded-lg border border-outline-variant px-6 py-2.5 text-body-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Follow list modal */}
      <FollowListModal
        username={profile.username}
        tab={followListTab}
        isOpen={showFollowList}
        onClose={() => setShowFollowList(false)}
      />
    </div>
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

function PostCard({ post, creatorName, creatorUsername, creatorAvatarUrl }: PostCardProps) {
  return (
    <article className="glass-panel rounded-xl overflow-hidden shadow-elevation-1 hover:shadow-elevation-2 transition-shadow">
      <Link href={`/socialthreads/${post.id}`} className="block">
        {post.thumbnailUrl ? (
          <div className="relative w-full aspect-[16/10] bg-surface-container-low">
            <Image
              src={post.thumbnailUrl}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full aspect-[16/10] bg-primary-container flex items-center justify-center">
            <span className="text-5xl text-primary/40">&#9632;</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {creatorAvatarUrl ? (
            <Image
              src={creatorAvatarUrl}
              alt={creatorName}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
              <span className="text-xs font-bold text-primary-on-container">
                {getInitials(creatorName)}
              </span>
            </div>
          )}
          <Link
            href={`/members/${creatorUsername}`}
            className="text-body-sm font-medium text-secondary hover:text-primary transition-colors"
          >
            {creatorName}
          </Link>
          <span className="text-body-sm text-secondary/60">·</span>
          <span className="text-body-sm text-secondary/60">
            {formatRelativeTime(post.createdAt)}
          </span>
        </div>

        <Link href={`/socialthreads/${post.id}`}>
          <h3 className="text-body-lg font-semibold text-on-surface line-clamp-2 mb-1 hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.description && (
          <p className="text-body-sm text-secondary line-clamp-2 mb-3">{post.description}</p>
        )}

        <div className="flex items-center gap-4">
          <LikeButton
            postId={post.id}
            likeCount={post.likeCount}
            isLikedByUser={post.isLikedByUser}
            size="sm"
          />

          <Link
            href={`/socialthreads/${post.id}`}
            className="flex items-center gap-1 text-body-sm text-secondary hover:text-on-surface transition-colors"
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
          <h3 className="text-body-sm font-medium text-secondary mb-2">About</h3>
          <p className="text-body-md text-on-surface whitespace-pre-wrap">{profile.bio}</p>
        </div>
      )}

      <div>
        <h3 className="text-body-sm font-medium text-secondary mb-2">Details</h3>
        <div className="space-y-2 text-body-md">
          {profile.location && (
            <div className="flex items-center gap-2 text-on-surface">
              <MapPinIcon />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.isPro && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-label-sm font-semibold">
                PRO Member
              </span>
            </div>
          )}
          <div className="text-secondary text-body-sm">
            Joined{' '}
            {new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
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
    profile.websiteUrl && { href: profile.websiteUrl, icon: <GlobeIcon />, label: 'Website' },
    profile.instagramHandle && {
      href: `https://instagram.com/${profile.instagramHandle}`,
      icon: <InstagramIcon />,
      label: 'Instagram',
    },
    profile.youtubeHandle && {
      href: `https://youtube.com/@${profile.youtubeHandle}`,
      icon: <YouTubeIcon />,
      label: 'YouTube',
    },
    profile.tiktokHandle && {
      href: `https://tiktok.com/@${profile.tiktokHandle}`,
      icon: <TikTokIcon />,
      label: 'TikTok',
    },
    profile.publicEmail && {
      href: `mailto:${profile.publicEmail}`,
      icon: <EmailIcon />,
      label: 'Email',
    },
  ].filter(Boolean) as Array<{ href: string; icon: React.ReactNode; label: string }>;

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-primary-container/30 transition-colors"
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}
