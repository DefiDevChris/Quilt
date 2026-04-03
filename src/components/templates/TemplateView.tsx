'use client';

import { useState, useEffect } from 'react';
import { Download, Repeat2, Loader2, User, ArrowLeft } from 'lucide-react';
import NextImage from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { AuthGateModal } from '@/components/auth/AuthGateModal';

interface TemplateViewProps {
  templateId: string;
}

interface TemplateData {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  snapshotData: any;
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

export function TemplateView({ templateId }: TemplateViewProps) {
  const router = useRouter();
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
        const res = await fetch(`/api/templates/${templateId}`);
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

      router.push(`/studio/${json.data.projectId}`);
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

      router.push('/socialthreads');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rethread');
    } finally {
      setIsRethreading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface">
          <Loader2 size={24} className="animate-spin" />
          <span>Loading template...</span>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl p-6 max-w-md text-center">
          <p className="text-error mb-4">{error || 'Template not found'}</p>
          <button
            onClick={() => router.push('/socialthreads')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Back to Social Threads
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-on-surface/60 hover:text-on-surface mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="bg-surface rounded-2xl shadow-elevation-2 overflow-hidden">
            <div className="border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {template.creator.avatarUrl ? (
                  <NextImage
                    src={template.creator.avatarUrl}
                    alt={template.creator.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                )}
                <div>
                  <a
                    href={`/profile/${template.creator.username || template.creator.id}`}
                    className="font-semibold text-on-surface hover:text-primary transition-colors"
                  >
                    {template.creator.name}
                  </a>
                  <p className="text-sm text-on-surface/50">
                    {new Date(template.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {template.thumbnailUrl && (
                <div className="w-full aspect-video bg-surface-container rounded-xl overflow-hidden">
                  <NextImage
                    src={template.thumbnailUrl}
                    alt={template.title}
                    width={1200}
                    height={675}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div>
                <h1 className="text-3xl font-bold text-on-surface mb-3">{template.title}</h1>
                {template.description && (
                  <p className="text-lg text-on-surface/70 leading-relaxed">{template.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-on-surface/60">
                <span>{template.addToQuiltbookCount} added to quiltbook</span>
                <span>•</span>
                <span>{template.rethreadCount} rethreads</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleAddToQuiltbook}
                  disabled={isAdding}
                  className="flex-1 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      Add to Quiltbook
                    </>
                  )}
                </button>
                <button
                  onClick={handleRethread}
                  disabled={isRethreading}
                  className="flex-1 px-6 py-3 rounded-lg border-2 border-outline-variant/30 text-on-surface font-semibold hover:bg-surface-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isRethreading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Rethreading...
                    </>
                  ) : (
                    <>
                      <Repeat2 size={20} />
                      Rethread
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {authGateOpen && <AuthGateModal onClose={() => setAuthGateOpen(false)} />}
    </>
  );
}
