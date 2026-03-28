'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { MobileProjectDetail } from '@/components/mobile/MobileProjectDetail';

interface Project {
  id: string;
  name: string;
  thumbnailUrl: string | null;
  updatedAt: string;
  width: number | null;
  height: number | null;
  unit: string | null;
}

export function MobileProjectGallery() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        const json = await res.json();
        if (res.ok && json.data) {
          setProjects(json.data.projects ?? json.data);
        }
      } catch {
        // Empty state shown
      } finally {
        setIsLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (selectedProject) {
    return (
      <MobileProjectDetail
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-1 p-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square bg-surface-container animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 px-6">
        <p className="text-sm text-secondary">No projects yet.</p>
        <p className="text-xs text-outline-variant mt-1">Create your first design on desktop.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-1 p-1">
      {projects.map((project) => (
        <button
          key={project.id}
          type="button"
          onClick={() => setSelectedProject(project)}
          className="aspect-square relative overflow-hidden rounded bg-surface-container"
        >
          {project.thumbnailUrl ? (
            <Image
              src={project.thumbnailUrl}
              alt={project.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-2xl text-outline-variant">&#9632;</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-on-surface/60 to-transparent p-2 pt-6">
            <p className="text-xs font-semibold text-white truncate">{project.name}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
