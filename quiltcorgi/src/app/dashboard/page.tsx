'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ArrowLeft } from 'lucide-react';
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
    <div className="md:-mt-6 md:-mx-6 md:h-[calc(100vh-56px)] md:overflow-hidden">
      <div className="h-full p-2 grid grid-cols-12 grid-rows-[3fr_2fr] gap-2">
        {/* ── 1. New Design — col 1-7, row 1 ──────────────────────── */}
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="col-start-1 col-span-12 md:col-span-7 row-start-1 min-h-[160px] md:min-h-0 rounded-xl p-5 text-left relative overflow-hidden group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-gradient-to-br from-[#FFE4D0]/95 via-[#FFF4EB]/80 to-white/50 backdrop-blur-xl border border-white/70 shadow-[0_2px_4px_rgba(74,59,50,0.04),0_8px_24px_rgba(74,59,50,0.07)]"
        >
          {/* Decorative background quilt blocks */}
          <div className="absolute bottom-0 right-0 w-40 h-40 opacity-[0.08] pointer-events-none translate-x-6 translate-y-6">
            <svg viewBox="0 0 56 56" fill="none" className="w-full h-full">
              <rect x="2" y="2" width="24" height="24" rx="4" fill="#C67B5C" />
              <rect x="30" y="2" width="24" height="24" rx="4" fill="#FFB085" />
              <rect x="2" y="30" width="24" height="24" rx="4" fill="#FFB085" />
              <rect x="30" y="30" width="24" height="24" rx="4" fill="#C67B5C" />
              <path
                d="M14 2L2 14M26 2L2 26M40 2L30 12M54 2L30 26M14 30L2 42M26 30L2 54M40 30L30 40M54 30L30 54"
                stroke="#4A3B32"
                strokeWidth="0.6"
                strokeLinecap="round"
                opacity="0.12"
              />
            </svg>
          </div>

          {/* Greeting */}
          <div className="relative z-10">
            <p className="text-slate-500 text-xs font-medium tracking-wide">{greeting}</p>
            <h1 className="text-slate-800 text-lg font-extrabold tracking-tight mt-0.5">
              Hello, {displayName}
            </h1>
          </div>

          {/* CTA */}
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between z-10">
            <div>
              <p className="text-slate-800 font-extrabold text-base tracking-tight">New Design</p>
              <p className="text-slate-500 text-xs mt-0.5">Start a fresh quilt from scratch</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg group-hover:bg-orange-600 group-hover:shadow-orange-200/80 group-hover:shadow-xl transition-all flex-shrink-0">
              <Plus size={18} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* ── 2. Photo to Pattern — col 8-12, rows 1+2 (full height) ─ */}
        <button
          type="button"
          onClick={() => openPhotoPattern()}
          className="col-start-1 md:col-start-8 col-span-12 md:col-span-5 row-start-2 md:row-start-1 md:row-span-2 min-h-[200px] md:min-h-0 rounded-xl overflow-hidden relative group cursor-pointer text-left transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5"
        >
          <Image
            src="/images/quilts/quilt_01_closeup_churndash.png"
            alt="Photo to Pattern"
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />

          {/* Scan overlay SVG */}
          <svg
            className="absolute inset-0 w-full h-full opacity-70 mix-blend-screen"
            viewBox="0 0 400 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <rect
              x="28"
              y="38"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.9"
            />
            <rect
              x="130"
              y="38"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.9"
            />
            <rect
              x="232"
              y="38"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.7"
            />
            <rect
              x="334"
              y="38"
              width="60"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.6"
            />
            <rect
              x="28"
              y="140"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.8"
            />
            <rect
              x="130"
              y="140"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.6"
            />
            <rect
              x="232"
              y="140"
              width="92"
              height="92"
              rx="3"
              fill="none"
              stroke="#00ff88"
              strokeWidth="2.2"
              opacity="0.5"
            />
            <line
              x1="28"
              y1="38"
              x2="120"
              y2="130"
              stroke="#00ccff"
              strokeWidth="1.4"
              opacity="0.55"
            />
            <line
              x1="120"
              y1="38"
              x2="28"
              y2="130"
              stroke="#00ccff"
              strokeWidth="1.4"
              opacity="0.55"
            />
            <line
              x1="130"
              y1="38"
              x2="222"
              y2="130"
              stroke="#00ccff"
              strokeWidth="1.4"
              opacity="0.45"
            />
            <line
              x1="222"
              y1="38"
              x2="130"
              y2="130"
              stroke="#00ccff"
              strokeWidth="1.4"
              opacity="0.45"
            />
            {(
              [
                [28, 38],
                [120, 38],
                [28, 130],
                [120, 130],
                [130, 38],
                [222, 38],
                [130, 130],
                [222, 130],
                [232, 38],
                [324, 38],
                [232, 130],
                [324, 130],
              ] as [number, number][]
            ).map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="4" fill="#00ff88" opacity="0.95" />
            ))}
          </svg>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* Label */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <span className="text-orange-300 text-[9px] font-bold uppercase tracking-[0.18em]">
              AI Feature
            </span>
            <p className="text-white text-base md:text-lg font-extrabold tracking-tight mt-1">
              Photo to Pattern
            </p>
            <p className="text-white/70 text-xs mt-1">
              Import a quilt photo &amp; extract blocks
            </p>
          </div>
        </button>

        {/* ── 3. Quiltbook — col 1-3, row 2 ───────────────────────── */}
        <Link
          href="/studio"
          className="col-start-1 col-span-12 md:col-span-3 row-start-3 md:row-start-2 rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_2px_4px_rgba(74,59,50,0.04),0_8px_24px_rgba(74,59,50,0.06)]"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-800 font-extrabold text-sm tracking-tight">My Quiltbook</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {projectCount !== null
                  ? `${projectCount} ${projectCount === 1 ? 'project' : 'projects'}`
                  : 'Your saved designs'}
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <path
                  d="M5 6h12a3 3 0 013 3v24c0-2-1.5-3.5-3.5-3.5H5V6z"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill="none"
                />
                <path
                  d="M35 6H23a3 3 0 00-3 3v24c0-2 1.5-3.5 3.5-3.5H35V6z"
                  stroke="#f97316"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="flex gap-1.5 mt-3">
              {projects.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex-1 aspect-square rounded-md bg-slate-100/80 overflow-hidden border border-white/80"
                >
                  {p.thumbnailUrl ? (
                    <Image
                      src={p.thumbnailUrl}
                      alt={p.name}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-slate-400 text-[10px] font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex gap-1.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 aspect-square rounded-md bg-slate-100/60 border border-dashed border-slate-200"
                />
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            {projects.length > 0
              ? `Last edited ${formatRelativeTime(projects[0].updatedAt)}`
              : 'No projects yet'}
          </p>
        </Link>

        {/* ── 4. Browse Patterns — col 4-5, row 2 ─────────────────── */}
        <button
          type="button"
          onClick={() => setActiveTab('patterns')}
          className="col-start-1 md:col-start-4 col-span-6 md:col-span-2 row-start-4 md:row-start-2 rounded-xl overflow-hidden relative transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-left bg-white/50 backdrop-blur-xl border border-white/60 shadow-[0_2px_4px_rgba(74,59,50,0.04),0_8px_24px_rgba(74,59,50,0.06)]"
        >
          <div className="h-[55%] relative overflow-hidden">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 200 120"
              preserveAspectRatio="xMidYMid slice"
              className="absolute inset-0"
            >
              {([0, 40, 80, 120, 160] as number[]).map((x, xi) =>
                ([0, 40, 80] as number[]).map((y, yi) => (
                  <g key={`${xi}-${yi}`}>
                    <polygon
                      points={`${x},${y} ${x + 40},${y} ${x},${y + 40}`}
                      fill="#FFB085"
                      opacity={(xi + yi) % 3 === 0 ? 0.85 : 0.5}
                    />
                    <polygon
                      points={`${x + 40},${y} ${x + 40},${y + 40} ${x},${y + 40}`}
                      fill="#C67B5C"
                      opacity={(xi + yi) % 2 === 0 ? 0.45 : 0.28}
                    />
                  </g>
                ))
              )}
            </svg>
          </div>
          <div className="p-3.5">
            <p className="text-slate-800 font-extrabold text-sm tracking-tight">Browse Patterns</p>
            <p className="text-slate-500 text-xs mt-0.5">Pre-made designs</p>
          </div>
        </button>

        {/* ── 5. Community — col 6-7, row 2 ───────────────────────── */}
        <Link
          href="/socialthreads"
          className="col-start-7 md:col-start-6 col-span-6 md:col-span-2 row-start-4 md:row-start-2 min-h-[140px] md:min-h-0 rounded-xl overflow-hidden relative transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 block"
        >
          <Image
            src="/images/quilts/quilt_03_closeup_scrappy.png"
            alt="Community"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3.5">
            <p className="text-white font-extrabold text-sm tracking-tight">Community</p>
            <p className="text-white/70 text-xs mt-0.5">Share &amp; discover</p>
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
