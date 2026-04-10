'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { NewProjectWizard } from '@/components/projects/NewProjectWizard';
import { motion } from 'framer-motion';
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
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 border-b border-neutral-200 bg-neutral">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 bg-neutral border border-neutral-300 rounded-full transition-all hover:bg-neutral-100"
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
      {/* Header */}
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-primary/30" />
            <p className="text-sm font-medium text-neutral-600">
              {greeting} / Designer Session
            </p>
          </div>
          <h1 className="text-neutral-900 text-5xl md:text-6xl font-bold tracking-tight leading-tight">
            Design<br />Studio
          </h1>
          <p className="text-neutral-700 text-base font-medium">
            Welcome back, <span className="text-primary font-semibold">{displayName}</span>. The workshop is prepared.
          </p>
        </motion.div>

        {!isPro && !isLoadingAuth && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProUpgradeButton variant="dashboard" />
          </motion.div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-16">
        {/* LEFT COLUMN: The Workbench */}
        <div className="flex-1 space-y-16">
          {/* Primary Operations */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm font-semibold text-neutral-800 flex items-center gap-3">
                <div className="w-2 h-2 bg-primary rounded-full" />
                Active Workbench
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="group relative overflow-hidden p-8 text-left bg-primary text-white shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-150 hover:-translate-y-0.5"
              >
                <div className="relative z-10 space-y-2">
                  <p className="text-white font-semibold text-xl">New Design</p>
                  <p className="text-white/80 text-sm max-w-[240px]">Start a fresh project from scratch or a template</p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-40 transition-all duration-150 group-hover:rotate-12 group-hover:scale-110">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => projects[0] && (window.location.href = `/studio/${projects[0].id}`)}
                disabled={projects.length === 0}
                className={`group relative overflow-hidden p-8 text-left bg-neutral border border-neutral-200 hover:border-primary hover:shadow-elevation-3 transition-all duration-150 hover:-translate-y-0.5 ${projects.length > 0 ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                <div className="relative z-10 space-y-2">
                  <p className="text-neutral-800 font-semibold text-xl">Resume Latest</p>
                  <p className="text-neutral-500 text-sm truncate max-w-[240px]">
                    {projects[0] ? projects[0].name : "No projects yet"}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-150 group-hover:scale-110">
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
              <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                <h2 className="text-sm font-semibold text-neutral-700">Recent Projects</h2>
                <Link href="/projects" className="text-sm font-medium text-primary hover:opacity-80 transition-all">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {projects.slice(0, 5).map((project, i) => (
                  <Link
                    key={project.id}
                    href={`/studio/${project.id}`}
                    className="flex items-center gap-6 p-4 hover:bg-neutral-50 transition-all group border border-neutral-200 hover:border-primary/30"
                  >
                    <div className="w-16 h-16 bg-neutral border border-neutral-200 overflow-hidden shrink-0 shadow-elevation-1 group-hover:shadow-elevation-2 transition-all">
                      {project.thumbnailUrl ? (
                        <Image src={project.thumbnailUrl} alt={project.name} width={64} height={64} className="object-cover group-hover:scale-105 transition-transform duration-150" unoptimized />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <span className="text-xs font-medium">QUILT</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-neutral-800 font-semibold text-lg group-hover:text-primary transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                        <div className="w-1 h-1 rounded-full bg-neutral-400" />
                        <span>{project.unitSystem}</span>
                      </div>
                    </div>
                    <div className="mr-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                      <ArrowLeft size={20} strokeWidth={3} className="rotate-180 text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Studio Tools SideBar */}
        <div className="w-full lg:w-96 space-y-10">
          <section className="bg-neutral border border-neutral-200 p-6 space-y-6">
            <h2 className="text-sm font-semibold text-neutral-700 pb-4 border-b border-neutral-200">
              Studio Tools
            </h2>

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
                    <span className="flex-1 font-medium text-sm text-neutral-700 group-hover:text-neutral-900 transition-all">{item.label}</span>
                    {item.count !== undefined && item.count !== null && (
                      <span className={`px-2 py-0.5 text-xs font-medium ${(item.label === 'Mobile Uploads' && (item.count as number) > 0) ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-600'
                        }`}>
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
                      className="w-full flex items-center gap-3 p-4 hover:bg-neutral-50 transition-all group text-left border border-transparent hover:border-neutral-200"
                    >
                      {Content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={i}
                    href={item.href || '#'}
                    className="flex items-center gap-3 p-4 hover:bg-neutral-50 transition-all group border border-transparent hover:border-neutral-200"
                  >
                    {Content}
                  </Link>
                );
              })}
            </nav>
          </section>

          {/* Quote Card */}
          <section className="bg-primary p-8 text-white shadow-elevation-3">
            <div className="space-y-4">
              <p className="text-sm font-medium leading-relaxed italic">
                "The details are not the details. They make the design."
              </p>
              <div className="pt-4 border-t border-white/20">
                <p className="text-xs font-medium opacity-70">— Charles Eames</p>
              </div>
            </div>
          </section>
        </div>
      </div>

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
