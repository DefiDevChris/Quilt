'use client';

import { useState, useEffect } from 'react';
import { Grid, List, Calendar, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import { COLORS, COLORS_HOVER, SHADOW, MOTION, OPACITY } from '@/lib/design-system';

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
      <div className="space-y-6">
        <div className="h-8 rounded-lg w-48" style={{ backgroundColor: COLORS.border }}></div>
        <div className="h-12 rounded-lg" style={{ backgroundColor: COLORS.border }}></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg" style={{ backgroundColor: COLORS.border }}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <BrandedPage showMascots mascotCount={1}>
      <PageHeader
        label="Archive"
        title="Project Library"
        description={`${projects.length} ${projects.length === 1 ? 'curated design' : 'curated designs'}`}
        action={
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-lg p-1" style={{ backgroundColor: COLORS.border }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-colors`}
                style={{
                  transitionDuration: `${MOTION.transitionDuration}ms`,
                  transitionTimingFunction: MOTION.transitionEasing,
                  ...(viewMode === 'grid'
                    ? { backgroundColor: COLORS.surface, color: COLORS.primary, boxShadow: SHADOW.brand }
                    : { color: COLORS.secondary }
                  ),
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'grid') {
                    (e.currentTarget as HTMLButtonElement).style.color = COLORS.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'grid') {
                    (e.currentTarget as HTMLButtonElement).style.color = COLORS.secondary;
                  }
                }}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-full transition-colors`}
                style={{
                  transitionDuration: `${MOTION.transitionDuration}ms`,
                  transitionTimingFunction: MOTION.transitionEasing,
                  ...(viewMode === 'list'
                    ? { backgroundColor: COLORS.surface, color: COLORS.primary, boxShadow: SHADOW.brand }
                    : { color: COLORS.secondary }
                  ),
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 'list') {
                    (e.currentTarget as HTMLButtonElement).style.color = COLORS.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 'list') {
                    (e.currentTarget as HTMLButtonElement).style.color = COLORS.secondary;
                  }
                }}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-colors"
              style={{
                backgroundColor: COLORS.primary,
                color: COLORS.text,
                boxShadow: SHADOW.brand,
                transitionDuration: `${MOTION.transitionDuration}ms`,
                transitionTimingFunction: MOTION.transitionEasing,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = COLORS_HOVER.primary;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = COLORS.primary;
              }}
            >
              <Plus size={16} strokeWidth={3} />
              Create New
            </Link>
          </div>
        }
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-32 text-center">
          <div className="mb-6">
            <QuiltPieceRow count={3} size={10} gap={4} className="mb-8" />
          </div>
          <h3 className="text-headline-sm font-semibold text-[var(--color-text)] mb-3">
            No projects yet
          </h3>
          <p className="text-body-md text-[var(--color-text-dim)] mb-10 max-w-sm leading-relaxed">
            Start your first quilt design and build your collection of curated patterns.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium text-sm transition-colors"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.text,
              boxShadow: SHADOW.brand,
              transitionDuration: `${MOTION.transitionDuration}ms`,
              transitionTimingFunction: MOTION.transitionEasing,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = COLORS_HOVER.primary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = COLORS.primary;
            }}
          >
            <Plus size={20} strokeWidth={3} />
            Start Your First Quilt
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
              className={`group block transition-colors ${viewMode === 'grid'
                ? 'rounded-lg p-4'
                : 'rounded-lg p-4 flex items-center gap-4'
                }`}
              style={{
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                transitionDuration: `${MOTION.transitionDuration}ms`,
                transitionTimingFunction: MOTION.transitionEasing,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = SHADOW.brand;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
              }}
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
                    className="w-full h-full object-cover rounded-lg"
                    style={{ backgroundColor: COLORS.border }}
                  />
                ) : (
                  <div className="w-full h-full rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.border }}>
                    <span style={{ color: COLORS.secondary, opacity: OPACITY.disabled }} className="font-bold text-lg">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3
                  className="font-bold transition-colors line-clamp-2"
                  style={{
                    color: COLORS.text,
                    transitionDuration: `${MOTION.transitionDuration}ms`,
                    transitionTimingFunction: MOTION.transitionEasing,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLHeadingElement).style.color = COLORS.primary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLHeadingElement).style.color = COLORS.text;
                  }}
                >
                  {project.name}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: COLORS.textDim }}>
                  <Calendar size={12} />
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BrandedPage>
  );
}
