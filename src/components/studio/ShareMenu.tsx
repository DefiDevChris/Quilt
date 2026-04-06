'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, MessageSquare, Link2, Globe } from 'lucide-react';
import { PublishModal } from './PublishModal';
import { ShareToThreadsModal } from './ShareToThreadsModal';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/components/ui/ToastProvider';

interface ShareMenuProps {
  onPublished?: (templateId: string) => void;
}

export function ShareMenu({ onPublished }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const [publishedTemplateId, setPublishedTemplateId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [togglingPublic, setTogglingPublic] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const projectId = useProjectStore((s) => s.projectId);
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePublished = (templateId: string) => {
    setPublishedTemplateId(templateId);
    onPublished?.(templateId);
  };

  const handleShareToThreads = () => {
    setOpen(false);
    setShowThreadsModal(true);
  };

  const handleTogglePublic = async () => {
    if (!projectId || togglingPublic) return;
    setTogglingPublic(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
        toast({
          type: 'success',
          title: !isPublic ? 'Project is now public' : 'Project is now private',
          description: !isPublic
            ? 'Anyone with the link can view it.'
            : 'Only you can see this project.',
        });
      }
    } catch {
      toast({ type: 'error', title: 'Failed to update visibility' });
    } finally {
      setTogglingPublic(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!projectId) return;
    if (!isPublic) {
      toast({
        type: 'info',
        title: 'Make your project public first',
        description: 'Toggle "Public Link" to share this design.',
      });
      return;
    }
    const url = `${window.location.origin}/share/${projectId}`;
    await navigator.clipboard.writeText(url);
    toast({ type: 'success', title: 'Share link copied!' });
    setOpen(false);
  };

  const handleCopyTemplateLink = async () => {
    if (!publishedTemplateId) {
      setShowPublishModal(true);
      return;
    }
    const url = `${window.location.origin}/templates/${publishedTemplateId}`;
    await navigator.clipboard.writeText(url);
    setOpen(false);
  };

  const items = [
    {
      label: 'Share to Social Threads',
      icon: <MessageSquare size={16} />,
      action: handleShareToThreads,
    },
    {
      label: 'Copy Share Link',
      icon: <Link2 size={16} />,
      action: handleCopyShareLink,
    },
    {
      label: 'Copy Template Link',
      icon: <Link2 size={16} />,
      action: handleCopyTemplateLink,
    },
  ];

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-md font-medium text-on-surface/70 hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <Share2 size={16} />
          Share
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-outline-variant/20 rounded-xl shadow-elevation-2 py-1.5 z-50">
            <button
              onClick={() => {
                setOpen(false);
                setShowPublishModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-body-md font-medium text-primary hover:bg-surface-container-high transition-colors text-left"
            >
              <Share2 size={16} />
              Publish Template
            </button>
            <div className="h-px bg-outline-variant/20 my-1" />
            {/* Public Link toggle */}
            <button
              type="button"
              onClick={handleTogglePublic}
              disabled={togglingPublic}
              className="w-full flex items-center justify-between px-3 py-2 text-body-md text-on-surface/80 hover:bg-surface-container-high transition-colors text-left disabled:opacity-50"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-on-surface/50">
                  <Globe size={16} />
                </span>
                Public Link
              </span>
              <span
                className={`w-8 h-4.5 rounded-full relative transition-colors ${isPublic ? 'bg-primary' : 'bg-outline-variant'}`}
              >
                <span
                  className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-elevation-1 transition-transform ${isPublic ? 'translate-x-4' : 'translate-x-0.5'}`}
                />
              </span>
            </button>
            <div className="h-px bg-outline-variant/20 my-1" />
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-body-md text-on-surface/80 hover:bg-surface-container-high transition-colors text-left"
              >
                <span className="text-on-surface/50">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && (
        <PublishModal onClose={() => setShowPublishModal(false)} onPublished={handlePublished} />
      )}

      {showThreadsModal && (
        <ShareToThreadsModal
          templateId={publishedTemplateId}
          onClose={() => setShowThreadsModal(false)}
          onNeedPublish={() => {
            setShowThreadsModal(false);
            setShowPublishModal(true);
          }}
        />
      )}
    </>
  );
}
