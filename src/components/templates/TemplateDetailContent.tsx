'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Repeat2, Loader2, User, X, ArrowLeft } from 'lucide-react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AuthGateModal } from '@/components/auth/AuthGateModal';

interface TemplateData {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  snapshotData: unknown;
  isPublic: boolean;
  addToQuiltbookCount: number;
  rethreadCount: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
    role: string;
  };
}

interface TemplateDetailContentProps {
  templateId: string;
  mode: 'modal' | 'page';
  onClose?: () => void;
}

export function TemplateDetailContent({ templateId, mode, onClose }: TemplateDetailContentProps) {
  const router = useRouter();
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRethreading, setIsRethreading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchTemplate = useCallback(async () => {
    try {
      const res = await fetch(`/api/templates/published/${templateId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to load template');
      setTemplate(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const handleAddToQuiltbook = async () => {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/templates/add-to-quiltbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to add');

      if (mode === 'modal') {
        window.location.href = `/studio/${json.data.projectId}`;
      } else {
        router.push(`/studio/${json.data.projectId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to quiltbook');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRethread = async () => {
    if (!user) {
      setAuthGateOpen(true);
      return;
    }

    setIsRethreading(true);
    try {
      const res = await fetch('/api/templates/rethread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to rethread');

      if (mode === 'modal') {
        window.location.href = '/socialthreads';
      } else {
        router.push('/socialthreads');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rethread');
    } finally {
      setIsRethreading(false);
    }
  };

  const handleClose = () => {
    if (mode === 'modal' && onClose) {
      onClose();
    } else if (mode === 'page') {
      router.back();
    }
  };

  if (isLoading) {
    return mode === 'modal' ? (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return mode === 'modal' ? (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-surface rounded-2xl p-6 m-4 max-w-md">
          <p className="text-error">{error || 'Template not found'}</p>
          <button onClick={onClose} className="btn-primary-xs mt-4">
            Close
          </button>
        </div>
      </div>
    ) : (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-6 max-w-md text-center">
          <p className="text-error mb-4">{error || 'Template not found'}</p>
          <button onClick={() => router.push('/socialthreads')} className="btn-primary-xs">
            Back to Social Threads
          </button>
        </div>
      </div>
    );
  }

  const containerClass =
    mode === 'modal'
      ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto'
      : 'min-h-screen bg-white';

  const contentClass =
    mode === 'modal'
      ? 'w-full max-w-4xl bg-surface rounded-2xl shadow-elevation-4 my-8'
      : 'max-w-5xl mx-auto px-4 py-8';

  const stickyHeaderClass =
    mode === 'modal'
      ? 'sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between rounded-t-2xl'
      : 'border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between';

  const imageWidth = mode === 'modal' ? 800 : 1200;
  const imageHeight = mode === 'modal' ? 450 : 675;
  const avatarSize = mode === 'modal' ? 40 : 48;
  const avatarIconSize = mode === 'modal' ? 20 : 24;
  const padding = mode === 'modal' ? 'p-6' : 'p-6';

  return (
    <>
      <div className={containerClass}>
        <div className={contentClass}>
          {mode === 'page' && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-on-surface/60 hover:text-on-surface mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
          )}

          <div className={stickyHeaderClass}>
            <div className="flex items-center gap-3">
              {template.creator.avatarUrl ? (
                <NextImage
                  src={template.creator.avatarUrl}
                  alt={template.creator.name}
                  width={avatarSize}
                  height={avatarSize}
                  className="rounded-full"
                />
              ) : (
                <div
                  className={`w-${avatarSize} h-${avatarSize} rounded-full bg-primary/20 flex items-center justify-center`}
                >
                  <User size={avatarIconSize} className="text-primary" />
                </div>
              )}
              <div>
                <a
                  href={`/profile/${template.creator.username || template.creator.id}`}
                  className="font-semibold text-on-surface hover:text-primary transition-colors"
                >
                  {template.creator.name}
                </a>
                <p className="text-xs text-on-surface/50">
                  {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {mode === 'modal' && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className={`${padding} space-y-6`}>
            {template.thumbnailUrl && (
              <div className="w-full aspect-video bg-surface-container rounded-xl overflow-hidden">
                <NextImage
                  src={template.thumbnailUrl}
                  alt={template.title}
                  width={imageWidth}
                  height={imageHeight}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div>
              <h1
                className={`${mode === 'modal' ? 'text-2xl' : 'text-3xl'} font-bold text-on-surface mb-2`}
              >
                {template.title}
              </h1>
              {template.description && (
                <p
                  className={`${mode === 'modal' ? '' : 'text-lg'} text-on-surface/70 leading-relaxed`}
                >
                  {template.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-on-surface/60">
              <span>{template.addToQuiltbookCount} added to quiltbook</span>
              <span>•</span>
              <span>{template.rethreadCount} rethreads</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToQuiltbook}
                disabled={isAdding}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-rose-400 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Add to Quiltbook
                  </>
                )}
              </button>
              <button
                onClick={handleRethread}
                disabled={isRethreading}
                className="flex-1 px-4 py-3 rounded-lg border border-outline-variant/30 text-on-surface font-medium hover:bg-surface-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRethreading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Rethreading...
                  </>
                ) : (
                  <>
                    <Repeat2 size={18} />
                    Rethread
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {authGateOpen && (
        <AuthGateModal isOpen={authGateOpen} onClose={() => setAuthGateOpen(false)} />
      )}
    </>
  );
}
