'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { PhotoPatternModal } from '@/components/photo-pattern/PhotoPatternModal';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';

const PatternLibrary = dynamic(
  () => import('@/components/patterns/PatternLibrary').then((m) => m.PatternLibrary),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'patterns';

/* ------------------------------------------------------------------ */
/*  Custom Quilting Icons (SVG)                                       */
/* ------------------------------------------------------------------ */

function NewDesignIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <rect x="2" y="2" width="24" height="24" rx="4" fill="var(--color-primary)" />
      <rect
        x="30"
        y="2"
        width="24"
        height="24"
        rx="4"
        fill="var(--color-primary-dark)"
        opacity="0.55"
      />
      <rect
        x="2"
        y="30"
        width="24"
        height="24"
        rx="4"
        fill="var(--color-primary-dark)"
        opacity="0.35"
      />
      <rect
        x="30"
        y="30"
        width="24"
        height="24"
        rx="4"
        fill="var(--color-primary)"
        opacity="0.75"
      />
      <path
        d="M14 2L2 14M26 2L2 26M40 2L30 12M54 2L30 26"
        stroke="var(--color-on-surface)"
        strokeWidth="0.6"
        opacity="0.12"
      />
      <path
        d="M14 30L2 42M26 30L2 54M40 30L30 40M54 30L30 54"
        stroke="var(--color-on-surface)"
        strokeWidth="0.6"
        opacity="0.12"
      />
    </svg>
  );
}

function QuiltbookIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <path
        d="M5 6h12a3 3 0 013 3v24c0-2-1.5-3.5-3.5-3.5H5V6z"
        stroke="var(--color-on-surface)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M35 6H23a3 3 0 00-3 3v24c0-2 1.5-3.5 3.5-3.5H35V6z"
        stroke="var(--color-on-surface)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="8" y="11" width="5" height="5" rx="0.5" fill="var(--color-primary)" opacity="0.6" />
      <rect
        x="8"
        y="18"
        width="5"
        height="5"
        rx="0.5"
        fill="var(--color-primary-dark)"
        opacity="0.35"
      />
      <rect
        x="27"
        y="11"
        width="5"
        height="5"
        rx="0.5"
        fill="var(--color-primary-dark)"
        opacity="0.35"
      />
      <rect x="27" y="18" width="5" height="5" rx="0.5" fill="var(--color-primary)" opacity="0.6" />
    </svg>
  );
}

function TutorialsIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <line
        x1="8"
        y1="32"
        x2="28"
        y2="8"
        stroke="var(--color-secondary)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <ellipse
        cx="30"
        cy="6"
        rx="2.5"
        ry="4"
        fill="none"
        stroke="var(--color-secondary)"
        strokeWidth="1.4"
        transform="rotate(-25 30 6)"
      />
      <path
        d="M8 32c4-2 6 2 10 0s6-4 10-2"
        stroke="var(--color-primary)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle
        cx="14"
        cy="14"
        r="5"
        fill="none"
        stroke="var(--color-on-surface)"
        strokeWidth="1.4"
      />
      <circle cx="26" cy="14" r="5" fill="none" stroke="var(--color-primary)" strokeWidth="1.4" />
      <path
        d="M6 34c0-5.5 4-10 9-10"
        stroke="var(--color-on-surface)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 34c0-5.5-4-10-9-10"
        stroke="var(--color-primary)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M15 24c2.5-1 7.5-1 10 0"
        stroke="var(--color-primary-dark)"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="6" fill="none" stroke="var(--color-secondary)" strokeWidth="1.3" />
      <circle cx="16" cy="16" r="2.5" fill="var(--color-secondary)" opacity="0.3" />
      <path
        d="M16 4v4M16 24v4M4 16h4M24 16h4"
        stroke="var(--color-secondary)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Greeting                                                          */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ------------------------------------------------------------------ */
