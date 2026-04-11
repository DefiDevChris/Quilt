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

type ProfileTab = 'projects' | 'about';

export function UserProfilePage({ username }: UserProfilePageProps) {
  const { profile, posts, pagination, isLoading, error, fetchProfile, loadMore } =
    useProfileStore();
  const currentUser = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<ProfileTab>('projects');

  useEffect(() => {
    fetchProfile(username);
    return () => {
      useProfileStore.getState().reset();
    };
  }, [username, fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-lg bg-[#ffc8a6] animate-pulse" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-20">
        <p className="text-[#4a4a4a]">{error ?? 'Profile not found.'}</p>
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
      {/* Profile Header */}
      <header className="flex flex-col md:flex-row items-center md:items-start gap-12">
        <div className="relative group shrink-0">
          {profile.avatarUrl ? (
            <div className="relative w-48 h-48 rounded-full overflow-hidden ring-2 ring-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-full bg-[#fdfaf7] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] flex items-center justify-center text-[#4a4a4a]">
              <span className="text-6xl opacity-40">
                {getInitials(profile.displayName)}
              </span>
            </div>
          )}
          {isOwner && (
            <Link
              href="/settings"
              className="absolute -bottom-2 -right-2 p-3 bg-[#ffffff] rounded-full shadow-[0_1px_2px_rgba(45,42,38,0.08)] border border-[#d4d4d4] text-[#ff8d49] hover:text-[#e67d3f] transition-colors duration-150 z-20"
              title="Edit Profile"
            >
              <Pencil size={18} strokeWidth={2.5} />
            </Link>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-6">
          <div>
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 mb-4">
              <h1 className="text-[32px] leading-[40px] text-[#1a1a1a]">
                {profile.displayName}
              </h1>
              {!isOwner && (
                <FollowButton username={username} initialFollowing={profile.isFollowedByCurrentUser} />
              )}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3">
              <p className="px-3 py-1 bg-[#fdfaf7] text-[#4a4a4a] text-[16px] leading-[24px]">
                @{profile.username}
              </p>
              {profile.isPro && (
                <span className="px-2 py-0.5 border border-[#ff8d49]/30 text-[#ff8d49] text-[14px] leading-[20px]">
                  Pro Member
                </span>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {profile.bio && (
              <p className="text-[#1a1a1a] text-[18px] leading-[28px] max-w-2xl">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-3 text-[16px] leading-[24px] text-[#4a4a4a]">
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
                  className="flex items-center gap-2 text-[#ff8d49] hover:text-[#e67d3f] transition-colors duration-150"
                >
                  <Globe size={14} />
                  Website
                </a>
              )}
            </div>
          </div>

          <div className="pt-2">
            <SocialLinks profile={profile} />
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-8 py-8 border-y border-[#d4d4d4]">
        <div className="text-center md:text-left space-y-1">
          <p className="text-[14px] leading-[20px] text-[#4a4a4a]">Projects</p>
          <p className="text-[24px] leading-[32px] text-[#1a1a1a]">{pagination?.total ?? 0}</p>
        </div>
        <div className="text-center md:text-left space-y-1">
          <p className="text-[14px] leading-[20px] text-[#4a4a4a]">Followers</p>
          <p className="text-[24px] leading-[32px] text-[#1a1a1a]">{profile.followerCount}</p>
        </div>
        <div className="text-center md:text-left space-y-1">
          <p className="text-[14px] leading-[20px] text-[#4a4a4a]">Following</p>
          <p className="text-[24px] leading-[32px] text-[#1a1a1a]">{profile.followingCount}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-8 border-b border-[#d4d4d4]">
        <button
          onClick={() => setActiveTab('projects')}
          className={`relative pb-4 text-[16px] leading-[24px] transition-colors duration-150 ${activeTab === 'projects' ? 'text-[#1a1a1a] border-b-2 border-[#ff8d49]' : 'text-[#4a4a4a] hover:text-[#1a1a1a]'
            }`}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`relative pb-4 text-[16px] leading-[24px] transition-colors duration-150 ${activeTab === 'about' ? 'text-[#1a1a1a] border-b-2 border-[#ff8d49]' : 'text-[#4a4a4a] hover:text-[#1a1a1a]'
            }`}
        >
          About
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {activeTab === 'projects' && (
          <>
            {posts.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-[#d4d4d4] space-y-6">
                <p className="text-[16px] leading-[24px] text-[#4a4a4a]">
                  {isOwner
                    ? "You haven't shared any projects yet."
                    : "No public projects found."}
                </p>
                {isOwner && (
                  <Link
                    href="/dashboard"
                    className="inline-flex h-12 items-center px-8 bg-[#ff8d49] text-[#1a1a1a] text-[16px] leading-[24px] hover:bg-[#e67d3f] transition-colors duration-150 rounded-full shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
                  >
                    Start Your First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {posts.map((post) => (
                  <ProjectCard
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
                      className="px-8 py-3 border border-[#d4d4d4] text-[16px] leading-[24px] text-[#1a1a1a] hover:bg-[#ff8d49]/10 transition-colors duration-150 rounded-full disabled:opacity-50"
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
      className={`inline-flex items-center gap-2 px-4 py-2 text-[16px] leading-[24px] transition-colors duration-150 rounded-full ${following
        ? 'bg-[#fdfaf7] border border-[#d4d4d4] text-[#4a4a4a] hover:bg-[#ff8d49]/10 hover:text-[#ff8d49] hover:border-[#ff8d49]/30'
        : 'bg-[#ff8d49] text-[#1a1a1a] hover:bg-[#e67d3f] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}

interface ProjectCardProps {
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

function ProjectCard({ post }: ProjectCardProps) {
  return (
    <article className="bg-[#ffffff] border border-[#d4d4d4] overflow-hidden rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
      <Link href={`/socialthreads/${post.id}`} className="block">
        {post.thumbnailUrl ? (
          <div className="relative w-full aspect-[4/3] bg-[#fdfaf7] overflow-hidden rounded-t-lg">
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
          <div className="w-full aspect-[4/3] bg-[#fdfaf7] flex items-center justify-center">
            <span className="text-[24px] leading-[32px] text-[#4a4a4a] opacity-40">STUDIO</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={`/socialthreads/${post.id}`}>
          <h3 className="text-[16px] leading-[24px] text-[#1a1a1a] line-clamp-1 mb-1 hover:text-[#ff8d49] transition-colors duration-150">
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
            className="flex items-center gap-1 text-[14px] leading-[20px] text-[#4a4a4a] hover:text-[#1a1a1a] transition-colors duration-150"
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
          <span className="text-[14px] leading-[20px] text-[#4a4a4a] ml-auto">
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
          <h3 className="text-[18px] leading-[28px] text-[#1a1a1a]">About</h3>
          <p className="text-[18px] leading-[28px] text-[#4a4a4a]">{profile.bio}</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-[18px] leading-[28px] text-[#1a1a1a]">Details</h3>
        <div className="space-y-3">
          {profile.location && (
            <div className="flex items-center gap-3 text-[#1a1a1a] text-[16px] leading-[24px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff8d49]/50" />
              <span>{profile.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-[#4a4a4a] text-[16px] leading-[24px]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffc8a6]/50" />
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

      <div className="space-y-4">
        <h3 className="text-[18px] leading-[28px] text-[#1a1a1a]">Connections</h3>
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
          className="text-[14px] leading-[20px] text-[#1a1a1a] border border-[#d4d4d4] px-4 py-2 rounded-full hover:bg-[#ff8d49] hover:text-[#ffffff] transition-colors duration-150"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
