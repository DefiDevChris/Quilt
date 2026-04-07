'use client';

import React, { useState } from 'react';
import { Plus, Rocket, BookOpen, Clock } from 'lucide-react';
import { NewProjectWizard } from '../projects/NewProjectWizard';
import { Project } from '@/types/project';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/format-time';

interface QuickStartWorkflowsProps {
  recentProjects?: Project[];
}

export function QuickStartWorkflows({ recentProjects = [] }: QuickStartWorkflowsProps) {
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Actions */}
      <div className="space-y-4 flex flex-col h-full">
        <button
          onClick={() => setWizardOpen(true)}
          className="group relative overflow-hidden flex flex-col justify-end p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-rose-400/10 hover:from-orange-500/20 hover:to-rose-400/20 transition-all duration-300 min-h-[160px] text-left"
        >
          <div className="absolute top-6 right-6 w-12 h-12 bg-gradient-to-r from-orange-500 to-rose-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Plus size={24} className="text-white" />
          </div>
          <h3 className="text-2xl font-light text-white mb-2 group-hover:text-orange-400 transition-colors">
            Start New Project
          </h3>
          <p className="text-white/60 max-w-[80%]">
            Launch the studio wizard and begin your next quilt from scratch, a structured layout, or
            a template.
          </p>
        </button>

        <Link
          href="/fabrics"
          className="group relative overflow-hidden flex items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
        >
          <div>
            <h3 className="text-lg font-medium text-white mb-1 group-hover:text-rose-400 transition-colors">
              Fabric Library
            </h3>
            <p className="text-sm text-white/50">Upload and manage your custom stashes.</p>
          </div>
          <BookOpen className="text-white/20 group-hover:text-rose-400/50 transition-colors" />
        </Link>
      </div>

      {/* Right Column - Resume Recent */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Clock size={18} className="text-orange-400" /> Resume Working
          </h3>
          <Link
            href="/projects"
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            View Quiltbook →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
            <Rocket size={32} className="text-white/20 mb-4" />
            <p className="text-white/60">No recent projects. Time to start stitching!</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
            {recentProjects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/studio/${project.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-transparent hover:border-white/10 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                    {/* Placeholder for thumbnail */}
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium group-hover:text-orange-400 transition-colors truncate max-w-[180px]">
                      {project.name}
                    </h4>
                    <p className="text-xs text-white/40">
                      {project.updatedAt
                        ? formatRelativeTime(new Date(project.updatedAt))
                        : 'Recently'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <NewProjectWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
}
