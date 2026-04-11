'use client';

import { useState } from 'react';
import { TrendingUp, Flame, Clock, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface TrendingPost {
  id: string;
  title: string;
  author: string;
  engagement: string;
  trend: 'hot' | 'rising' | 'new';
  image: string;
}

const trendingPosts: TrendingPost[] = [
  {
    id: '1',
    title: 'Exploring the Hidden Gems of Portugal',
    author: '@emmaw',
    engagement: '12.4K likes',
    trend: 'hot',
    image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'The Art of Minimalist Photography',
    author: '@alexc',
    engagement: '8.9K likes',
    trend: 'rising',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Sunset Vibes at the Beach',
    author: '@oliviap',
    engagement: '6.2K likes',
    trend: 'hot',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
  },
];

const trendConfig = {
  hot: { icon: Flame, color: 'text-red-500', bg: 'bg-red-50', label: 'Hot' },
  rising: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-50', label: 'Rising' },
  new: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'New' },
};

interface TrendingPostsProps {
  onPostClick?: (post: TrendingPost) => void;
}

export function TrendingPosts({ onPostClick }: TrendingPostsProps) {
  const [selectedTrend, setSelectedTrend] = useState<'all' | 'hot' | 'rising' | 'new'>('all');

  const filteredPosts = selectedTrend === 'all' 
    ? trendingPosts 
    : trendingPosts.filter(p => p.trend === selectedTrend);

  const handlePostClick = (post: TrendingPost) => {
    // Show toast notification
    toast({
      title: 'Trending Post',
      description: `Opening "${post.title}" by ${post.author}`,
    });
    
    // Call parent handler if provided
    onPostClick?.(post);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-5 shadow-sm hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#f9a06b] to-[#ffc8a6]">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Trending Posts</h3>
        </div>
        
        {/* Filter buttons */}
        <div className="flex gap-1">
          {(['all', 'hot', 'rising'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedTrend(filter)}
              className={cn(
                "px-2 py-1 text-xs rounded-lg transition-all duration-300",
                selectedTrend === filter
                  ? "bg-[#f9a06b] text-white"
                  : "bg-[#fdfaf7] text-gray-500 hover:bg-[#ffc8a6]/20"
              )}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredPosts.map((post, index) => {
          const config = trendConfig[post.trend];
          const IconComponent = config.icon;
          
          return (
            <button
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#fdfaf7] hover:bg-gradient-to-r hover:from-[#f9a06b]/5 hover:to-[#ffc8a6]/5 transition-all duration-300 hover:translate-x-1 group animate-slide-in-right"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Post image */}
              <div className="relative">
                <img
                  src={post.image}
                  alt={post.title}
                  className="h-12 w-12 rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className={cn(
                  "absolute -top-1 -right-1 p-1 rounded-full",
                  config.bg
                )}>
                  <IconComponent className={cn("h-3 w-3", config.color)} />
                </div>
              </div>

              {/* Post info */}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-medium text-gray-900 text-sm truncate group-hover:text-[#f9a06b] transition-colors">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500">{post.author}</span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.engagement}
                  </span>
                </div>
              </div>

              {/* Rank badge */}
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0 ? "bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] text-white" : "bg-[#e5d5c5] text-gray-600"
              )}>
                {index + 1}
              </div>
            </button>
          );
        })}
      </div>

      {/* See more link */}
      <button 
        onClick={() => {
          toast({
            title: 'Trending Posts',
            description: 'View all trending posts feature coming soon!',
          });
        }}
        className="w-full mt-4 py-2 text-sm text-[#f9a06b] hover:text-[#f9a06b]/80 transition-colors font-medium"
      >
        See all trending posts →
      </button>
    </div>
  );
}
