'use client';

import { useState } from 'react';
import { X, Check, UserPlus, UserMinus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  followers: number;
  isFollowing: boolean;
}

const suggestedUsers: SuggestedUser[] = [
  {
    id: '1',
    name: 'David Kim',
    username: '@davidk',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
    bio: 'Travel photographer & adventure seeker',
    followers: 12500,
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Sophie Chen',
    username: '@sophiec',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop',
    bio: 'Design lead @startup • Coffee lover',
    followers: 8900,
    isFollowing: false,
  },
  {
    id: '3',
    name: 'James Wilson',
    username: '@jamesw',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    bio: 'Full-stack developer | Open source contributor',
    followers: 15600,
    isFollowing: false,
  },
];

export function SuggestedUsers() {
  const [users, setUsers] = useState(suggestedUsers);
  const [dismissedUsers, setDismissedUsers] = useState<Set<string>>(new Set());

  const handleFollow = (userId: string) => {
    setUsers(prev =>
      prev.map(user =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      )
    );
    
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: user.isFollowing ? 'Unfollowed' : 'Following!',
        description: user.isFollowing 
          ? `You unfollowed ${user.name}` 
          : `You are now following ${user.name}`,
      });
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedUsers(prev => new Set([...prev, userId]));
  };

  const visibleUsers = users.filter(u => !dismissedUsers.has(u.id));

  if (visibleUsers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-5 shadow-sm hover-lift">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Suggested for You</h3>
        <button className="text-xs text-[#f9a06b] hover:text-[#f9a06b]/80 transition-colors font-medium">
          See All
        </button>
      </div>

      <div className="space-y-4">
        {visibleUsers.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className="flex items-center gap-3 animate-slide-in-right"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <Avatar className="h-11 w-11 border-2 border-[#ffc8a6] transition-all duration-300 hover:scale-105 hover:border-[#f9a06b] cursor-pointer">
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate hover:text-[#f9a06b] transition-colors cursor-pointer">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.username}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => handleFollow(user.id)}
                size="sm"
                className={cn(
                  "rounded-lg text-xs font-medium transition-all duration-300",
                  user.isFollowing
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    : "bg-gradient-to-r from-[#f9a06b] to-[#ffc8a6] text-white hover:shadow-md hover:shadow-[#f9a06b]/20"
                )}
              >
                {user.isFollowing ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
              <button
                onClick={() => handleDismiss(user.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Dismiss suggestion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
