'use client';

import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface Story {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  image: string;
  hasNew: boolean;
}

const mockStories: Story[] = [
  {
    id: '1',
    user: { name: 'Your Story', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop',
    hasNew: false,
  },
  {
    id: '2',
    user: { name: 'Emma W.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=600&fit=crop',
    hasNew: true,
  },
  {
    id: '3',
    user: { name: 'Alex C.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=600&fit=crop',
    hasNew: true,
  },
  {
    id: '4',
    user: { name: 'Olivia P.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=600&fit=crop',
    hasNew: true,
  },
  {
    id: '5',
    user: { name: 'Marcus J.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&h=600&fit=crop',
    hasNew: false,
  },
  {
    id: '6',
    user: { name: 'David K.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop',
    hasNew: true,
  },
  {
    id: '7',
    user: { name: 'Sarah M.', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop' },
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=600&fit=crop',
    hasNew: true,
  },
];

export function StoriesBar() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());

  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setViewedStories(prev => new Set([...prev, story.id]));
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
  };

  const handleNextStory = () => {
    if (selectedStory) {
      const idx = mockStories.findIndex(s => s.id === selectedStory.id);
      if (idx < mockStories.length - 1) {
        const nextStory = mockStories[idx + 1];
        setSelectedStory(nextStory);
        setViewedStories(prev => new Set([...prev, nextStory.id]));
      } else {
        handleCloseStory();
      }
    }
  };

  const handlePrevStory = () => {
    if (selectedStory) {
      const idx = mockStories.findIndex(s => s.id === selectedStory.id);
      if (idx > 0) {
        setSelectedStory(mockStories[idx - 1]);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#e5d5c5] p-5 shadow-sm mb-6 overflow-hidden hover-lift glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">Stories</h3>
            <span className="px-2 py-0.5 text-xs bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] text-white rounded-full font-medium">New</span>
          </div>
          <span className="text-xs text-[#f9a06b] hover:underline cursor-pointer transition-colors">View all</span>
        </div>
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
          {mockStories.map((story, index) => (
            <button
              key={story.id}
              onClick={() => handleStoryClick(story)}
              className="flex flex-col items-center gap-2 flex-shrink-0 group animate-slide-in-right"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                {index === 0 ? (
                  // Add Story button for first item
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-2 border-[#e5d5c5] transition-all duration-300 group-hover:scale-110 group-hover:border-[#f9a06b] shadow-md">
                      <AvatarImage src={story.user.avatar} />
                      <AvatarFallback>{story.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] flex items-center justify-center border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-110 animate-bounce-subtle">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "p-[3px] rounded-full transition-all duration-300 group-hover:scale-105",
                    story.hasNew && !viewedStories.has(story.id)
                      ? "bg-gradient-to-br from-[#f9a06b] via-[#ffc8a6] to-[#e5d5c5] animate-gradient-flow shadow-lg neon-glow"
                      : "bg-[#e5d5c5]"
                  )}>
                    <Avatar className="h-14 w-14 border-2 border-white transition-transform duration-300 group-hover:scale-110 shadow-md">
                      <AvatarImage src={story.user.avatar} />
                      <AvatarFallback>{story.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-xs truncate w-16 text-center transition-colors",
                viewedStories.has(story.id) && index !== 0 ? "text-gray-400" : "text-gray-600 group-hover:text-[#f9a06b]"
              )}>
                {story.user.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Story Modal */}
      {selectedStory && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
          onClick={handleCloseStory}
        >
          <div className="relative w-full max-w-sm h-[80vh] mx-4">
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {mockStories.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "h-1 flex-1 rounded-full",
                    s.id === selectedStory.id ? "bg-white" : 
                    i < mockStories.findIndex(st => st.id === selectedStory.id) ? "bg-white/80" : "bg-white/30"
                  )}
                />
              ))}
            </div>

            {/* User info */}
            <div className="absolute top-8 left-4 right-4 flex items-center gap-2 z-10">
              <Avatar className="h-8 w-8 border border-white/30">
                <AvatarImage src={selectedStory.user.avatar} />
                <AvatarFallback>{selectedStory.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-white font-medium text-sm">{selectedStory.user.name}</span>
              <span className="text-white/60 text-xs">2h</span>
            </div>

            {/* Story Image */}
            <img
              src={selectedStory.image}
              alt="Story"
              className="w-full h-full object-cover rounded-2xl"
            />

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevStory(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNextStory(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white transition-colors"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
