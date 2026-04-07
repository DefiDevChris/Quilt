'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  LayoutTemplate,
  SquareDashedBottom,
  Grid3X3,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { BlockSizePicker } from './BlockSizePicker';
import { computeLayoutSize } from '@/lib/quilt-sizing';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';
import { LAYOUT_PRESETS } from '@/lib/layout-library';
import { cn } from '@/lib/cn';
import { useToast } from '@/components/ui/ToastProvider';

interface NewProjectWizardProps {
  open: boolean;
  onClose: () => void;
}

type PathType = 'scratch' | 'layout' | 'template';

export function NewProjectWizard({ open, onClose }: NewProjectWizardProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard State
  const [step, setStep] = useState(1);
  const [path, setPath] = useState<PathType | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuration State
  const [blockSize, setBlockSize] = useState(12);
  const [rotated, setRotated] = useState(false);
  const [presetId, setPresetId] = useState<string>(LAYOUT_PRESETS[0]?.id || '');
  const [scratchSize, setScratchSize] = useState(QUILT_SIZE_PRESETS[1]); // Default Throw

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  useEffect(() => {
    if (path === 'template' && templates.length === 0) {
      setIsLoadingTemplates(true);
      fetch('/api/templates')
        .then((res) => res.json())
        .then((data) => setTemplates(data.templates || []))
        .catch(() => setTemplates([]))
        .finally(() => setIsLoadingTemplates(false));
    }
  }, [path]);

  // Derived Values
  const activeLayout = LAYOUT_PRESETS.find((p) => p.id === presetId);
  const derivedSize = activeLayout
    ? computeLayoutSize(activeLayout, blockSize, rotated)
    : { width: scratchSize.width, height: scratchSize.height };

  if (!open) return null;

  const handleNext = () => {
    if (step === 1 && !path) return;
    if (step === 2 && path === 'template' && templates.length === 0) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for your project.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name,
        width: derivedSize.width,
        height: derivedSize.height,
      };

      if (path === 'layout') {
        payload.initialLayout = { presetId, blockSize, rotated };
      } else if (path === 'template') {
        // Placeholder for full template implementation - assuming first template for MVP
        if (templates[0]) {
          payload.initialTemplate = { templateId: templates[0].id, blockSize, rotated };
        }
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create project');
      const project = await res.json();

      onClose();
      router.push(`/studio/${project.id}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not create project.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-xl font-semibold text-white tracking-wide">
            {step === 1 && 'Choose a Starting Point'}
            {step === 2 && path === 'scratch' && 'Configure Canvas Size'}
            {step === 2 && path === 'layout' && 'Configure Layout'}
            {step === 2 && path === 'template' && 'Choose a Template'}
            {step === 3 && 'Name Your Project'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* STEP 1: PATH SELECTION */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setPath('template')}
                className={cn(
                  'flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200',
                  path === 'template'
                    ? 'bg-white/10 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-400/20 flex items-center justify-center mb-6">
                  <LayoutTemplate size={32} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Template</h3>
                <p className="text-sm text-white/60">
                  Full quilt designs including layout, blocks, and suggested fabrics.
                </p>
              </button>

              <button
                onClick={() => setPath('layout')}
                className={cn(
                  'flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200',
                  path === 'layout'
                    ? 'bg-white/10 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-400/20 flex items-center justify-center mb-6">
                  <Grid3X3 size={32} className="text-rose-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Layout</h3>
                <p className="text-sm text-white/60">
                  Structured skeletons. Choose rows, columns, and block sizes.
                </p>
              </button>

              <button
                onClick={() => setPath('scratch')}
                className={cn(
                  'flex flex-col items-center text-center p-8 rounded-2xl border-2 transition-all duration-200',
                  path === 'scratch'
                    ? 'bg-white/10 border-blue-500/50 shadow-[0_0_30_rgba(59,130,246,0.15)]'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                )}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-6">
                  <SquareDashedBottom size={32} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Scratch</h3>
                <p className="text-sm text-white/60">
                  An empty canvas. Total freedom to drag and drop anywhere.
                </p>
              </button>
            </div>
          )}

          {/* STEP 2: CONFIGURATION */}
          {step === 2 && path === 'scratch' && (
            <div className="space-y-6">
              <p className="text-white/70">
                Select standard quilt dimensions for your blank canvas.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {QUILT_SIZE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setScratchSize(preset)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      scratchSize.label === preset.label
                        ? 'bg-white/10 border-orange-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <div className="font-medium text-white">{preset.label}</div>
                    <div className="text-sm text-white/50">
                      {preset.width}″ × {preset.height}″
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && path === 'layout' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Choose Layout Skeleton
                  </label>
                  <select
                    value={presetId}
                    onChange={(e) => setPresetId(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {LAYOUT_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-3">Block Size</label>
                  <BlockSizePicker value={blockSize} onChange={setBlockSize} />
                </div>

                {activeLayout &&
                  activeLayout.config.rows &&
                  activeLayout.config.cols &&
                  activeLayout.config.rows !== activeLayout.config.cols && (
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={rotated}
                            onChange={(e) => setRotated(e.target.checked)}
                          />
                          <div
                            className={cn(
                              'w-10 h-6 rounded-full transition-colors',
                              rotated ? 'bg-orange-500' : 'bg-white/20'
                            )}
                          ></div>
                          <div
                            className={cn(
                              'absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform',
                              rotated ? 'translate-x-4' : ''
                            )}
                          ></div>
                        </div>
                        <span className="text-white/80 group-hover:text-white transition-colors">
                          Rotate 90° (Landscape)
                        </span>
                      </label>
                    </div>
                  )}
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center">
                <h4 className="text-lg font-medium text-white mb-2">Estimated Finished Size</h4>
                <div className="text-4xl font-light text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 mb-6">
                  {derivedSize.width}″ × {derivedSize.height}″
                </div>
                <div className="text-sm text-white/50 text-center max-w-xs">
                  This calculation includes blocks and structural elements like sashing and borders
                  defined by the skeleton.
                </div>
              </div>
            </div>
          )}

          {step === 2 && path === 'template' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              {isLoadingTemplates ? (
                <div className="animate-pulse text-white/60">Loading available templates...</div>
              ) : templates.length === 0 ? (
                <div className="space-y-4">
                  <LayoutTemplate size={48} className="mx-auto text-white/20" />
                  <h3 className="text-xl font-medium text-white">No templates yet</h3>
                  <p className="text-white/60">
                    The community hasn't published any full templates yet. Check back soon!
                  </p>
                </div>
              ) : (
                <div>{/* Future template selector logic goes here */}</div>
              )}
            </div>
          )}

          {/* STEP 3: CREATION */}
          {step === 3 && (
            <div className="max-w-md mx-auto space-y-6 py-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-light text-white mb-2">Give your project a name</h3>
                <p className="text-white/50">You can always change this later.</p>
              </div>

              <input
                type="text"
                autoFocus
                placeholder="My New Quilt"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-6 py-4 text-xl text-white text-center focus:outline-none focus:border-orange-500/50 shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-white/5">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!path || (step === 2 && path === 'template' && templates.length === 0)}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !name.trim()}
              className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-orange-500 to-rose-400 text-white rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg font-medium tracking-wide"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
