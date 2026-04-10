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
      <div className="space-y-6">
        <div className="h-8 bg-[#e8e1da] rounded-lg w-48"></div>
        <div className="h-12 bg-[#e8e1da] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-[#e8e1da] rounded-lg"></div>
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
            <div className="flex items-center bg-[#e8e1da] rounded-lg p-1 border border-[#e8e1da]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-150 ${viewMode === 'grid'
                  ? 'bg-[#ffffff] text-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                  : 'text-[#ffc8a6] hover:text-[#2d2a26]'
                  }`}
                title="Grid View"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-150 ${viewMode === 'list'
                  ? 'bg-[#ffffff] text-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                  : 'text-[#ffc8a6] hover:text-[#2d2a26]'
                  }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#ff8d49] text-[#2d2a26] rounded-lg font-medium text-sm hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
            >
              <Plus size={16} strokeWidth={3} />
              Create New
            </Link>
          </div>
        }
      />

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-32 text-center">
          <div className="w-24 h-24 rounded-lg bg-[#e8e1da] flex items-center justify-center mb-8 border border-[#e8e1da]">
            <Grid size={40} className="text-[#ffc8a6] opacity-50" />
          </div>

          <h3 className="text-3xl font-bold text-[#2d2a26] mb-3">
            The workspace is empty
          </h3>
          <p className="text-[#6b655e] mb-10 max-w-sm leading-relaxed">
            Begin your next creative journey by starting a new project or exploring studio templates.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#ff8d49] text-[#2d2a26] rounded-lg font-medium text-sm hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
              className={`group block ${viewMode === 'grid'
                ? 'bg-[#ffffff] border border-[#e8e1da] rounded-lg p-4 hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150'
                : 'bg-[#ffffff] border border-[#e8e1da] rounded-lg p-4 hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 flex items-center gap-4'
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
                    className="w-full h-full object-cover rounded-lg bg-[#e8e1da]"
                  />
                ) : (
                  <div className="w-full h-full bg-[#e8e1da] rounded-lg flex items-center justify-center">
                    <span className="text-[#ffc8a6]/50 font-bold text-lg">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-[#2d2a26] group-hover:text-[#ff8d49] transition-colors duration-150 line-clamp-2">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1 mt-2 text-xs text-[#6b655e]">
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
