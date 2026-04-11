'use client';

import { Home, Compass, Bookmark, Settings, Users, Zap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: Home, label: 'Home', href: '#', active: true },
  { icon: Compass, label: 'Explore', href: '#' },
  { icon: Bookmark, label: 'Saved', href: '#', isSaved: true },
  { icon: Users, label: 'Communities', href: '#' },
  { icon: Settings, label: 'Settings', href: '#' },
];

interface SidebarProps {
  className?: string;
  onSavedClick?: () => void;
  savedCount?: number;
}

export function Sidebar({ className, onSavedClick, savedCount = 0 }: SidebarProps) {
  return (
    <aside className={cn("w-64 flex-shrink-0 bg-white border-r border-[#e5d5c5]", className)}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
        <div className="p-5 space-y-6">
          {/* Create Post Button */}
          <Button className="w-full bg-primary text-white font-medium py-6 rounded-full">
            <Plus className="h-5 w-5 mr-2" />
            Create Post
          </Button>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  if (item.isSaved && onSavedClick) {
                    e.preventDefault();
                    onSavedClick();
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium",
                  item.active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-600"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.isSaved && savedCount > 0 && (
                  <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full font-medium">
                    {savedCount}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Featured Creators */}
          <div className="pt-4 border-t border-[#e5d5c5]">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-gray-900">Featured Creators</h3>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Emma Wilson', handle: '@emmaw', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', followers: '23.1K' },
                { name: 'Alex Chen', handle: '@alexc', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', followers: '8.9K' },
                { name: 'Olivia Parker', handle: '@oliviap', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', followers: '45.2K' },
              ].map((creator) => (
                <a
                  key={creator.handle}
                  href="#"
                  className="flex items-center gap-3 p-2 rounded-full"
                >
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{creator.name}</p>
                    <p className="text-xs text-gray-500 truncate">{creator.followers} followers</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary rounded-full px-3"
                  >
                    Follow
                  </Button>
                </a>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#e5d5c5] text-center">
            <p className="text-xs text-gray-400">© 2024 SocialFeed</p>
            <div className="flex justify-center gap-4 mt-2">
              <a href="#" className="text-xs text-gray-400">Privacy</a>
              <a href="#" className="text-xs text-gray-400">Terms</a>
              <a href="#" className="text-xs text-gray-400">Help</a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
