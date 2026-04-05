'use client';

import { useState, useEffect } from 'react';
import { X, Download, Repeat2, Loader2, User } from 'lucide-react';
import NextImage from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { AuthGateModal } from '@/components/auth/AuthGateModal';

interface TemplateDetailModalProps {
  templateId: string;
  onClose: () => void;
}

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

export function TemplateDetailModal({ templateId, onClose }: TemplateDetailModalProps) {
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isRethreading, setIsRethreading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const fetchTemplate = async () => {
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
    };
    fetchTemplate();
  }, [templateId]);

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

      window.location.href = `/studio/${json.data.projectId}`;
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

      window.location.href = '/socialthreads';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rethread');
    } finally {
      setIsRethreading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-surface rounded-2xl p-6 m-4 max-w-md">
          <p className="text-error">{error || 'Template not found'}</p>
          <button onClick={onClose} className="btn-primary-xs mt-4">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="w-full max-w-4xl bg-surface rounded-2xl shadow-elevation-4 my-8">
          <div className="sticky top-0 bg-surface border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              {template.creator.avatarUrl ? (
                <NextImage
                  src={template.creator.avatarUrl}
                  alt={template.creator.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User size={20} className="text-primary" />
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
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {template.thumbnailUrl && (
              <div className="w-full aspect-video bg-surface-container rounded-xl overflow-hidden">
                <NextImage
                  src={template.thumbnailUrl}
                  alt={template.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-on-surface mb-2">{template.title}</h1>
              {template.description && <p className="text-on-surface/70">{template.description}</p>}
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
                className="flex-1 px-4 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
