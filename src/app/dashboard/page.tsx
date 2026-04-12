'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';

const MobileUploadsPanel = dynamic(
  () => import('@/components/uploads/MobileUploadsPanel').then((m) => m.MobileUploadsPanel),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'mobile-uploads';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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

function DashboardPageContent() {
  const user = useAuthStore((s) => s.user);
  const isPro = useAuthStore((s) => s.isPro);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-quilts');
  const uploads = useMobileUploadStore((s) => s.uploads);
  const pendingUploads = useMemo(() => uploads.filter((u) => u.status === 'pending'), [uploads]);
  const fetchMobileUploads = useMobileUploadStore((s) => s.fetchUploads);
  const searchParams = useSearchParams();
  const _action = searchParams?.get('action') ?? '';
  const _preloadUrl = searchParams?.get('preloadUrl') ?? '';
  const _uploadId = searchParams?.get('uploadId') ?? '';

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects?sort=updatedAt&order=desc&limit=50');
      if (!res.ok) return;
      const data = await res.json();
      setProjects(data.data.projects);
      setProjectCount(data.data.projects.length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      setTimeout(() => {
        fetchProjects();
        fetchMobileUploads('pending');
      }, 0);
    }
  }, [isLoadingAuth, user, fetchProjects, fetchMobileUploads]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  /* ── Mobile Uploads view ─────────────────────────────────────────── */
  if (activeTab === 'mobile-uploads') {
    return (
      <BrandedPage decorationOpacity={6}>
        <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 border-b bg-[var(--color-bg)]" style={{ borderColor: COLORS.border }}>
            <button
              type="button"
              onClick={() => setActiveTab('my-quilts')}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 border transition-colors rounded-lg"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: COLORS.border,
                color: COLORS.text,
                boxShadow: SHADOW.brand,
                transitionDuration: `${MOTION.transitionDuration}ms`,
                transitionTimingFunction: MOTION.transitionEasing,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.bg;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.surface;
              }}
            >
              <ArrowLeft size={14} strokeWidth={3} />
              Back to Dashboard
            </button>
          </div>
          <div className="flex-1 overflow-auto px-6 py-8">
            <MobileUploadsPanel />
          </div>
        </div>
      </BrandedPage>
    );
  }

  /* ── Main Workspace layout ───────────────────────────────────────── */
  return (
    <BrandedPage decorationOpacity={6}>
      <div className="max-w-7xl mx-auto py-12 px-6 w-full">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1
            className="text-[40px] leading-[52px] font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: COLORS.text }}
          >
            Dashboard
          </h1>
          <p className="text-base" style={{ color: COLORS.textDim }}>
            {greeting}, {displayName}
          </p>
        </div>

        {!isPro && !isLoadingAuth && user && <ProUpgradeButton variant="dashboard" />}
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-12">
        <h2 className="text-sm font-semibold mb-6" style={{ color: COLORS.text }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="group relative overflow-hidden p-8 text-left transition-colors rounded-lg"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS_HOVER.primary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <Image
                src="/icons/quilt-13-dashed-squares-Photoroom.png"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xl">New Design</p>
              <p style={{ color: `${COLORS.text}cc` }} className="text-sm">
                Start a fresh project from scratch or a template
              </p>
            </div>
          </button>

          <Link
            href="/photo-to-design"
            className="group relative overflow-hidden p-8 text-left border transition-colors rounded-lg"
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = `${COLORS.primary}4d`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor = COLORS.border;
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <Image
                src="/icons/quilt-photo-camera.png"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xl" style={{ color: COLORS.text }}>Photo to Design</p>
              <p className="text-sm" style={{ color: COLORS.textDim }}>Extract a pattern from a photo of a quilt</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => projects[0] && (window.location.href = `/studio/${projects[0].id}`)}
            disabled={projects.length === 0}
            className={`group relative overflow-hidden p-8 text-left border transition-colors rounded-lg ${projects.length > 0 ? '' : 'cursor-not-allowed'}`}
            style={{
              backgroundColor: COLORS.surface,
              borderColor: COLORS.border,
              boxShadow: SHADOW.brand,
              opacity: projects.length > 0 ? 1 : 0.4,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              if (projects.length > 0) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${COLORS.primary}4d`;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.border;
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <Image
                src="/icons/quilt-worktable.png"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12"
              />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-xl" style={{ color: COLORS.text }}>Continue Latest</p>
              <p className="text-sm truncate" style={{ color: COLORS.textDim }}>
                {projects[0] ? projects[0].name : 'No projects yet'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="mb-12">
        <h2 className="text-sm font-semibold mb-6" style={{ color: COLORS.text }}>
          Navigate
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'Projects',
              href: '/projects',
              icon: '/icons/quilt-projects.png',
              count: projectCount,
              description: 'Manage your designs',
            },
            {
              label: 'Fabric Library',
              href: '/fabrics',
              icon: '/icons/quilt-01-spool-Photoroom.png',
              description: 'Browse fabrics',
            },
            {
              label: 'Social Threads',
              href: '/socialthreads',
              icon: '/icons/quilt-book.png',
              description: 'Community feed',
            },
            {
              label: 'Mobile Uploads',
              type: 'button',
              onClick: () => setActiveTab('mobile-uploads'),
              icon: '/icons/quilt-mobile-uploads.png',
              count: pendingUploads.length,
              description: 'Process uploads',
            },
            {
              label: 'Settings',
              href: '/settings',
              icon: '/icons/quilt-settings.png',
              description: 'Account preferences',
            },
          ].map((item, i) => {
            const Content = (
              <>
                <div
                  className="w-12 h-12 border rounded-lg flex items-center justify-center mb-3 transition-colors overflow-hidden"
                  style={{
                    backgroundColor: COLORS.bg,
                    borderColor: COLORS.border,
                    transitionDuration: `${MOTION.transitionDuration}ms`,
                    transitionTimingFunction: MOTION.transitionEasing,
                  }}
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-0.5" style={{ color: COLORS.text }}>{item.label}</p>
                    <p className="text-xs line-clamp-2" style={{ color: COLORS.textDim }}>{item.description}</p>
                  </div>
                  {item.count !== undefined && item.count !== null && (
                    <span
                      className="px-2 py-0.5 text-xs font-medium rounded-lg shrink-0"
                      style={{
                        backgroundColor: item.label === 'Mobile Uploads' && (item.count as number) > 0
                          ? COLORS.primary
                          : COLORS.bg,
                        color: item.label === 'Mobile Uploads' && (item.count as number) > 0
                          ? COLORS.text
                          : COLORS.textDim,
                      }}
                    >
                      {item.count}
                    </span>
                  )}
                </div>
              </>
            );

            if (item.type === 'button') {
              return (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="group flex flex-col p-5 border transition-colors rounded-lg text-left"
                  style={{
                    backgroundColor: COLORS.surface,
                    borderColor: COLORS.border,
                    boxShadow: SHADOW.brand,
                    transitionDuration: `${MOTION.transitionDuration}ms`,
                    transitionTimingFunction: MOTION.transitionEasing,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = `${COLORS.primary}4d`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = COLORS.border;
                  }}
                >
                  {Content}
                </button>
              );
            }

            return (
              <Link
                key={i}
                href={item.href || '#'}
                className="group flex flex-col p-5 border transition-colors rounded-lg"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  boxShadow: SHADOW.brand,
                  transitionDuration: `${MOTION.transitionDuration}ms`,
                  transitionTimingFunction: MOTION.transitionEasing,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${COLORS.primary}4d`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = COLORS.border;
                }}
              >
                {Content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium transition-colors flex items-center gap-1"
              style={{
                color: COLORS.primary,
                transitionDuration: `${MOTION.transitionDuration}ms`,
                transitionTimingFunction: MOTION.transitionEasing,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
              }}
            >
              View All
              <ChevronRight size={16} strokeWidth={2} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <Link
                key={project.id}
                href={`/studio/${project.id}`}
                className="group flex flex-col border transition-colors rounded-lg overflow-hidden"
                style={{
                  backgroundColor: COLORS.surface,
                  borderColor: COLORS.border,
                  boxShadow: SHADOW.brand,
                  transitionDuration: `${MOTION.transitionDuration}ms`,
                  transitionTimingFunction: MOTION.transitionEasing,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = `${COLORS.primary}4d`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = COLORS.border;
                }}
              >
                <div className="w-full h-40 bg-[var(--color-bg)] border-b overflow-hidden" style={{ borderColor: COLORS.border }}>
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt={project.name}
                      width={400}
                      height={160}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: COLORS.textDim }}>
                      <LayoutGrid size={40} strokeWidth={1.5} className="opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p
                    className="font-semibold transition-colors truncate"
                    style={{
                      color: COLORS.text,
                      transitionDuration: `${MOTION.transitionDuration}ms`,
                      transitionTimingFunction: MOTION.transitionEasing,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLParagraphElement).style.color = COLORS.primary;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLParagraphElement).style.color = COLORS.text;
                    }}
                  >
                    {project.name}
                  </p>
                  <div className="flex items-center justify-between text-xs" style={{ color: COLORS.textDim }}>
                    <span>{formatRelativeTime(project.updatedAt)}</span>
                    <span className="px-2 py-0.5 rounded-lg" style={{ backgroundColor: COLORS.bg }}>
                      {project.unitSystem}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <NewProjectWizard
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          fetchProjects();
        }}
      />
    </div>
    </BrandedPage>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
