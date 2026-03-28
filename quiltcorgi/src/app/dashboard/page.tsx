'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { formatRelativeTime } from '@/lib/format-time';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  unitSystem: string;
  isPublic: boolean;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
}

type LoadState = 'loading' | 'error' | 'success';

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons (48px)                                           */
/* ------------------------------------------------------------------ */

function QuiltGridIcon() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="4" y="4" width="32" height="32" rx="4" fill="#ffca9d" />
      <rect x="44" y="4" width="32" height="32" rx="4" fill="#8d4f00" opacity="0.7" />
      <rect x="4" y="44" width="32" height="32" rx="4" fill="#8d4f00" opacity="0.5" />
      <rect x="44" y="44" width="32" height="32" rx="4" fill="#ffca9d" opacity="0.8" />
      <path
        d="M20 20l12-12M20 20l-12 12M60 20l12-12M60 20l-12 12"
        stroke="#8d4f00"
        strokeWidth="2"
        opacity="0.3"
      />
      <circle cx="40" cy="40" r="6" fill="#8d4f00" opacity="0.15" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-secondary"
    >
      <path
        d="M6 12v24a3 3 0 003 3h30a3 3 0 003-3V18a3 3 0 00-3-3H24l-4-4H9a3 3 0 00-3 3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-secondary"
    >
      <circle cx="18" cy="16" r="5" />
      <path d="M6 36c0-5.523 5.373-10 12-10s12 4.477 12 10" strokeLinecap="round" />
      <circle cx="34" cy="18" r="4" />
      <path d="M42 36c0-4.418-3.582-8-8-8-1.5 0-2.9.4-4.1 1.1" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-secondary"
    >
      <path d="M8 8h12a4 4 0 014 4v28c0-2.21-1.79-4-4-4H8V8z" strokeLinejoin="round" />
      <path d="M40 8H28a4 4 0 00-4 4v28c0-2.21 1.79-4 4-4h12V8z" strokeLinejoin="round" />
    </svg>
  );
}

function CorgiIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
      <ellipse cx="60" cy="70" rx="35" ry="22" fill="#ffca9d" />
      <ellipse cx="60" cy="55" rx="22" ry="20" fill="#ffca9d" />
      <ellipse cx="44" cy="50" rx="5" ry="5.5" fill="#8d4f00" />
      <ellipse cx="76" cy="50" rx="5" ry="5.5" fill="#8d4f00" />
      <ellipse cx="44" cy="49" rx="2" ry="2.5" fill="#fff6f1" />
      <ellipse cx="76" cy="49" rx="2" ry="2.5" fill="#fff6f1" />
      <ellipse cx="60" cy="58" rx="4" ry="2.5" fill="#8d4f00" />
      <circle cx="60" cy="60" r="1.5" fill="#383831" />
      <path
        d="M30 55 L40 30 L52 48"
        fill="#ffca9d"
        stroke="#8d4f00"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M90 55 L80 30 L68 48"
        fill="#ffca9d"
        stroke="#8d4f00"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse cx="38" cy="85" rx="6" ry="8" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1" />
      <ellipse cx="52" cy="88" rx="6" ry="8" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1" />
      <ellipse cx="68" cy="88" rx="6" ry="8" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1" />
      <ellipse cx="82" cy="85" rx="6" ry="8" fill="#ffca9d" stroke="#8d4f00" strokeWidth="1" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Bento Card Wrapper                                                */
/* ------------------------------------------------------------------ */

