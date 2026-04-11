'use client';

import { useState } from 'react';
import { Bell, Search, Settings, ChevronDown, Bookmark, Moon, Sun, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onSavedClick?: () => void;
  savedCount?: number;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSavedClick, savedCount = 0, onSearch, searchQuery: externalSearchQuery }: HeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        return true;
      }
    }
    return false;
  });
  
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSearch = (query: string) => {
    setInternalSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5d5c5] bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <div>
            <span className="text-xl font-bold text-gray-900">SocialFeed</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search posts, people, hashtags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-[#fdfaf7] border-[#e5d5c5] rounded-full"
            />
            {searchQuery && (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="text-gray-600 rounded-full"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Saved Posts */}
          {savedCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSavedClick}
              className="relative text-gray-600 rounded-full"
            >
              <Bookmark className="h-5 w-5 fill-current" />
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                {savedCount}
              </span>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-gray-600 rounded-full">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border-[#e5d5c5]">
              <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#e5d5c5]" />
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                <DropdownMenuItem className="py-3 cursor-pointer rounded-full mx-1">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" alt="Emma Wilson" className="h-10 w-10 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Emma Wilson</span> liked your post</p>
                      <p className="text-xs text-gray-500">2 min ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-3 cursor-pointer rounded-full mx-1">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="Alex Chen" className="h-10 w-10 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <MessageCircle className="h-3 w-3 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Alex Chen</span> commented on your post</p>
                      <p className="text-xs text-gray-500">15 min ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="py-3 cursor-pointer rounded-full mx-1">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" alt="Olivia Parker" className="h-10 w-10 rounded-full" />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm"><span className="font-medium">Olivia Parker</span> started following you</p>
                      <p className="text-xs text-gray-500">1 hour ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator className="bg-[#e5d5c5]" />
              <div className="p-2">
                <button className="w-full text-center text-sm text-primary font-medium py-2 rounded-full">
                  View all notifications
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-full cursor-pointer">
                <Avatar className="h-9 w-9 border-2 border-primary">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-medium text-gray-900">Sarah Mitchell</p>
                  <p className="text-xs text-gray-500">@sarahm</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400 hidden lg:block" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl border-[#e5d5c5]">
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1">
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1" onClick={onSavedClick}>
                <Bookmark className="h-4 w-4 mr-2" />
                <span className="font-medium">Saved Posts</span>
                {savedCount > 0 && (
                  <span className="ml-auto text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">{savedCount}</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1">
                <Settings className="h-4 w-4 mr-2" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#e5d5c5]" />
              <DropdownMenuItem className="cursor-pointer text-red-500 rounded-full mx-1">
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
