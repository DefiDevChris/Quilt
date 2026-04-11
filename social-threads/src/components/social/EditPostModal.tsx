'use client';

import { useState, useEffect } from 'react';
import { X, ImagePlus, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Post } from '@/types/social';
import { cn } from '@/lib/utils';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onSave: (postId: string, content: string, image?: string) => void;
}

function EditPostModalContent({ post, onClose, onSave }: { 
  post: Post; 
  onClose: () => void; 
  onSave: (postId: string, content: string, image?: string) => void;
}) {
  const [content, setContent] = useState(post.content);
  const [image, setImage] = useState(post.image);
  const [isSaving, setIsSaving] = useState(false);

  const charCount = content.length;

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setContent(text);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    onSave(post.id, content, image);
    setIsSaving(false);
    onClose();
  };

  const handleRemoveImage = () => {
    setImage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slideIn overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5d5c5]">
          <h2 className="text-lg font-semibold text-gray-900">Edit Post</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#f9a06b]/10 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10 border-2 border-[#f9a06b]">
              <AvatarImage src={post.user.avatar} />
              <AvatarFallback>{post.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{post.user.name}</p>
              <p className="text-xs text-gray-500">@{post.user.username}</p>
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind?"
              className={cn(
                "w-full min-h-[120px] p-3 bg-[#fdfaf7] rounded-xl border border-[#e5d5c5] resize-none focus:outline-none focus:ring-2 focus:ring-[#f9a06b]/20 focus:border-[#f9a06b] transition-all",
                charCount > 450 && "border-orange-300"
              )}
            />
            <span className={cn(
              "absolute bottom-2 right-2 text-xs",
              charCount > 450 ? "text-orange-500" : "text-gray-400"
            )}>
              {charCount}/500
            </span>
          </div>

          {/* Image Preview */}
          {image && (
            <div className="mt-4 relative group">
              <img
                src={image}
                alt="Post preview"
                className="w-full h-48 object-cover rounded-xl"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Image Upload */}
          <div className="mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-[#fdfaf7] rounded-xl border border-dashed border-[#e5d5c5] hover:border-[#f9a06b] hover:bg-[#f9a06b]/5 transition-all">
                <ImagePlus className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{image ? 'Change image' : 'Add image'}</span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#e5d5c5] bg-[#fdfaf7]">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-[#e5d5c5] hover:bg-[#f9a06b]/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!content.trim() || isSaving}
            className="bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] hover:from-[#f9a06b]/90 hover:to-[#ffc8a6]/90 text-white rounded-xl shadow-lg shadow-[#f9a06b]/20 transition-all duration-300 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function EditPostModal({ isOpen, onClose, post, onSave }: EditPostModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Use key to reset component state when post changes
  return <EditPostModalContent key={post.id} post={post} onClose={onClose} onSave={onSave} />;
}
