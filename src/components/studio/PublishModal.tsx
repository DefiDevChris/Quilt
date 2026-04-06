'use client';

import { useState } from 'react';
import { X, Globe, Lock, Share2, Loader2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useAuthStore } from '@/stores/authStore';

interface PublishModalProps {
  onClose: () => void;
  onPublished?: (templateId: string) => void;
}

export function PublishModal({ onClose, onPublished }: PublishModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvas = useCanvasStore((s) => s.fabricCanvas);
  const projectId = useProjectStore((s) => s.projectId);
  const projectName = useProjectStore((s) => s.projectName);
  const user = useAuthStore((s) => s.user);

  const handlePublish = async () => {
    if (!canvas || !user) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const snapshotData = canvas.toJSON();
      const thumbnail = canvas.toDataURL({ format: 'png', quality: 0.8, multiplier: 0.3 });

      const res = await fetch('/api/templates/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim() || null,
          thumbnailUrl: thumbnail,
          snapshotData,
          isPublic,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to publish');
      }

      onPublished?.(json.data.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-elevation-4 p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-on-surface">Publish Template</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">
              Title <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={projectName || 'My Quilt Template'}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell others about your design..."
              rows={3}
              className="w-full px-3 py-2 bg-surface-container border border-outline-variant/30 rounded-lg text-on-surface placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex items-center gap-4 p-3 bg-surface-container rounded-lg">
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                isPublic
                  ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                  : 'bg-surface-container-high text-on-surface/60 hover:text-on-surface'
              }`}
            >
              <Globe size={18} />
              <span className="text-sm font-medium">Public</span>
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                !isPublic
                  ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white'
                  : 'bg-surface-container-high text-on-surface/60 hover:text-on-surface'
              }`}
            >
              <Lock size={18} />
              <span className="text-sm font-medium">Private</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-sm text-error">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-outline-variant/30 text-on-surface font-medium hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-rose-400 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 size={16} />
                  Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
