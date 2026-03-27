'use client';

import Link from 'next/link';
import Image from 'next/image';

interface UserCardProps {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  isPro: boolean;
  showFollowButton?: boolean;
  userId?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function UserCard({ displayName, username, avatarUrl, isPro }: UserCardProps) {
  return (
    <Link
      href={`/members/${encodeURIComponent(username)}`}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-surface-container transition-colors"
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
          <span className="text-body-sm font-medium text-primary-on-container">
            {getInitials(displayName)}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium text-on-surface text-body-md truncate">
          {displayName}
        </span>
        {isPro && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-label-sm font-semibold shrink-0">
            PRO
          </span>
        )}
      </div>
    </Link>
  );
}
