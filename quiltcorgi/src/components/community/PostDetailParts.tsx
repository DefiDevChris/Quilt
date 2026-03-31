'use client';

import Link from 'next/link';
import Image from 'next/image';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/* ── Author Section ── */

interface AuthorSectionProps {
  creatorName: string;
  creatorUsername: string | null;
  creatorAvatarUrl: string | null;
  isPro: boolean;
}

export function AuthorSection({
  creatorName,
  creatorUsername,
  creatorAvatarUrl,
  isPro,
}: AuthorSectionProps) {
  const profileHref = creatorUsername ? `/members/${encodeURIComponent(creatorUsername)}` : '#';

  return (
    <div className="flex items-center gap-3">
      <Link href={profileHref} className="shrink-0">
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
            <span className="text-sm font-medium text-primary-on-container">
              {getInitials(creatorName)}
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <Link href={profileHref} className="font-medium text-on-surface hover:underline truncate">
            {creatorName}
          </Link>
          {isPro && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold shrink-0">
              PRO
            </span>
          )}
        </div>
        {creatorUsername && <span className="text-xs text-secondary">@{creatorUsername}</span>}
      </div>
    </div>
  );
}

/* ── Linked Project Card ── */

interface LinkedProjectCardProps {
  projectId: string;
  projectName: string | null;
  projectThumbnailUrl: string | null;
}

export function LinkedProjectCard({
  projectId,
  projectName,
  projectThumbnailUrl,
}: LinkedProjectCardProps) {
  return (
    <Link
      href={`/studio/${projectId}`}
      className="flex items-center gap-4 p-4 rounded-lg border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container transition-colors"
    >
      {projectThumbnailUrl ? (
        <Image
          src={projectThumbnailUrl}
          alt={projectName ?? 'Project'}
          width={64}
          height={64}
          className="w-16 h-16 rounded-md object-cover shrink-0"
          unoptimized
        />
      ) : (
        <div className="w-16 h-16 rounded-md bg-primary-container flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-primary/40"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        </div>
      )}
      <div className="min-w-0">
        <p className="font-medium text-on-surface truncate">{projectName ?? 'Untitled Project'}</p>
        <p className="text-xs text-primary font-medium mt-0.5">Open in Studio &rarr;</p>
      </div>
    </Link>
  );
}

/* ── Share Button ── */

interface ShareButtonProps {
  onShare: () => void;
  copied: boolean;
}

export function ShareButton({ onShare, copied }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={onShare}
      className="inline-flex items-center gap-1.5 text-secondary hover:text-on-surface transition-colors"
      title="Copy link"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
        />
      </svg>
      <span className="text-sm">{copied ? 'Copied!' : 'Share'}</span>
    </button>
  );
}

/* ── Post Detail Skeleton ── */

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      <div className="h-4 w-32 bg-surface-container-high rounded mb-6" />
      <div className="aspect-[2/1] bg-surface-container-high rounded-lg mb-6" />
      <div className="h-7 w-72 bg-surface-container-high rounded mb-2" />
      <div className="h-4 w-24 bg-surface-container-high rounded mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-surface-container-high" />
        <div className="space-y-2">
          <div className="h-4 w-32 bg-surface-container-high rounded" />
          <div className="h-3 w-20 bg-surface-container-high rounded" />
        </div>
      </div>
      <div className="h-20 bg-surface-container-high rounded" />
    </div>
  );
}
