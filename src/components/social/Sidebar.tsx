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
    <aside className={cn("w-64 border-r border-[#e8e1da] bg-white", className)}>
      <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-6">
          <Button className="w-full bg-[#ff8d49] text-white font-medium py-5 rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>

          <nav className="space-y-0.5">
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium",
                  item.active
                    ? "bg-[#ff8d49]/10 text-[#ff8d49]"
                    : "text-[#6b655e] hover:bg-[#fdfaf7]"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.isSaved && savedCount > 0 && (
                  <span className="text-xs bg-[#ff8d49] text-white px-2 py-0.5 rounded-full font-medium">
                    {savedCount}
                  </span>
                )}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-[#e8e1da]">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-[#ff8d49]" />
              <h3 className="font-semibold text-sm text-[#2d2a26]">Featured Creators</h3>
            </div>
            <div className="space-y-1">
              {[
                { name: 'Emma Wilson', handle: '@emmaw', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop', followers: '23.1K' },
                { name: 'Alex Chen', handle: '@alexc', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', followers: '8.9K' },
                { name: 'Olivia Parker', handle: '@oliviap', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', followers: '45.2K' },
              ].map((creator) => (
                <a key={creator.handle} href="#" className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#fdfaf7]">
                  <img src={creator.avatar} alt={creator.name} className="h-9 w-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#2d2a26] truncate">{creator.name}</p>
                    <p className="text-xs text-[#6b655e] truncate">{creator.followers} followers</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-[#ff8d49] h-7 px-2">
                    Follow
                  </Button>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#e8e1da] text-center">
            <p className="text-xs text-[#6b655e]">© 2026 QuiltCorgi</p>
            <div className="flex justify-center gap-3 mt-1">
              <a href="/privacy" className="text-xs text-[#6b655e]">Privacy</a>
              <a href="/terms" className="text-xs text-[#6b655e]">Terms</a>
              <a href="/help" className="text-xs text-[#6b655e]">Help</a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
