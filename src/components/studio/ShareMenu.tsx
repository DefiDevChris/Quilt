'use client';

import { useState, useRef, useEffect } from 'react';
import { Share2, MessageSquare, Link2, Twitter, Facebook } from 'lucide-react';
import { PublishModal } from './PublishModal';
import { ShareToThreadsModal } from './ShareToThreadsModal';

interface ShareMenuProps {
  onPublished?: (templateId: string) => void;
}

export function ShareMenu({ onPublished }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showThreadsModal, setShowThreadsModal] = useState(false);
  const [publishedTemplateId, setPublishedTemplateId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

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

  const handleCopyLink = async () => {
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
      label: 'Copy Link',
      icon: <Link2 size={16} />,
      action: handleCopyLink,
    },
    {
      label: 'Share to Twitter',
      icon: <Twitter size={16} />,
      action: () => {
        if (!publishedTemplateId) {
          setShowPublishModal(true);
          return;
        }
        const url = `${window.location.origin}/templates/${publishedTemplateId}`;
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`, '_blank');
        setOpen(false);
      },
    },
    {
      label: 'Share to Facebook',
      icon: <Facebook size={16} />,
      action: () => {
        if (!publishedTemplateId) {
          setShowPublishModal(true);
          return;
        }
        const url = `${window.location.origin}/templates/${publishedTemplateId}`;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        setOpen(false);
      },
    },
  ];

  return (
    <>
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-on-surface/70 hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <Share2 size={16} />
          Share
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-outline-variant/20 rounded-xl shadow-elevation-2 py-1.5 z-50">
            <button
              onClick={() => {
                setOpen(false);
                setShowPublishModal(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-primary hover:bg-surface-container-high transition-colors text-left"
            >
              <Share2 size={16} />
              Publish Template
            </button>
            <div className="h-px bg-outline-variant/20 my-1" />
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-on-surface/80 hover:bg-surface-container-high transition-colors text-left"
              >
                <span className="text-on-surface/50">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showPublishModal && (
        <PublishModal
          onClose={() => setShowPublishModal(false)}
          onPublished={handlePublished}
        />
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
