'use client';

import { useState, useEffect } from 'react';
import { Search, Grid, List, Calendar } from 'lucide-react';
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
  const [filteredProjects, setFilteredProjects] = useState<ProjectListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        const res = await fetch('/api/projects?limit=100&sort=updatedAt&order=desc');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setProjects(data.data.projects);
        setFilteredProjects(data.data.projects);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user]);

  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

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
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">All Projects</h1>
          <p className="text-secondary mt-1">{filteredProjects.length} designs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-surface-container text-secondary hover:text-on-surface'
            }`}
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-surface-container text-secondary hover:text-on-surface'
            }`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={20} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-container flex items-center justify-center">
            <Grid size={32} className="text-secondary" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">
            {searchQuery ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-secondary mb-6">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first quilt design to get started'}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            Start Designing
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
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/studio/${project.id}`}
              className={`group block ${
                viewMode === 'grid'
                  ? 'glass-card border border-white/40 rounded-xl p-4 hover:shadow-elevation-2 transition-all'
                  : 'glass-card border border-white/40 rounded-xl p-4 hover:shadow-elevation-2 transition-all flex items-center gap-4'
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