/*  Dashboard Page                                                    */
/* ------------------------------------------------------------------ */

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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-quilts');

  const openPhotoPattern = usePhotoPatternStore((s) => s.openModal);
  const photoPatternStep = usePhotoPatternStore((s) => s.step);
  const isPhotoPatternOpen = usePhotoPatternStore((s) => s.isModalOpen);

  useEffect(() => {
    if (photoPatternStep !== 'complete' || !isPhotoPatternOpen) return;

    async function createProjectAndNavigate() {
      try {
        const date = new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        const { targetWidth, targetHeight } = usePhotoPatternStore.getState();
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Photo Import — ${date}`,
            canvasWidth: targetWidth,
            canvasHeight: targetHeight,
          }),
        });
        if (!res.ok) throw new Error('Failed to create project');
        const data = await res.json();
        window.location.href = `/studio/${data.data.id}`;
      } catch {
        usePhotoPatternStore.getState().setStep('dimensions');
      }
    }

    createProjectAndNavigate();
  }, [photoPatternStep, isPhotoPatternOpen]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?sort=updatedAt&order=desc&limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.data.projects);
      setProjectCount(data.data.projects.length);
    } catch {
      /* silently fail — cards still render */
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      fetchProjects();
    }
  }, [isLoadingAuth, user, fetchProjects]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  return (
    <div className="p-5 md:p-[2.75rem] max-w-[1200px] mx-auto">
      {/* Greeting */}
      <p className="text-[length:var(--font-size-body-md)] text-secondary mb-0.5 tracking-wide">
        {greeting}
      </p>
      <h1 className="text-[length:var(--font-size-headline-lg)] font-bold text-on-surface tracking-tight mb-6">
        Hello, {displayName}
      </h1>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg bg-surface-container-low w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('my-quilts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my-quilts'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          My Quilts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'patterns'
              ? 'bg-surface text-on-surface shadow-sm'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          Pattern Library
        </button>
      </div>

      {activeTab === 'patterns' ? (
        <PatternLibrary />
      ) : (
        <>
          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-12 gap-3.5">
            {/* New Design — hero card, 7 cols, 2 rows */}
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="col-span-12 md:col-span-7 md:row-span-2 rounded-[18px] p-8 text-left cursor-pointer transition-all duration-200 shadow-elevation-2 hover:shadow-elevation-3 min-h-[220px] flex flex-col justify-between"
              style={{
                background:
                  'linear-gradient(145deg, var(--color-primary-container) 0%, color-mix(in srgb, var(--color-primary-container) 40%, var(--color-surface)) 60%, var(--color-surface) 100%)',
              }}
            >
              <NewDesignIcon />
              <div className="mt-auto">
                <p className="text-[length:var(--font-size-headline-md)] font-bold text-on-surface tracking-tight">
                  New Design
                </p>
                <p className="text-[length:var(--font-size-body-md)] text-secondary mt-1">
                  Start a fresh quilt from scratch
                </p>
              </div>
            </button>

            {/* My Quiltbook — 5 cols */}
            <Link
              href="/dashboard"
              className="col-span-6 md:col-span-5 glass-elevated rounded-[18px] p-6 transition-all duration-200 hover:shadow-elevation-3 block"
            >
              <QuiltbookIcon />
              <p className="text-[length:var(--font-size-body-lg)] font-semibold text-on-surface mt-3.5">
                My Quiltbook
              </p>
              <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
                {projectCount !== null
                  ? `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
                  : 'Your saved designs'}
              </p>
              {projects.length > 0 && (
                <div className="flex -space-x-2 mt-3">
                  {projects.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden"
                      style={{ border: '2px solid var(--color-surface-container)' }}
                    >
                      {p.thumbnailUrl ? (
                        <Image
                          src={p.thumbnailUrl}
                          alt={p.name}
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-secondary font-medium">
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Link>

            {/* Browse Patterns — 5 cols, with inline SVG pattern */}
            <button
              type="button"
              onClick={() => setActiveTab('patterns')}
              className="col-span-6 md:col-span-5 glass-elevated rounded-[18px] overflow-hidden transition-all duration-200 hover:shadow-elevation-3 block"
            >
              <div className="h-[100px] relative overflow-hidden">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 320 100"
                  preserveAspectRatio="xMidYMid slice"
                  className="absolute inset-0"
                >
                  {/* HST pattern grid */}
                  {[0, 40, 80, 120, 160, 200, 240, 280].map((x, xi) =>
                    [0, 40, 80].map((y, yi) => (
                      <g key={`${xi}-${yi}`}>
                        <polygon
                          points={`${x},${y} ${x + 40},${y} ${x},${y + 40}`}
                          fill="var(--color-primary)"
                          opacity={(xi + yi) % 3 === 0 ? 0.7 : 0.4}
                        />
                        <polygon
                          points={`${x + 40},${y} ${x + 40},${y + 40} ${x},${y + 40}`}
                          fill="var(--color-primary-dark)"
                          opacity={(xi + yi) % 2 === 0 ? 0.35 : 0.2}
                        />
                      </g>
                    ))
                  )}
                </svg>
              </div>
              <div className="p-5">
                <p className="text-[length:var(--font-size-body-lg)] font-semibold text-on-surface">
                  Browse Patterns
                </p>
                <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
                  Start from a pre-made design
                </p>
              </div>
            </button>

            {/* Browse Fabrics — 4 cols, tall, with real image */}
            <Link
              href="/dashboard"
              className="col-span-6 md:col-span-4 md:row-span-2 rounded-[18px] overflow-hidden flex flex-col transition-all duration-200 hover:shadow-elevation-1 relative group"
            >
              <Image
                src="/images/quilts/quilt_03_closeup_scrappy.png"
                alt="Fabric swatches"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              <div className="relative mt-auto p-6">
                <p className="text-[length:var(--font-size-body-lg)] font-semibold text-white">
                  Browse Fabrics
                </p>
                <p className="text-[length:var(--font-size-body-sm)] text-white/75 mt-1">
                  Your fabric library
                </p>
              </div>
            </Link>

            {/* Tutorials — 4 cols */}
            <Link
              href="/tutorials"
              className="col-span-6 md:col-span-4 glass-elevated rounded-[18px] p-6 transition-all duration-200 hover:shadow-elevation-3 block"
            >
              <TutorialsIcon />
              <p className="text-[length:var(--font-size-body-lg)] font-semibold text-on-surface mt-3.5">
                Tutorials
              </p>
              <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
                10 step-by-step guides
              </p>
            </Link>

            {/* Community — 4 cols */}
            <Link
              href="/socialthreads"
              className="col-span-6 md:col-span-4 glass-elevated rounded-[18px] p-6 transition-all duration-200 hover:shadow-elevation-3 block"
            >
              <CommunityIcon />
              <p className="text-[length:var(--font-size-body-lg)] font-semibold text-on-surface mt-3.5">
                Community
              </p>
              <p className="text-[length:var(--font-size-body-sm)] text-secondary mt-1">
                Share & discover
              </p>
            </Link>

            {/* Photo to Pattern — 5 cols, with quilt image + opencv overlay */}
            <button
              type="button"
              onClick={() => openPhotoPattern()}
              className="col-span-12 md:col-span-5 rounded-[18px] overflow-hidden transition-all duration-200 hover:shadow-elevation-2 block relative group text-left"
            >
              <div className="relative h-[180px] md:h-full min-h-[180px]">
                <Image
                  src="/images/quilts/quilt_01_closeup_churndash.png"
                  alt="Photo to pattern"
                  fill
                  className="object-cover"
                />
                {/* OpenCV-style shape detection overlay */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 400 200"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Detected block outlines */}
                  <rect
                    x="30"
                    y="20"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="120"
                    y="20"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="210"
                    y="20"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="300"
                    y="20"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="30"
                    y="110"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="120"
                    y="110"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <rect
                    x="210"
                    y="110"
                    width="80"
                    height="80"
                    rx="2"
                    fill="none"
                    stroke="#00ff88"
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  {/* Diagonal piece detection lines */}
                  <line
                    x1="30"
                    y1="20"
                    x2="110"
                    y2="100"
                    stroke="#00ccff"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  <line
                    x1="110"
                    y1="20"
                    x2="30"
                    y2="100"
                    stroke="#00ccff"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  <line
                    x1="120"
                    y1="20"
                    x2="200"
                    y2="100"
                    stroke="#00ccff"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  <line
                    x1="200"
                    y1="20"
                    x2="120"
                    y2="100"
                    stroke="#00ccff"
                    strokeWidth="1.2"
                    opacity="0.5"
                  />
                  {/* Corner points */}
                  {[
                    [30, 20],
                    [110, 20],
                    [30, 100],
                    [110, 100],
                    [120, 20],
                    [200, 20],
                    [120, 100],
                    [200, 100],
                    [210, 20],
                    [290, 20],
                    [210, 100],
                    [290, 100],
                  ].map(([cx, cy], i) => (
                    <circle key={i} cx={cx} cy={cy} r="3" fill="#00ff88" opacity="0.8" />
                  ))}
                </svg>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-[length:var(--font-size-body-lg)] font-semibold text-white">
                  Photo to Pattern
                </p>
                <p className="text-[length:var(--font-size-body-sm)] text-white/75 mt-1">
                  Import a quilt photo & extract blocks
                </p>
              </div>
            </button>

            {/* Settings — 3 cols (compact) */}
            <Link
              href="/profile"
              className="col-span-4 md:col-span-3 glass-elevated rounded-[18px] p-5 transition-all duration-200 hover:shadow-elevation-3 block"
            >
              <SettingsIcon />
              <p className="text-[length:var(--font-size-body-md)] font-semibold text-on-surface mt-2.5">
                Settings
              </p>
            </Link>

            {/* Blog — 4 cols, with real quilt image */}
            <Link
              href="/blog"
              className="col-span-8 md:col-span-4 rounded-[18px] overflow-hidden transition-all duration-200 hover:shadow-elevation-1 block relative group"
            >
              <div className="relative h-[140px]">
                <Image
                  src="/images/quilts/quilt_06_wall_art.png"
                  alt="Quilting blog"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[length:var(--font-size-body-lg)] font-semibold text-white">
                  Blog
                </p>
                <p className="text-[length:var(--font-size-body-sm)] text-white/75 mt-0.5">
                  Tips, stories & inspiration
                </p>
              </div>
            </Link>
          </div>

          {/* Recent Projects — only if user has projects */}
          {projects.length > 0 && (
            <div className="mt-10">
              <h2 className="text-[length:var(--font-size-headline-sm)] font-bold text-on-surface mb-5">
                Recent Projects
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {projects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    href={`/studio/${project.id}`}
                    className="flex-shrink-0 w-[220px] glass-elevated rounded-xl overflow-hidden hover:shadow-elevation-3 transition-all duration-200"
                  >
                    <div className="aspect-video bg-surface-container-high/50 relative overflow-hidden">
                      {project.thumbnailUrl ? (
                        <Image
                          src={project.thumbnailUrl}
                          alt={project.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            className="text-outline-variant"
                          >
                            <rect
                              x="3"
                              y="3"
                              width="11"
                              height="11"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.3"
                            />
                            <rect
                              x="18"
                              y="3"
                              width="11"
                              height="11"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.3"
                            />
                            <rect
                              x="3"
                              y="18"
                              width="11"
                              height="11"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.3"
                            />
                            <rect
                              x="18"
                              y="18"
                              width="11"
                              height="11"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="1.3"
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
                        {formatRelativeTime(project.updatedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <PhotoPatternModal />
        </>
      )}

      {/* New Project Dialog */}
      <NewProjectDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
        onBrowsePatterns={() => setActiveTab('patterns')}
      />
    </div>
  );
}
