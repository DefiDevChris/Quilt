'use client';

import { useState } from 'react';
import { ImagePlus, Smile, MapPin, X, Sparkles } from 'lucide-react';
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
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&h=800&fit=crop',
    ];
    setSelectedImage(images[Math.floor(Math.random() * images.length)]);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-5 shadow-sm">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 border-2 border-primary">
          <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
          <AvatarFallback>SM</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className={cn(
            "relative rounded-2xl",
            isExpanded && "ring-2 ring-primary/20 bg-[#fdfaf7]"
          )}>
            <Textarea
              placeholder="What's on your mind, Sarah?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              className={cn(
                "min-h-[80px] resize-none border-none text-gray-900 placeholder:text-gray-400 text-base rounded-2xl",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                isExpanded ? "bg-[#fdfaf7]" : "bg-[#fdfaf7]"
              )}
            />
            
            {selectedImage && (
              <div className="relative mt-3 rounded-2xl overflow-hidden mx-3 mb-3">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          
          {isExpanded && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e5d5c5]">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImageSelect}
                  className="text-primary rounded-full"
                >
                  <ImagePlus className="h-5 w-5 mr-2" />
                  Photo
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 rounded-full">
                  <Smile className="h-5 w-5 mr-2" />
                  Feeling
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500 rounded-full">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location
                </Button>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !selectedImage) || isPosting}
                className={cn(
                  "px-6 rounded-full",
                  "bg-primary text-white font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isPosting ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
