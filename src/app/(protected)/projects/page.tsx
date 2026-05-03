'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatRelative } from '@/lib/date-utils';

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/projects?limit=24&sort=updatedAt&order=desc', {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error('failed');
        const json: ProjectsResponse = await res.json();
        setProjects(json.data.projects ?? []);
        setTotal(json.data.pagination?.total ?? 0);
      } catch {
        if (!controller.signal.aborted) setProjects([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <>
      <PageHeader
        label="Workbench"
        title="My Projects"
        description={`${total} ${total === 1 ? 'project' : 'projects'} in your studio`}
        action={
          <Link href="/studio" className="btn-primary gap-2">
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
              className="aspect-[4/3] rounded-lg animate-pulse border border-[var(--color-border)]/10 bg-[var(--color-border)]/50"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="py-24 text-center">
          <div className="mb-6">
            <img
              src="/icons/quilt-projects.png"
              alt="Projects"
              width={96}
              height={96}
              className="mx-auto opacity-20"
            />
          </div>
          <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
            No projects yet
          </h3>
          <p className="text-body-md text-[var(--color-text-dim)] max-w-sm mx-auto mb-6">
            Start your first quilt design and it will appear here.
          </p>
          <Link href="/studio" className="btn-primary gap-2 px-6 py-3">
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
              className="group card overflow-hidden transition-colors duration-150 hover:border-[var(--color-primary-hover)]"
            >
              <div className="aspect-[4/3] relative overflow-hidden bg-[var(--color-border)]/20">
                {p.thumbnailUrl ? (
                  <img
                    src={p.thumbnailUrl}
                    alt={p.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-dim)]">
                      No Preview
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-[var(--color-text)]">
                    {p.name}
                  </p>
                  <p className="text-[11px] mt-1 text-[var(--color-text-dim)]">
                    Updated {formatRelative(p.updatedAt)}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-primary)]"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
