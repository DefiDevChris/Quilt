'use client';

import { useEffect, useState } from 'react';
import { X, Copy, Twitter, Facebook, Linkedin, Mail, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Post } from '@/types/social';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

export function ShareModal({ isOpen, onClose, post }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

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

  const shareUrl = 'https://socialfeed.app/post/' + post.id;
  const shareText = post.content.slice(0, 100) + '...';

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#e5d5c5]">
          <h2 className="text-xl font-semibold text-gray-900">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f9a06b]/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex gap-3 p-3 bg-[#fdfaf7] rounded-xl mb-6">
            <img
              src={post.image}
              alt="Post preview"
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">{post.user.name}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{post.content}</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-6">
            <a
              href={'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText) + '&url=' + encodeURIComponent(shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all duration-300 hover:scale-105 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
            >
              <Twitter className="h-6 w-6" />
              <span className="text-xs font-medium">Twitter</span>
            </a>
            <a
              href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all duration-300 hover:scale-105 bg-[#4267B2] hover:bg-[#365899]"
            >
              <Facebook className="h-6 w-6" />
              <span className="text-xs font-medium">Facebook</span>
            </a>
            <a
              href={'https://www.linkedin.com/shareArticle?mini=true&url=' + encodeURIComponent(shareUrl) + '&title=' + encodeURIComponent(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all duration-300 hover:scale-105 bg-[#0077B5] hover:bg-[#006399]"
            >
              <Linkedin className="h-6 w-6" />
              <span className="text-xs font-medium">LinkedIn</span>
            </a>
            <a
              href={'mailto:?subject=' + encodeURIComponent('Check out this post') + '&body=' + encodeURIComponent(shareText + '\n\n' + shareUrl)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all duration-300 hover:scale-105 bg-gray-600 hover:bg-gray-700"
            >
              <Mail className="h-6 w-6" />
              <span className="text-xs font-medium">Email</span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-[#fdfaf7] rounded-xl border border-[#e5d5c5]">
              <Link2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 truncate">{shareUrl}</span>
            </div>
            <Button
              onClick={handleCopyLink}
              className={copied ? 'bg-green-500 hover:bg-green-500 text-white px-4 py-3 rounded-xl' : 'bg-[#f9a06b] hover:bg-[#f9a06b]/90 text-white px-4 py-3 rounded-xl'}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
