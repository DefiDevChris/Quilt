'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import { COLORS, SHADOW, MOTION } from '@/lib/design-system';

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  mode: string;
  unitSystem: string;
  lastSavedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: ProjectItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return 'today';
  if (diff < 2 * day) return 'yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/projects?limit=24&sort=updatedAt&order=desc');
        if (!res.ok) throw new Error('failed');
        const json: ProjectsResponse = await res.json();
        if (cancelled) return;
        setProjects(json.data.projects ?? []);
        setTotal(json.data.pagination?.total ?? 0);
      } catch {
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        label="Workbench"
        title="My Projects"
        description={`${total} ${total === 1 ? 'project' : 'projects'} in your studio`}
        action={
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Project
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg animate-pulse border"
              style={{ backgroundColor: `${COLORS.border}80`, borderColor: `${COLORS.border}1a` }}
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mb-6">
            <QuiltPieceRow count={3} size={10} gap={4} className="mb-8" />
          </div>
          <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
            No projects yet
          </h3>
          <p className="text-body-md text-[var(--color-text-dim)] max-w-sm mx-auto mb-6">
            Start your first quilt design and it will appear here.
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            Start a Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/studio/${p.id}`}
              className="group rounded-lg border overflow-hidden transition-colors"
              style={{
                borderColor: `${COLORS.border}4d`,
                backgroundColor: COLORS.surface,
                transitionDuration: `${MOTION.transitionDuration}ms`,
              }}
            >
              <div
                className="aspect-[4/3] relative overflow-hidden"
                style={{ backgroundColor: `${COLORS.border}33` }}
              >
                {p.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: COLORS.textDim }}>
                      No Preview
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.text }}>
                    {p.name}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: COLORS.textDim }}>
                    Updated {formatRelative(p.updatedAt)}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: COLORS.primary }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
