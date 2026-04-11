'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Link as LinkIcon, Camera, Grid, Bookmark, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types/social';
import { cn } from '@/lib/utils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  user, 
  postsCount = 0, 
  followersCount = 0, 
  followingCount = 0 
}: UserProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'liked'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const handleBodyOverflow = (locked: boolean) => {
      document.body.style.overflow = locked ? 'hidden' : 'unset';
    };

    if (isOpen) {
      handleBodyOverflow(true);
      return () => {
        handleBodyOverflow(false);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'posts' as const, label: 'Posts', icon: Grid, count: postsCount },
    { id: 'saved' as const, label: 'Saved', icon: Bookmark, count: 0 },
    { id: 'liked' as const, label: 'Liked', icon: Heart, count: 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5d5c5]">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Profile Header */}
          <div className="relative">
            {/* Cover Image */}
            <div className="h-32 bg-primary relative">
              <button className="absolute top-2 right-2 p-2 bg-black/30 rounded-full text-white">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-14 px-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <p className="text-gray-500">@{user.username}</p>
              </div>
              <Button
                onClick={() => setIsFollowing(!isFollowing)}
                className={cn(
                  "rounded-full font-medium",
                  isFollowing
                    ? "bg-gray-100 text-gray-700"
                    : "bg-primary text-white"
                )}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-3 text-gray-700 leading-relaxed">{user.bio}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1">
                <LinkIcon className="h-4 w-4" />
                <a href="#" className="text-primary">socialfeed.app/{user.username}</a>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div className="text-center cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{postsCount}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </div>
              <div className="text-center cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{followersCount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </div>
              <div className="text-center cursor-pointer">
                <p className="text-2xl font-bold text-gray-900">{followingCount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Following</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-[#e5d5c5]">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2",
                    activeTab === tab.id
                      ? "text-primary border-primary"
                      : "text-gray-500 border-transparent"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 min-h-[200px]">
            {activeTab === 'posts' && (
              <div className="text-center py-12">
                <Grid className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </div>
            )}
            {activeTab === 'saved' && (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved posts</p>
              </div>
            )}
            {activeTab === 'liked' && (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No liked posts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
