'use client';

import Image from 'next/image';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  width: number | null;
  height: number | null;
  unit: string | null;
}

interface MobileProjectDetailProps {
  project: Project;
  onBack: () => void;
}

export function MobileProjectDetail({ project, onBack }: MobileProjectDetailProps) {
  const formattedDate = new Date(project.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dimensions =
    project.width && project.height
      ? `${project.width} x ${project.height} ${project.unit ?? 'in'}`
      : null;

  return (
    <div>
      <div className="px-5 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
      </div>
      {project.thumbnailUrl ? (
        <div className="relative w-full aspect-square bg-surface-container">
          <Image
            src={project.thumbnailUrl}
            alt={project.name}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full aspect-square bg-surface-container flex items-center justify-center">
          <span className="text-4xl text-outline-variant">&#9632;</span>
        </div>
      )}
      <div className="px-5 py-6">
        <h2 className="text-lg font-bold text-on-surface">{project.name}</h2>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Last edited {formattedDate}
          </div>
          {dimensions && (
            <div className="flex items-center gap-2 text-sm text-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              {dimensions}
            </div>
          )}
        </div>
        <p className="mt-6 text-xs text-outline-variant text-center">
          Open on desktop to edit this design
        </p>
      </div>
    </div>
  );
}
