'use client';

import { useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CreatePostProps {
  onPost?: (content: string, image?: string) => void;
}

export function CreatePost({ onPost }: CreatePostProps) {
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async () => {
    if (content.trim() || selectedImage) {
      setIsPosting(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      onPost?.(content, selectedImage || undefined);
      setContent('');
      setSelectedImage(null);
      setIsExpanded(false);
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
    <div className="bg-[#ffffff] border border-[var(--color-border)] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-5">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-[#fdfaf7] rounded-lg p-3">
            <Textarea
              placeholder="What's on your mind, Sarah?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className="min-h-[50px] resize-none border-none bg-transparent text-sm placeholder:text-[var(--color-text-dim)] focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
          {selectedImage && (
            <div className="relative mt-3 rounded-lg overflow-hidden">
              <img src={selectedImage} alt="Selected" className="w-full h-48 object-cover" />
              <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 p-1 bg-[var(--color-text)]/50 rounded-full text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {isExpanded && (
            <div className="flex items-center justify-between mt-3">
              <Button variant="ghost" size="sm" onClick={handleImageSelect} className="text-[#ff8d49] h-8">
                <ImagePlus className="h-4 w-4 mr-1" />
                Photo
              </Button>
              <Button onClick={handleSubmit} disabled={(!content.trim() && !selectedImage) || isPosting} className="bg-[#ff8d49] text-white rounded-full h-8 px-5 text-sm">
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
