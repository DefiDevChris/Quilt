'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  thumbnailUrl?: string | null;
}

export function ShareDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  thumbnailUrl,
}: ShareDialogProps) {
  const isPro = useAuthStore((s) => s.isPro);
  const [title, setTitle] = useState(projectName);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  if (!isPro) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-elevation-3 mx-4">
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-container px-3 py-1 text-sm font-medium text-primary mb-2">
              Pro Feature
            </span>
            <p className="text-sm text-secondary mb-4">
              Upgrade to Pro to share your designs with the community.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? 'Failed to share design');
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch {
      setError('Failed to share design. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-elevation-3 mx-4">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Share to Community</h2>

        {thumbnailUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border border-outline-variant">
            <Image
              src={thumbnailUrl}
              alt="Design preview"
              width={400}
              height={300}
              className="w-full h-auto object-cover"
              unoptimized
            />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="share-title" className="block text-sm font-medium text-on-surface mb-1">
              Title <span className="text-error">*</span>
            </label>
            <input
              id="share-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={255}
              required
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Give your design a name"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="share-description"
              className="block text-sm font-medium text-on-surface mb-1"
            >
              Description
            </label>
            <textarea
              id="share-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Tell the community about your design..."
            />
            <p className="text-[10px] text-secondary mt-1">{description.length}/2000</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-error/30 bg-error/5 px-3 py-2">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md bg-surface-container px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Sharing...' : 'Share to Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
