'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeButton } from '@/components/billing/ProUpgradeButton';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { QuiltPiece, QuiltPieceRow, QuiltPieceBand } from '@/components/decorative/QuiltPiece';

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
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 border-b border-[#e8e1da] bg-[#fdfaf7]">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-[#ffffff] border border-[#e8e1da] text-[#2d2a26] hover:bg-[#fdfaf7] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
            style={{ borderRadius: '8px' }}
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
    <div className="max-w-7xl mx-auto py-12 px-6 relative z-10 w-full">
      {/* Decorative quilt-piece backgrounds */}
      <QuiltPiece color="primary" size={140} rotation={10} top={20} right={-20} opacity={6} />
      <QuiltPiece color="secondary" size={100} rotation={-12} top={200} left={-20} opacity={8} />
      <QuiltPiece color="accent" size={80} rotation={20} bottom={100} right="5%" opacity={6} />

      {/* Header */}
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <QuiltPieceRow count={3} size={8} gap={4} />
            <p className="text-sm font-medium text-[#6b655e]">
              {greeting}, {displayName}. Your worktable is ready.
            </p>
          </div>
          <h1
            className="text-[40px] leading-[52px] font-semibold text-[#2d2a26]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Design Studio
          </h1>
        </div>

        {!isPro && !isLoadingAuth && user && (
          <ProUpgradeButton variant="dashboard" />
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-16 relative z-10">
        {/* LEFT COLUMN: Quick Start */}
        <div className="flex-1 space-y-16">
          {/* Primary Operations */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-semibold text-[#2d2a26] flex items-center gap-3">
                <div className="w-2 h-2 bg-[#ff8d49]" style={{ borderRadius: '8px' }} />
                Quick Start
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="group relative overflow-hidden p-8 text-left bg-[#ff8d49] text-[#2d2a26] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:bg-[#e67d3f] transition-colors duration-150"
                style={{ borderRadius: '8px' }}
              >
                <div className="relative z-10 space-y-2">
                  <p className="font-semibold text-xl">New Design</p>
                  <p className="text-[#2d2a26]/80 text-sm max-w-[240px]">Start a fresh project from scratch or a template</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-colors duration-150">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => projects[0] && (window.location.href = `/studio/${projects[0].id}`)}
                disabled={projects.length === 0}
                className={`group relative overflow-hidden p-8 text-left bg-[#ffffff] border border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)] hover:border-[#ff8d49]/30 transition-colors duration-150 ${projects.length > 0 ? '' : 'opacity-40 cursor-not-allowed'}`}
                style={{ borderRadius: '8px' }}
              >
                <div className="relative z-10 space-y-2">
                  <p className="text-[#2d2a26] font-semibold text-xl">Continue Your Latest Design</p>
                  <p className="text-[#6b655e] text-sm truncate max-w-[240px]">
                    {projects[0] ? projects[0].name : "No projects yet"}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-colors duration-150">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </section>

          {/* Recent List */}
          {projects.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-[#e8e1da] pb-4">
                <div className="flex items-center gap-2">
                  <QuiltPieceRow count={2} size={8} gap={3} />
                  <h2 className="text-sm font-semibold text-[#2d2a26]">Recent Projects</h2>
                </div>
                <Link href="/projects" className="text-sm font-medium text-[#ff8d49] hover:opacity-80 transition-colors duration-150">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/studio/${project.id}`}
                    className="flex items-center gap-6 p-4 hover:bg-[#fdfaf7] transition-colors duration-150 group border border-[#e8e1da] hover:border-[#ff8d49]/30 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
                    style={{ borderRadius: '8px' }}
                  >
                    <div className="w-16 h-16 bg-[#fdfaf7] border border-[#e8e1da] rounded-lg overflow-hidden shrink-0">
                      {project.thumbnailUrl ? (
                        <Image src={project.thumbnailUrl} alt={project.name} width={64} height={64} className="object-cover" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#6b655e]">
                          <span className="text-xs font-medium">QUILT</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-[#2d2a26] font-semibold text-lg group-hover:text-[#ff8d49] transition-colors duration-150">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[#6b655e]">
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                        <div className="w-1 h-1 bg-[#6b655e]/40" style={{ borderRadius: '8px' }} />
                        <span>{project.unitSystem}</span>
                      </div>
                    </div>
                    <div className="mr-4 opacity-0 group-hover:opacity-100 transition-colors duration-150">
                      <ArrowLeft size={20} strokeWidth={3} className="rotate-180 text-[#ff8d49]" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Studio Tools SideBar */}
        <div className="w-full lg:w-96 space-y-10">
          <section className="bg-[#ffffff] border border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-6 space-y-6 relative overflow-hidden" style={{ borderRadius: '8px' }}>
            {/* Subtle quilt-piece decoration */}
            <div className="absolute top-2 right-2 opacity-5 pointer-events-none">
              <QuiltPiece color="primary" size={50} rotation={10} stitch={false} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 pb-4 border-b border-[#e8e1da]">
                <QuiltPieceRow count={2} size={8} gap={3} />
                <h2 className="text-sm font-semibold text-[#2d2a26]">
                  Studio Tools
                </h2>
              </div>

              <nav className="space-y-2">
                {[
                  { label: 'Projects', href: '/projects', count: projectCount },
                  { label: 'Fabric Library', href: '/fabrics' },
                  { label: 'Social Threads', href: '/socialthreads' },
                  { label: 'Settings', href: '/settings' },
                  { label: 'Mobile Uploads', type: 'button', onClick: () => setActiveTab('mobile-uploads'), count: pendingUploads.length },
                ].map((item, i) => {
                  const Content = (
                    <>
                      <span className="flex-1 font-medium text-sm text-[#2d2a26] group-hover:text-[#ff8d49] transition-colors duration-150">{item.label}</span>
                      {item.count !== undefined && item.count !== null && (
                        <span className={`px-2 py-0.5 text-xs font-medium ${(item.label === 'Mobile Uploads' && (item.count as number) > 0) ? 'bg-[#ff8d49] text-[#2d2a26]' : 'bg-[#fdfaf7] text-[#6b655e]'
                          }`} style={{ borderRadius: '8px' }}>
                          {item.count}
                        </span>
                      )}
                    </>
                  );

                  if (item.type === 'button') {
                    return (
                      <button
                        key={i}
                        onClick={item.onClick}
                        className="w-full flex items-center gap-3 p-4 hover:bg-[#fdfaf7] transition-colors duration-150 group text-left border border-transparent hover:border-[#e8e1da]"
                        style={{ borderRadius: '8px' }}
                      >
                        {Content}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={i}
                      href={item.href || '#'}
                      className="flex items-center gap-3 p-4 hover:bg-[#fdfaf7] transition-colors duration-150 group border border-transparent hover:border-[#e8e1da]"
                      style={{ borderRadius: '8px' }}
                    >
                      {Content}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </section>

          {/* Quote Card */}
          <section className="bg-[#ff8d49] p-8 text-[#2d2a26] shadow-[0_1px_2px_rgba(45,42,38,0.08)] relative overflow-hidden" style={{ borderRadius: '8px' }}>
            {/* Subtle quilt-piece decoration */}
            <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
              <QuiltPiece color="surface" size={80} rotation={15} stitch={false} />
            </div>
            <div className="space-y-4 relative z-10">
              <p className="text-sm font-medium leading-relaxed italic">
                "The details are not the details. They make the design."
              </p>
              <div className="pt-4 border-t border-[#2d2a26]/20">
                <p className="text-xs font-medium opacity-70">— Charles Eames</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom decorative band */}
      <QuiltPieceBand color="secondary" height={30} opacity={5} pieceCount={3} className="mt-16" />

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
