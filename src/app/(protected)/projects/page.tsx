'use client';

import { useState, useEffect } from 'react';
import { Grid, List, Calendar, Plus, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

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
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-container rounded w-48"></div>
          <div className="h-12 bg-surface-container rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-surface-container rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with gradient accent */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-secondary text-xs font-bold uppercase tracking-[0.2em] mb-2">
            Projects
          </p>
          <h1
            className="text-on-surface text-4xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            My Quiltbook
          </h1>
          <p className="text-secondary mt-1 text-lg">
            {projects.length} {projects.length === 1 ? 'design' : 'designs'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-elevation-1"
          >
            <Plus size={18} />
            New Project
          </Link>
          <div className="flex items-center bg-surface-container-high rounded-full p-1 ml-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'grid'
                ? 'bg-primary text-white shadow-elevation-1'
                : 'text-secondary hover:text-on-surface'
                }`}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full transition-colors ${viewMode === 'list'
                ? 'bg-primary text-white shadow-elevation-1'
                : 'text-secondary hover:text-on-surface'
                }`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          {/* Decorative illustration */}
          <div className="relative mb-8">
            <div className="w-32 h-32 rounded-3xl bg-primary-container/40 flex items-center justify-center rotate-6 shadow-elevation-2">
              <div className="w-28 h-28 rounded-2xl bg-surface-container-lowest -rotate-6 flex items-center justify-center shadow-elevation-1 border border-outline-variant">
                <Grid size={36} className="text-primary" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-3">
              <Image
                src="/mascots&avatars/corgi12.png"
                alt=""
                width={56}
                height={56}
                className="drop-shadow-lg"
              />
            </div>
          </div>

          <h3
            className="text-2xl font-bold text-on-surface mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your quiltbook is empty
          </h3>
          <p className="text-secondary mb-8 max-w-sm text-center">
            Start a new project from a blank canvas, a template, or a photo of a quilt you love.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full font-semibold hover:opacity-90 transition-opacity shadow-elevation-1"
            >
              <Sparkles size={18} />
              Start Your First Quilt
            </Link>
          </div>
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
