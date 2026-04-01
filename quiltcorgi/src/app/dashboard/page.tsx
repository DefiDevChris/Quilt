'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ArrowLeft, Scissors, ScanLine, BookOpen, LayoutGrid, HeartHandshake, Settings, UserCircle } from 'lucide-react';
import { NewProjectDialog } from '@/components/projects/NewProjectDialog';
import { formatRelativeTime } from '@/lib/format-time';
import { useAuthStore } from '@/stores/authStore';
import { PhotoPatternModal } from '@/components/photo-pattern/PhotoPatternModal';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { useToast } from '@/components/ui/ToastProvider';

const PatternLibrary = dynamic(
  () => import('@/components/patterns/PatternLibrary').then((m) => m.PatternLibrary),
  { ssr: false }
);

type DashboardTab = 'my-quilts' | 'patterns';

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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('my-quilts');
  const { toast } = useToast();

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
        toast({
          type: 'error',
          title: 'Import failed',
          description: 'Could not create a project from your photo. Please try again.',
        });
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
      // silent
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && user) {
      fetchProjects();
    }
  }, [isLoadingAuth, user, fetchProjects]);

  const displayName = user?.name?.split(' ')[0] ?? 'there';
  const greeting = getGreeting();

  /* ── Pattern Library view ────────────────────────────────────────── */
  if (activeTab === 'patterns') {
    return (
      <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden flex flex-col">
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-white/50 bg-white/40 backdrop-blur-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('my-quilts')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2} />
            <span className="text-sm font-semibold">Dashboard</span>
          </button>
          <div className="w-px h-4 bg-slate-300/60" />
          <h1 className="text-slate-800 font-bold text-sm">Pattern Library</h1>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <PatternLibrary />
        </div>
      </div>
    );
  }

  /* ── Main bento grid ─────────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto md:py-6 relative z-10 w-full">
      <div className="grid grid-cols-12 auto-rows-[minmax(140px,auto)] md:grid-rows-[250px_180px_160px] gap-4 pb-20">
        
        {/* ── 1. New Design — col 1-8, row 1 ──────────────────────── */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="col-span-12 md:col-span-8 rounded-2xl p-6 md:p-8 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br from-orange-50/95 via-amber-50/80 to-white/60 backdrop-blur-xl border border-white shadow-sm"
        >
          {/* Custom Bento Graphic Background (Lucide) */}
          <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none group-hover:scale-105 group-hover:rotate-[-5deg] transition-transform duration-500">
            <Scissors size={280} strokeWidth={1} className="text-orange-900" />
          </div>

          <div className="relative z-10">
            <p className="text-slate-500 text-sm font-medium tracking-wide uppercase">{greeting}</p>
            <h1 className="text-slate-900 text-3xl font-extrabold tracking-tight mt-1">
              Hello, {displayName}
            </h1>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
            <div>
              <p className="text-slate-900 font-extrabold text-xl tracking-tight">New Design</p>
              <p className="text-slate-600 text-sm mt-1">Start a fresh quilt from scratch</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30 group-hover:bg-orange-500 group-hover:scale-110 transition-all flex-shrink-0">
              <Plus size={24} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* ── 2. Photo to Pattern — col 9-12, row 1 ─ */}
        <button
          type="button"
          onClick={() => openPhotoPattern()}
          className="col-span-12 md:col-span-4 rounded-2xl p-6 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-slate-900 border border-slate-800 shadow-lg"
        >
          {/* Custom Bento Graphic Background (Lucide) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
             <ScanLine size={160} strokeWidth={1} className="text-white" />
          </div>
          
          <div className="absolute bottom-6 left-6 right-6 z-10">
            <span className="inline-block px-2.5 py-1 bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">
              AI Feature
            </span>
            <p className="text-white text-xl font-extrabold tracking-tight">
              Photo to Pattern
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Extract blocks from a photo
            </p>
          </div>
        </button>

        {/* ── 3. Quiltbook — col 1-4, row 2 ───────────────────────── */}
        <Link
          href="/studio"
          className="col-span-12 md:col-span-4 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/70 backdrop-blur-xl border border-white shadow-sm flex flex-col justify-between group"
        >
          <div className="absolute -bottom-4 right-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
             <BookOpen size={180} strokeWidth={1} className="text-orange-900" />
          </div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-slate-900 font-extrabold text-lg tracking-tight">My Quiltbook</p>
              <p className="text-slate-500 text-sm mt-0.5">
                {projectCount !== null
                  ? `${projectCount} saved designs`
                  : 'Your saved designs'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-100/80 flex items-center justify-center flex-shrink-0 border border-orange-200">
              <BookOpen size={20} className="text-orange-600" />
            </div>
          </div>

          <div className="relative z-10">
            {projects.length > 0 ? (
              <div className="flex gap-2">
                {projects.slice(0, 3).map((p) => (
                  <div key={p.id} className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                    {p.thumbnailUrl ? (
                      <Image src={p.thumbnailUrl} alt={p.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <span className="text-slate-400 text-xs font-bold">{p.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50" />
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-3 font-medium">
              {projects.length > 0 ? `Last edited ${formatRelativeTime(projects[0].updatedAt)}` : 'No projects yet'}
            </p>
          </div>
        </Link>

        {/* ── 4. Browse Patterns — col 5-8, row 2 ─────────────────── */}
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className="col-span-12 md:col-span-4 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left bg-white/70 backdrop-blur-xl border border-white shadow-sm group flex flex-col justify-between"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none group-hover:rotate-12 group-hover:scale-110 transition-transform duration-700">
             <LayoutGrid size={220} strokeWidth={1} className="text-slate-900" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <LayoutGrid size={20} className="text-slate-600" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-slate-900 font-extrabold text-lg tracking-tight">Browse Patterns</p>
            <p className="text-slate-500 text-sm mt-0.5">Explore pre-made designs</p>
          </div>
        </button>

        {/* ── 5. Community — col 9-12, row 2 ───────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-span-12 md:col-span-4 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-[#FFE4D0]/40 to-white/70 backdrop-blur-xl border border-white shadow-sm group flex flex-col justify-between"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
             <HeartHandshake size={180} strokeWidth={1} className="text-orange-900" />
          </div>
          <div className="relative z-10">
             <div className="w-10 h-10 rounded-full bg-orange-100/80 flex items-center justify-center border border-orange-200">
              <HeartHandshake size={20} className="text-orange-600" />
            </div>
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-slate-900 font-extrabold text-lg tracking-tight">Community Threads</p>
            <p className="text-slate-600 text-sm mt-0.5">Share blocks &amp; discover</p>
          </div>
        </Link>

        {/* ── 6. Profile — col 1-6, row 3 ──────────────────────────── */}
        <Link
          href="/profile"
          className="col-span-12 md:col-span-6 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white/60 backdrop-blur-xl border border-white shadow-sm group flex items-center gap-5"
        >
          <div className="absolute top-[-20%] right-[-10%] opacity-[0.02] pointer-events-none">
             <UserCircle size={280} strokeWidth={1} className="text-slate-900" />
          </div>
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 relative z-10 shrink-0">
            <UserCircle size={28} className="text-slate-600" />
          </div>
          <div className="relative z-10">
            <p className="text-slate-900 font-extrabold text-lg tracking-tight">My Profile</p>
            <p className="text-slate-500 text-sm mt-0.5">Manage details and public settings</p>
          </div>
        </Link>

        {/* ── 7. Settings — col 7-12, row 3 ────────────────────────── */}
        <Link
          href="/profile#settings"
          className="col-span-12 md:col-span-6 rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-slate-50/80 backdrop-blur-xl border border-white shadow-sm group flex items-center gap-5"
        >
          <div className="absolute top-1/2 left-[-10%] -translate-y-1/2 opacity-[0.03] pointer-events-none group-hover:rotate-45 transition-transform duration-1000">
             <Settings size={220} strokeWidth={1} className="text-slate-900" />
          </div>
          <div className="relative z-10 ml-auto flex items-center gap-5 w-full justify-end">
             <div className="text-right">
               <p className="text-slate-900 font-extrabold text-lg tracking-tight">System Settings</p>
               <p className="text-slate-500 text-sm mt-0.5">Units, theme, defaults</p>
             </div>
             <div className="w-14 h-14 rounded-full bg-slate-200/50 flex items-center justify-center border border-slate-300 shrink-0 group-hover:bg-slate-200 transition-colors">
               <Settings size={28} className="text-slate-600" />
             </div>
          </div>
        </Link>

      </div>

      <PhotoPatternModal />
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