function BentoCard({
  children,
  className = '',
  href,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}) {
  const baseClasses =
    'bg-surface-container rounded-xl p-[2.1rem] transition-all duration-200 hover:bg-surface-container-high hover:shadow-elevation-1 cursor-pointer';

  if (href) {
    return (
      <Link href={href} className={`${baseClasses} ${className} block`}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${className} text-left w-full`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                    */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch('/api/projects?sort=updatedAt&order=desc&limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProjects(data.data.projects);
      setLoadState('success');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleRename(id: string, newName: string) {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    if (res.ok) {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: newName } : p)));
    }
  }

  const hasProjects = loadState === 'success' && projects.length > 0;
  const recentProjects = projects.slice(0, 4);

  return (
    <div className="p-[2.75rem]">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-[2.1rem]" style={{ gridTemplateRows: 'auto auto' }}>
        {/* New Quilt — col-span-6, row-span-2 */}
        <BentoCard
          className="col-span-12 md:col-span-6 md:row-span-2 relative overflow-hidden min-h-[240px]"
          onClick={() => setDialogOpen(true)}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary-container/20 to-transparent rounded-bl-full pointer-events-none" />
          <div className="relative z-10">
            <QuiltGridIcon />
            <h2 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface mt-4">
              New Quilt
            </h2>
            <p className="text-[length:var(--font-size-body-md)] text-secondary mt-1">
              Start a new design from scratch
            </p>
          </div>
        </BentoCard>

        {/* My Quilts — col-span-3 */}
        <BentoCard className="col-span-6 md:col-span-3" href="/dashboard">
          <FolderIcon />
          <h3 className="text-[length:var(--font-size-headline-sm)] font-semibold text-on-surface mt-3">
            My Quilts
          </h3>
          {hasProjects ? (
            <div className="mt-2">
              <p className="text-[length:var(--font-size-body-sm)] text-secondary">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
              <div className="flex -space-x-2 mt-2">
                {recentProjects.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-surface-container flex items-center justify-center overflow-hidden"
                  >
                    {p.thumbnailUrl ? (
                      <Image
                        src={p.thumbnailUrl}
                        alt={p.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[length:var(--font-size-label-sm)] text-secondary font-medium">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <CorgiIllustrationSmall />
              <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
                No quilts yet
              </p>
            </div>
          )}
        </BentoCard>

        {/* Community — col-span-3 */}
        <BentoCard className="col-span-6 md:col-span-3" href="/community">
          <PeopleIcon />
          <h3 className="text-[length:var(--font-size-headline-sm)] font-semibold text-on-surface mt-3">
            Community
          </h3>
          <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
            Browse shared designs
          </p>
        </BentoCard>

        {/* Blog — col-span-3 */}
        <BentoCard className="col-span-6 md:col-span-3" href="/blog">
          <BookIcon />
          <h3 className="text-[length:var(--font-size-headline-sm)] font-semibold text-on-surface mt-3">
            Blog
          </h3>
          <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
            Tips & tutorials
          </p>
        </BentoCard>
      </div>

      {/* Recent Projects / Welcome Section */}
      <div className="mt-[2.75rem]">
        {loadState === 'loading' && (
          <div>
            <div className="h-6 bg-surface-container rounded w-48 animate-pulse mb-6" />
            <div className="flex gap-[2.1rem] overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[calc(25%-1.575rem)] min-w-[220px] bg-surface-container rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="aspect-video bg-surface-container-high" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    <div className="h-3 bg-surface-container-high rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadState === 'error' && (
          <div className="text-center py-12">
            <p className="text-[length:var(--font-size-body-md)] text-secondary mb-4">
              Failed to load projects. Please try again.
            </p>
            <button
              type="button"
              onClick={fetchProjects}
              className="rounded-md bg-primary px-4 py-2 text-[length:var(--font-size-body-md)] font-medium text-primary-on hover:opacity-90 transition-opacity"
            >
              Retry
            </button>
          </div>
        )}

        {loadState === 'success' && projects.length === 0 && (
          <div className="text-center py-12">
            <CorgiIllustration />
            <h2 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface mt-6">
              Welcome to QuiltCorgi
            </h2>
            <p className="text-[length:var(--font-size-body-lg)] text-secondary mt-2 max-w-md mx-auto">
              Start by creating your first quilt or browse the community for inspiration.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="rounded-md bg-primary px-5 py-2.5 text-[length:var(--font-size-body-md)] font-medium text-primary-on hover:opacity-90 transition-opacity"
              >
                Create My First Quilt
              </button>
              <Link
                href="/community"
                className="rounded-md border border-outline-variant/30 bg-surface-container px-5 py-2.5 text-[length:var(--font-size-body-md)] font-medium text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Browse Community
              </Link>
            </div>
          </div>
        )}

        {loadState === 'success' && projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface">
                Recent Projects
              </h2>
              <Link
                href="/dashboard"
                className="text-[length:var(--font-size-body-md)] font-medium text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="flex gap-[2.1rem] overflow-x-auto pb-2 scrollbar-thin">
              {recentProjects.map((project) => (
                <RecentProjectCard
                  key={project.id}
                  project={project}
                  onDelete={handleDelete}
                  onRename={handleRename}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent Project Card                                               */
/* ------------------------------------------------------------------ */

function RecentProjectCard({
  project,
  onDelete: _onDelete,
  onRename: _onRename,
}: {
  project: ProjectListItem;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}) {
  return (
    <Link
      href={`/studio/${project.id}`}
      className="flex-shrink-0 w-[calc(25%-1.575rem)] min-w-[220px] bg-surface-container rounded-lg overflow-hidden hover:bg-surface-container-high hover:shadow-elevation-1 transition-all duration-200 group"
    >
      <div className="aspect-video bg-surface-container-high relative overflow-hidden">
        {project.thumbnailUrl ? (
          <Image src={project.thumbnailUrl} alt={project.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="text-outline-variant"
            >
              <rect
                x="4"
                y="4"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="22"
                y="4"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="4"
                y="22"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <rect
                x="22"
                y="22"
                width="14"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[length:var(--font-size-body-md)] font-medium text-on-surface truncate">
          {project.name}
        </p>
        <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-0.5">
          Last edited {formatRelativeTime(project.updatedAt)}
        </p>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Small Corgi for empty My Quilts card                              */
/* ------------------------------------------------------------------ */

function CorgiIllustrationSmall() {
  return (
    <svg width="48" height="40" viewBox="0 0 120 100" fill="none" className="opacity-40">
      <ellipse cx="60" cy="70" rx="35" ry="22" fill="#ffca9d" />
      <ellipse cx="60" cy="55" rx="22" ry="20" fill="#ffca9d" />
      <ellipse cx="44" cy="50" rx="5" ry="5.5" fill="#8d4f00" />
      <ellipse cx="76" cy="50" rx="5" ry="5.5" fill="#8d4f00" />
      <ellipse cx="60" cy="58" rx="4" ry="2.5" fill="#8d4f00" />
      <path
        d="M30 55 L40 30 L52 48"
        fill="#ffca9d"
        stroke="#8d4f00"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M90 55 L80 30 L68 48"
        fill="#ffca9d"
        stroke="#8d4f00"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
