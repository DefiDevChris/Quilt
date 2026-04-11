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
      <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 border-b border-[#d4d4d4] bg-[#fdfaf7]">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-[#ffffff] border border-[#d4d4d4] text-[#1a1a1a] hover:bg-[#fdfaf7] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)] rounded-lg"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to Dashboard
          </button>
        </div>
        <div className="flex-1 overflow-auto px-6 py-8">
          <MobileUploadsPanel />
        </div>
      </div>
    );
  }

  /* ── Main Workspace layout ───────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1
            className="text-[40px] leading-[52px] font-semibold text-[#1a1a1a] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Dashboard
          </h1>
          <p className="text-base text-[#4a4a4a]">
            {greeting}, {displayName}
          </p>
        </div>

        {!isPro && !isLoadingAuth && user && <ProUpgradeButton variant="dashboard" />}
      </div>

      {/* Quick Actions Grid */}
      <div className="mb-12">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="group relative overflow-hidden p-8 text-left bg-[#ff8d49] text-[#1a1a1a] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:bg-[#e67d3f] transition-colors duration-150 rounded-lg"
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
              <p className="text-[#1a1a1a]/80 text-sm">
                Start a fresh project from scratch or a template
              </p>
            </div>
          </button>

          <Link
            href="/photo-to-design"
            className="group relative overflow-hidden p-8 text-left bg-[#ffffff] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 rounded-lg"
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
              <p className="text-[#1a1a1a] font-semibold text-xl">Photo to Design</p>
              <p className="text-[#4a4a4a] text-sm">Extract a pattern from a photo of a quilt</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => projects[0] && (window.location.href = `/studio/${projects[0].id}`)}
            disabled={projects.length === 0}
            className={`group relative overflow-hidden p-8 text-left bg-[#ffffff] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 rounded-lg ${projects.length > 0 ? '' : 'opacity-40 cursor-not-allowed'}`}
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
              <p className="text-[#1a1a1a] font-semibold text-xl">Continue Latest</p>
              <p className="text-[#4a4a4a] text-sm truncate">
                {projects[0] ? projects[0].name : 'No projects yet'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Navigation Grid */}
      <div className="mb-12">
        <h2 className="text-sm font-semibold text-[#1a1a1a] mb-6">
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
                <div className="w-12 h-12 bg-[#fdfaf7] border border-[#d4d4d4] rounded-lg flex items-center justify-center mb-3 group-hover:border-[#ff8d49]/30 transition-colors duration-150 overflow-hidden">
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
                    <p className="font-semibold text-sm text-[#1a1a1a] mb-0.5">{item.label}</p>
                    <p className="text-xs text-[#4a4a4a] line-clamp-2">{item.description}</p>
                  </div>
                  {item.count !== undefined && item.count !== null && (
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-lg shrink-0 ${item.label === 'Mobile Uploads' && (item.count as number) > 0 ? 'bg-[#ff8d49] text-[#1a1a1a]' : 'bg-[#fdfaf7] text-[#4a4a4a]'}`}
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
                  className="group flex flex-col p-5 bg-[#ffffff] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 rounded-lg text-left"
                >
                  {Content}
                </button>
              );
            }

            return (
              <Link
                key={i}
                href={item.href || '#'}
                className="group flex flex-col p-5 bg-[#ffffff] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 rounded-lg"
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
            <h2 className="text-sm font-semibold text-[#1a1a1a]">
              Recent Projects
            </h2>
            <Link
              href="/projects"
              className="text-sm font-medium text-[#ff8d49] hover:opacity-80 transition-colors duration-150 flex items-center gap-1"
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
                className="group flex flex-col bg-[#ffffff] border border-[#d4d4d4] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 rounded-lg overflow-hidden"
              >
                <div className="w-full h-40 bg-[#fdfaf7] border-b border-[#d4d4d4] overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center text-[#4a4a4a]">
                      <LayoutGrid size={40} strokeWidth={1.5} className="opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-[#1a1a1a] font-semibold group-hover:text-[#ff8d49] transition-colors duration-150 truncate">
                    {project.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-[#4a4a4a]">
                    <span>{formatRelativeTime(project.updatedAt)}</span>
                    <span className="px-2 py-0.5 bg-[#fdfaf7] rounded-lg">
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
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}
