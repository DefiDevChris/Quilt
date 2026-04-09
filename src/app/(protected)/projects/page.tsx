'use client';

import { useState, useEffect } from 'react';
import { Grid, List, Calendar, Plus, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/ui/PageHeader';

interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  updatedAt: string;
  createdAt: string;
}

export default function AllProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        const res = await fetch('/api/projects?limit=50&sort=updatedAt&order=desc');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setProjects(data.data.projects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-surface-container rounded w-48"></div>
        <div className="h-12 bg-surface-container rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-surface-container rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        label="Archive"
        title="Project Library"
        description={`${projects.length} ${projects.length === 1 ? 'curated design' : 'curated designs'}`}
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-high rounded-full p-1 border border-outline-variant">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary shadow-elevation-1'
                    : 'text-secondary hover:text-on-surface'
                }`}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-primary shadow-elevation-1'
                    : 'text-secondary hover:text-on-surface'
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-on-surface text-surface rounded-full font-black text-xs uppercase tracking-widest hover:bg-on-surface/90 transition-all shadow-elevation-2 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} />
              Create New
            </Link>
          </div>
        }
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-32 text-center">
          <div className="w-24 h-24 rounded-3xl bg-surface-container-high flex items-center justify-center mb-8 border border-outline-variant rotate-3">
            <Grid size={40} className="text-secondary opacity-50 -rotate-3" />
          </div>

          <h3 className="text-3xl font-black text-on-surface mb-3 tracking-tight">
            The workspace is empty
          </h3>
          <p className="text-secondary mb-10 max-w-sm font-medium leading-relaxed">
            Begin your next creative journey by starting a new project or exploring studio templates.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 bg-on-surface text-surface rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all shadow-elevation-3"
          >
            <Plus size={20} strokeWidth={3} />
            Initialize Blank Canvas
          </Link>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6'
              : 'space-y-4'
          }
        >
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/studio/${project.id}`}
              className={`group block ${
                viewMode === 'grid'
                  ? 'glass-panel rounded-xl p-4 hover:shadow-elevation-2 transition-all'
                  : 'glass-panel rounded-xl p-4 hover:shadow-elevation-2 transition-all flex items-center gap-4'
              }`}
            >
              <div
                className={viewMode === 'grid' ? 'aspect-square mb-4' : 'w-16 h-16 flex-shrink-0'}
              >
                {project.thumbnailUrl ? (
                  <Image
                    src={project.thumbnailUrl}
                    alt={project.name}
                    width={viewMode === 'grid' ? 200 : 64}
                    height={viewMode === 'grid' ? 200 : 64}
                    className="w-full h-full object-cover rounded-lg bg-surface-container"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container rounded-lg flex items-center justify-center">
                    <span className="text-secondary/50 font-extrabold text-lg">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-secondary">
                  <Calendar size={12} />
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
