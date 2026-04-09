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
        <div className="flex items-center gap-3 px-6 py-4 flex-shrink-0 border-b border-outline-variant bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 bg-surface-container rounded-xl transition-all hover:bg-on-surface hover:text-surface"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Back to Atelier
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
      {/* Editorial Header */}
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-4">
            <span className="h-px w-12 bg-on-surface/20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">
              {greeting} / Designer Session
            </p>
          </div>
          <h1 className="text-on-surface text-6xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Studio<br />Atelier
          </h1>
          <p className="text-secondary text-base font-medium italic opacity-60">
            Welcome back, <span className="text-on-surface not-italic font-black decoration-primary decoration-2 underline-offset-4">{displayName}</span>. The workshop is prepared.
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
              <h2 className="text-[11px] font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-3">
                <div className="w-2 h-2 bg-on-surface rounded-full" />
                Active Workbench
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="group relative overflow-hidden rounded-[40px] p-10 text-left bg-on-surface text-surface hover:shadow-elevation-4 transition-all duration-500 hover:-translate-y-1"
              >
                <div className="relative z-10 space-y-2">
                  <p className="text-surface font-black text-2xl uppercase tracking-tighter">New Design</p>
                  <p className="text-surface/60 text-[10px] font-black uppercase tracking-widest max-w-[180px]">Initiate fresh project from archive or scale</p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-all duration-700 group-hover:rotate-12 group-hover:scale-120">
                   <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                     <path d="M12 5v14M5 12h14" />
                   </svg>
                </div>
              </button>

              <button
                type="button"
                onClick={() => projects[0] && (window.location.href = `/studio/${projects[0].id}`)}
                disabled={projects.length === 0}
                className={`group relative overflow-hidden rounded-[40px] p-10 text-left glass-panel border border-outline-variant/30 hover:shadow-elevation-3 transition-all duration-500 hover:-translate-y-1 ${projects.length > 0 ? '' : 'opacity-40 cursor-not-allowed'}`}
              >
                <div className="relative z-10 space-y-2">
                  <p className="text-on-surface font-black text-2xl uppercase tracking-tighter">Resume Latest</p>
                  <p className="text-secondary text-[10px] font-black uppercase tracking-widest truncate max-w-[200px]">
                    {projects[0] ? projects[0].name : "Empty Archive"}
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-110">
                   <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                     <path d="M5 12h14M12 5l7 7-7 7" />
                   </svg>
                </div>
              </button>
            </div>
          </section>

          {/* Recent List - Editorial Archive Feel */}
          {projects.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <h2 className="text-[11px] font-black text-secondary uppercase tracking-[0.2em]">Recent Records</h2>
                <Link href="/projects" className="text-[10px] font-black text-on-surface uppercase tracking-widest border-b-2 border-transparent hover:border-black transition-all">
                  Full Archive →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {projects.slice(0, 5).map((project, i) => (
                  <Link
                    key={project.id}
                    href={`/studio/${project.id}`}
                    className="flex items-center gap-6 p-4 rounded-3xl hover:bg-surface-container-high transition-all group border border-outline-variant/10 hover:border-black"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-surface-container-highest border border-outline-variant/30 overflow-hidden shrink-0 shadow-elevation-1 group-hover:shadow-elevation-2 transition-all">
                       {project.thumbnailUrl ? (
                         <Image src={project.thumbnailUrl} alt={project.name} width={64} height={64} className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center opacity-10">
                            <span className="text-xs font-black uppercase">QUILT</span>
                         </div>
                       )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-on-surface font-black text-lg tracking-tighter uppercase group-hover:underline decoration-thickness-2 underline-offset-4 transition-colors">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-secondary uppercase tracking-widest opacity-60">
                        <span>{formatRelativeTime(project.updatedAt)}</span>
                        <div className="w-1 h-1 rounded-full bg-outline-variant" />
                        <span>{project.unitSystem}</span>
                      </div>
                    </div>
                    <div className="mr-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2">
                       <ArrowLeft size={20} strokeWidth={3} className="rotate-180 text-on-surface" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN: Studio Tools SideBar */}
        <div className="w-full lg:w-96 space-y-10">
          <section className="bg-surface-container-low rounded-[40px] p-8 space-y-8 border border-outline-variant/10">
            <h2 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] pb-4 border-b border-outline-variant/20 italic">
              Studio Inventory
            </h2>
            
            <nav className="space-y-2">
              {[
                { label: 'Project Archive', href: '/projects', count: projectCount },
                { label: 'Material Library', href: '/fabrics' },
                { label: 'Collective Feed', href: '/socialthreads' },
                { label: 'Account Matrix', href: '/settings' },
                { label: 'Mobile Sync', type: 'button', onClick: () => setActiveTab('mobile-uploads'), count: pendingUploads.length },
              ].map((item, i) => {
                const Content = (
                  <>
                    <span className="flex-1 font-black text-sm text-on-surface/70 group-hover:text-on-surface uppercase tracking-tight transition-all">{item.label}</span>
                    {item.count !== undefined && item.count !== null && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                        (item.label === 'Mobile Sync' && (item.count as number) > 0) ? 'bg-error text-surface' : 'bg-on-surface/10 text-on-surface'
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
                      className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-white transition-all group text-left border border-transparent hover:border-outline-variant/20 shadow-none hover:shadow-elevation-1"
                    >
                      {Content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={i}
                    href={item.href || '#'}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-white transition-all group border border-transparent hover:border-outline-variant/20 shadow-none hover:shadow-elevation-1"
                  >
                    {Content}
                  </Link>
                );
              })}
            </nav>
          </section>

          {/* Editorial Note Card */}
          <section className="relative overflow-hidden rounded-[40px] bg-on-surface p-10 text-surface shadow-elevation-4">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4 opacity-40">
                  <div className="h-px w-8 bg-surface" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Monograph</p>
                </div>
                <p className="text-xl font-medium leading-tight tracking-tight italic">
                  "The details are not the details. They make the design."
                </p>
                <div className="pt-4 border-t border-surface/20">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">— Charles Eames</p>
                </div>
             </div>
             {/* Abstract studio elements */}
             <div className="absolute -bottom-12 -right-12 w-48 h-48 opacity-5">
                <div className="w-full h-full border-[20px] border-surface rounded-full" />
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
