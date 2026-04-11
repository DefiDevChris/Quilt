'use client';

import { useState } from 'react';
import { Heart, MessageCircle, UserPlus, AtSign, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: {
    name: string;
    avatar: string;
  };
  content?: string;
  time: string;
  image?: string;
}

const recentActivity: Activity[] = [
  {
    id: '1',
    type: 'like',
    user: { name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop' },
    content: 'liked your post about minimalism',
    time: '2m ago',
    image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    type: 'comment',
    user: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop' },
    content: 'commented: "This is amazing! 🔥"',
    time: '15m ago',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    type: 'follow',
    user: { name: 'Olivia Parker', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop' },
    content: 'started following you',
    time: '1h ago',
  },
  {
    id: '4',
    type: 'mention',
    user: { name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop' },
    content: 'mentioned you in a comment',
    time: '2h ago',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100&h=100&fit=crop',
  },
];

const activityConfig = {
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
  comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
  follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50' },
  mention: { icon: AtSign, color: 'text-purple-500', bg: 'bg-purple-50' },
};

export function ActivityFeed() {
  const [expanded, setExpanded] = useState(false);

  const handleActivityClick = (activity: Activity) => {
    toast({
      title: `${activity.user.name}`,
      description: activity.content,
    });
  };

  const displayActivities = expanded ? recentActivity : recentActivity.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-5 shadow-sm hover-lift">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#f9a06b] to-[#ffc8a6]">
            <Clock className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <span className="text-xs text-[#f9a06b] font-medium">{recentActivity.length} new</span>
      </div>

      <div className="space-y-3">
        {displayActivities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const IconComponent = config.icon;

          return (
            <button
              key={activity.id}
              onClick={() => handleActivityClick(activity)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#fdfaf7] transition-all duration-300 hover:translate-x-1 group animate-slide-in-right"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* User avatar with activity icon */}
              <div className="relative">
                <img
                  src={activity.user.avatar}
                  alt={activity.user.name}
                  className="h-10 w-10 rounded-full object-cover border-2 border-[#ffc8a6] group-hover:border-[#f9a06b] transition-colors"
                />
                <div className={cn(
                  "absolute -bottom-1 -right-1 p-1 rounded-full",
                  config.bg
                )}>
                  <IconComponent className={cn("h-3 w-3", config.color)} />
                </div>
              </div>

              {/* Activity content */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-gray-900 group-hover:text-[#f9a06b] transition-colors">
                    {activity.user.name}
                  </span>{' '}
                  <span className="text-gray-500">{activity.content}</span>
                </p>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>

              {/* Post image if available */}
              {activity.image && (
                <img
                  src={activity.image}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Show more button */}
      {recentActivity.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full mt-4 py-2 flex items-center justify-center gap-1 text-sm text-[#f9a06b] hover:text-[#f9a06b]/80 transition-colors font-medium group"
        >
          {expanded ? 'Show less' : `Show ${recentActivity.length - 3} more`}
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-300",
            expanded && "rotate-90"
          )} />
        </button>
      )}
    </div>
  );
}
