'use client';

import { useEffect } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  postTitle?: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, postTitle }: DeleteConfirmModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-slideIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5d5c5]">
          <h2 className="text-lg font-semibold text-gray-900">Delete Post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f9a06b]/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-red-50 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {/* Warning Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this post?
            </h3>
            <p className="text-sm text-gray-500">
              This action cannot be undone. The post will be permanently removed from your profile and feed.
            </p>
            {postTitle && (
              <div className="mt-4 p-3 bg-[#fdfaf7] rounded-xl border border-[#e5d5c5]">
                <p className="text-sm text-gray-600 line-clamp-2">{postTitle}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 p-4 border-t border-[#e5d5c5] bg-[#fdfaf7]">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-[#e5d5c5] hover:bg-[#f9a06b]/10 px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 transition-all duration-300 px-6"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Post
          </Button>
        </div>
      </div>
    </div>
  );
}
