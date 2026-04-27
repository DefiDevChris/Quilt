'use client';

/**
 * ProjectCard — minimal card for the projects list / grid view.
 *
 * The card surface follows the design system (rounded-lg, surface bg,
 * default border). It links into the studio for the given project and
 * exposes a single onUpdate callback that the parent uses to refresh
 * the list after destructive actions (deletes, renames, etc.). For now
 * the card is read-only — destructive flows are queued as a follow-up.
 */

import Link from 'next/link';
import { useMemo } from 'react';
import type { Project } from '@/types/project';

interface ProjectCardProps {
  project: Project;
  viewMode: 'grid' | 'list';
  onUpdate?: () => void;
}

export function ProjectCard({ project, viewMode }: ProjectCardProps) {
  const lastSaved = useMemo(() => {
    const d = new Date(project.lastSavedAt);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }, [project.lastSavedAt]);

  const sizeLabel = `${project.canvasWidth}″ × ${project.canvasHeight}″`;

  if (viewMode === 'list') {
    return (
      <Link
        href={`/studio/${project.id}`}
        className="flex items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors duration-150 hover:border-[var(--color-primary)]"
      >
        <div className="w-16 h-16 rounded-md overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]/40 flex-shrink-0">
          {project.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.thumbnailUrl}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
            {project.name}
          </h3>
          <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
            {sizeLabel} · {project.mode} · saved {lastSaved}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/studio/${project.id}`}
      className="group flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-colors duration-150 hover:border-[var(--color-primary)]"
    >
      <div className="aspect-square bg-[var(--color-bg)] border-b border-[var(--color-border)]/40">
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)] truncate">
          {project.name}
        </h3>
        <p className="text-xs text-[var(--color-text-dim)] mt-0.5">
          {sizeLabel} · {project.mode}
        </p>
        <p className="text-[10px] text-[var(--color-text-dim)]/70 mt-1">
          Saved {lastSaved}
        </p>
      </div>
    </Link>
  );
}
