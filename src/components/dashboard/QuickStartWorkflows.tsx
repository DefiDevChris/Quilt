'use client';

import { ScanLine, LayoutGrid, Plus } from 'lucide-react';

interface QuickStartWorkflowsProps {
  onPhotoToPattern: () => void;
  onStartFromTemplate: () => void;
  onBlankProject: () => void;
  isPro: boolean;
}

export function QuickStartWorkflows({
  onPhotoToPattern,
  onStartFromTemplate,
  onBlankProject,
  isPro,
}: QuickStartWorkflowsProps) {
  return (
    <section className="mb-8" aria-label="Quick start workflows">
      <h2 className="text-on-surface text-lg font-bold mb-4">Quick Start</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Photo to Pattern */}
        <button
          type="button"
          onClick={onPhotoToPattern}
          className="min-h-[44px] rounded-xl p-6 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1 glass-card border-white/50"
          aria-label="Photo to Pattern workflow"
        >
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <ScanLine size={120} strokeWidth={1} className="text-primary-dark" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full glass-inset flex items-center justify-center mb-4">
              <ScanLine size={32} className="text-primary-dark" />
            </div>
            {!isPro && (
              <span className="inline-block px-2 py-1 bg-primary/20 text-primary-dark text-caption font-extrabold uppercase tracking-widest rounded-full mb-2">
                Pro
              </span>
            )}
            <p className="text-on-surface font-extrabold text-xl tracking-tight mb-1">
              Photo to Pattern
            </p>
            <p className="text-secondary text-sm font-medium">
              Upload a quilt photo and extract blocks with AI
            </p>
          </div>
        </button>

        {/* Start from Template */}
        <button
          type="button"
          onClick={onStartFromTemplate}
          className="min-h-[44px] rounded-xl p-6 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1 glass-card border-white/50"
          aria-label="Start from template workflow"
        >
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
            <LayoutGrid size={120} strokeWidth={1} className="text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full glass-inset flex items-center justify-center mb-4">
              <LayoutGrid size={32} className="text-secondary" />
            </div>
            <p className="text-on-surface font-extrabold text-xl tracking-tight mb-1">
              Start from Template
            </p>
            <p className="text-secondary text-sm font-medium">
              Browse pre-made quilt patterns and blocks
            </p>
          </div>
        </button>

        {/* Blank Project */}
        <button
          type="button"
          onClick={onBlankProject}
          className="min-h-[44px] rounded-xl p-6 text-left relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-elevation-2 hover:-translate-y-1 glass-elevated border-white/60"
          aria-label="Create blank project workflow"
        >
          <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
            <Plus size={120} strokeWidth={2} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Plus size={32} className="text-white" strokeWidth={3} />
            </div>
            <p className="text-on-surface font-extrabold text-xl tracking-tight mb-1">
              Blank Project
            </p>
            <p className="text-secondary text-sm font-medium">
              Start with an empty canvas and design from scratch
            </p>
          </div>
        </button>
      </div>
    </section>
  );
}
