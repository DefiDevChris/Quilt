'use client';

import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button, Textarea, Avatar } from './ui';

interface CreatePostProps {
  onPost?: (content: string, image?: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async () => {
    if (content.trim() || selectedImage) {
      setIsPosting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      onPost?.(content, selectedImage || undefined);
      setContent('');
      setSelectedImage(null);
      setIsFocused(false);
      setIsPosting(false);
    }
  };

  const handleImageSelect = () => {
    const images = [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=1200&h=800&fit=crop',
    ];
    setSelectedImage(images[Math.floor(Math.random() * images.length)]);
  };

  return (
    <div className={`bg-[var(--color-surface)] border rounded-2xl p-5 transition-all duration-150 ${
      isFocused ? 'border-[var(--color-primary)]/30 ring-2 ring-[var(--color-primary)]/10' : 'border-[var(--color-border)]'
    }`}>
      <div className="flex gap-3">
        <Avatar
          className="h-12 w-12 shrink-0 border-2 border-[var(--color-primary)]"
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
          fallback="SM"
        />
        <div className="flex-1">
          <div className="bg-[var(--color-bg)] rounded-2xl p-4">
            <Textarea
              placeholder="What's on your mind, Sarah?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="min-h-[80px] resize-none border-none bg-transparent text-base placeholder:text-[var(--color-text-dim)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
          {selectedImage && (
            <div className="relative mt-3 mx-3 mb-3 rounded-xl overflow-hidden">
              <img src={selectedImage} alt="Selected" className="w-full h-48 object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1.5 bg-[var(--color-text)]/50 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
            <Button variant="ghost" size="sm" onClick={handleImageSelect} className="text-[var(--color-primary)] h-9 rounded-full">
              <ImagePlus className="h-4 w-4 mr-1.5" />
              Photo
            </Button>
            <Button onClick={handleSubmit} disabled={(!content.trim() && !selectedImage) || isPosting} className="bg-[var(--color-primary)] text-white rounded-full h-9 px-6 text-sm font-medium hover:bg-[#e67d3f] disabled:opacity-40">
              {isPosting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
