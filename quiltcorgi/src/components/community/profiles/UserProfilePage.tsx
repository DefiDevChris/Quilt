'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useProfileStore } from '@/stores/profileStore';
import { useAuthStore } from '@/stores/authStore';
import { FollowButton } from '@/components/community/profiles/FollowButton';

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433a19.695 19.695 0 002.683-2.006c1.9-1.7 3.945-4.29 3.945-7.344 0-3.866-3.134-7-7-7S4 5.134 4 9c0 3.053 2.045 5.644 3.945 7.344a19.695 19.695 0 002.683 2.006 10.18 10.18 0 00.757.433l.281.14.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-1.5 0a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0zM10 3.5a6.5 6.5 0 00-5.58 3.18A22.2 22.2 0 0010 5.5c2.05 0 3.96.42 5.58 1.18A6.5 6.5 0 0010 3.5zM3.5 10c0 .93.2 1.82.55 2.62A22.2 22.2 0 0110 11.5c2.33 0 4.48.43 6.05 1.12.35-.8.55-1.69.55-2.62" clipRule="evenodd" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.08 4.08 0 011.47.958c.453.453.77.882.957 1.47.163.46.35 1.26.404 2.43.058 1.265.069 1.645.069 4.849s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.404 2.43a4.08 4.08 0 01-.957 1.47 4.08 4.08 0 01-1.47.957c-.46.163-1.26.35-2.43.404-1.265.058-1.645.069-4.849.069s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.404a4.08 4.08 0 01-1.47-.957 4.08 4.08 0 01-.957-1.47c-.163-.46-.35-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.404-2.43a4.08 4.08 0 01.957-1.47A4.08 4.08 0 015.064 2.293c.46-.163 1.26-.35 2.43-.404C8.759 1.83 9.139 1.82 12 1.82zm0-1.82C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.88 5.88 0 00-2.126 1.384A5.88 5.88 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.88 5.88 0 001.384 2.126A5.88 5.88 0 004.14 23.37c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.88 5.88 0 002.126-1.384 5.88 5.88 0 001.384-2.126c.297-.763.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.88 5.88 0 00-1.384-2.126A5.88 5.88 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.16V11.7a4.79 4.79 0 01-3.58-1.43V6.69h3.58z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

export function UserProfilePage({ username }: UserProfilePageProps) {
  const { profile, posts, isLoading, error, fetchProfile, toggleFollow } = useProfileStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchProfile(username);
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
        <p className="text-secondary text-body-lg">{error ?? 'Profile not found.'}</p>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.userId;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-surface-container rounded-xl p-6 shadow-elevation-1 mb-8">
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

            <p className="text-body-md text-secondary mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-body-md text-secondary mb-3">{profile.bio}</p>
            )}

            {profile.location && (
              <div className="flex items-center gap-1.5 text-body-sm text-secondary mb-3">
                <MapPinIcon />
                <span>{profile.location}</span>
              </div>
            )}

            <SocialLinks profile={profile} />

            <div className="flex items-center gap-6 mt-4">
              <div className="text-body-sm">
                <span className="font-semibold text-on-surface">{profile.followerCount}</span>
                <span className="text-secondary ml-1">followers</span>
              </div>
              <div className="text-body-sm">
                <span className="font-semibold text-on-surface">{profile.followingCount}</span>
                <span className="text-secondary ml-1">following</span>
              </div>
            </div>

            {user && (
              <div className="mt-4">
                <FollowButton
                  userId={profile.userId}
                  isFollowing={profile.isFollowedByUser}
                  isOwnProfile={isOwnProfile}
                  onToggle={() => toggleFollow(profile.userId)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <PostsGrid posts={posts} displayName={profile.displayName} />
    </div>
  );
}

function SocialLinks({ profile }: { profile: { websiteUrl: string | null; instagramHandle: string | null; youtubeHandle: string | null; tiktokHandle: string | null; publicEmail: string | null } }) {
  const links = [
    profile.websiteUrl && { href: profile.websiteUrl, icon: <GlobeIcon />, label: 'Website' },
    profile.instagramHandle && { href: `https://instagram.com/${profile.instagramHandle}`, icon: <InstagramIcon />, label: 'Instagram' },
    profile.youtubeHandle && { href: `https://youtube.com/@${profile.youtubeHandle}`, icon: <YouTubeIcon />, label: 'YouTube' },
    profile.tiktokHandle && { href: `https://tiktok.com/@${profile.tiktokHandle}`, icon: <TikTokIcon />, label: 'TikTok' },
    profile.publicEmail && { href: `mailto:${profile.publicEmail}`, icon: <EmailIcon />, label: 'Email' },
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

interface PostItem {
  id: string;
  title: string;
  thumbnailUrl: string;
}

function PostsGrid({ posts, displayName }: { posts: PostItem[]; displayName: string }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-body-lg">{displayName} hasn&apos;t shared any projects yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-headline-sm font-bold text-on-surface mb-4">Projects</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <a
            key={post.id}
            href={`/community/${post.id}`}
            className="block rounded-lg overflow-hidden bg-surface-container shadow-elevation-1 hover:shadow-elevation-2 transition-shadow"
          >
            {post.thumbnailUrl ? (
              <Image
                src={post.thumbnailUrl}
                alt={post.title}
                width={300}
                height={225}
                className="w-full aspect-[4/3] object-cover"
                unoptimized
              />
            ) : (
              <div className="w-full aspect-[4/3] bg-primary-container flex items-center justify-center">
                <span className="text-3xl text-primary/40">&#9632;</span>
              </div>
            )}
            <div className="p-2">
              <p className="text-body-sm font-medium text-on-surface line-clamp-2">{post.title}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
