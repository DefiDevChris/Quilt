'use client';

import { useState, useEffect } from 'react';
import { Grid, List, Plus } from 'lucide-react';
import { COLORS, SHADOW, MAX_WIDTHS, withAlpha } from '@/lib/design-system';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { Project } from '@/types/project';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data.data.projects);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: COLORS.bg }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-normal mb-1"
            style={{ fontFamily: 'var(--font-heading)', color: COLORS.text }}
          >
            Recent Quilts
          </h1>
          <p className="text-sm" style={{ color: COLORS.textDim }}>
            {projects.length} project {projects.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center rounded-lg border p-1"
            style={{ borderColor: withAlpha(COLORS.border, 0.6) }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className="p-1.5 rounded-md transition-colors"
              style={{
                backgroundColor: viewMode === 'grid' ? COLORS.primary : 'transparent',
              }}
              aria-label="Grid view"
            >
              <Grid size={16} style={{ color: viewMode === 'grid' ? COLORS.text : COLORS.textDim }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className="p-1.5 rounded-md transition-colors"
              style={{
                backgroundColor: viewMode === 'list' ? COLORS.primary : 'transparent',
              }}
              aria-label="List view"
            >
              <List size={16} style={{ color: viewMode === 'list' ? COLORS.text : COLORS.textDim }} />
            </button>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5AA0D5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Quilt
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div
            className="w-8 h-8 rounded-full animate-pulse"
            style={{ backgroundColor: withAlpha(COLORS.primary, 0.2) }}
          />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ backgroundColor: withAlpha(COLORS.primary, 0.1) }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              style={{ color: COLORS.primary }}
            >
              <path
                d="M3 4h6v6H3zM9 4h6v6H9zM15 4h6v6h-6zM3 10h6v6H3zM9 10h6v6H9zM15 10h6v6h-6zM3 16h6v6H3zS9 16h6v6h6zM15 16h6v6h-6z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <h2
            className="text-xl mb-2"
            style={{ fontFamily: 'var(--font-heading)', color: COLORS.text }}
          >
            No quilts yet
          </h2>
          <p className="text-sm mb-6 max-w-xs" style={{ color: COLORS.textDim }}>
            Create your first quilt design to get started.
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#5AA0D5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Quilt
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          style={{ maxWidth: MAX_WIDTHS.content }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode="grid"
              onUpdate={fetchProjects}
            />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col gap-3"
          style={{ maxWidth: MAX_WIDTHS.content }}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              viewMode="list"
              onUpdate={fetchProjects}
            />
          ))}
        </div>
      )}
    </div>
  );
}
