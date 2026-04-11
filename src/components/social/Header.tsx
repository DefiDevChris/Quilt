'use client';

import { useState } from 'react';
import { Bell, Search, ChevronDown, Moon, Sun, Heart, MessageCircle, UserPlus } from 'lucide-react';
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
import Image from 'next/image';

interface HeaderProps {
  onSavedClick?: () => void;
  savedCount?: number;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSavedClick, savedCount = 0, onSearch, searchQuery: externalSearchQuery }: HeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const handleSearch = (query: string) => {
    setInternalSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 shrink-0">
            <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" />
          </div>
          <span className="text-lg font-bold text-[#2d2a26]">QuiltCorgi</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b655e]" />
            <Input
              type="search"
              placeholder="Search posts, people, hashtags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-10 bg-[#fdfaf7] border border-[#e8e1da] rounded-full text-sm"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-8 w-8 text-[#6b655e]"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </Button>

          {savedCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSavedClick}
              className="h-8 w-8 relative text-[#6b655e]"
            >
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ff8d49] text-[9px] font-bold text-white flex items-center justify-center">
                {savedCount}
              </span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative text-[#6b655e]">
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#ff8d49] text-[9px] font-bold text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2 cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" alt="" className="h-8 w-8 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <Heart className="h-2.5 w-2.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">Emma Wilson</span> liked your post</p>
                    <p className="text-xs text-[#6b655e]">2 min ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2 cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="" className="h-8 w-8 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">Alex Chen</span> commented on your post</p>
                    <p className="text-xs text-[#6b655e]">15 min ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2 cursor-pointer">
                <div className="flex items-start gap-2.5">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" alt="" className="h-8 w-8 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <UserPlus className="h-2.5 w-2.5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm"><span className="font-medium">Olivia Parker</span> started following you</p>
                    <p className="text-xs text-[#6b655e]">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 pl-1 cursor-pointer">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div className="text-left leading-tight">
                  <p className="text-sm font-medium text-[#2d2a26]">Sarah Mitchell</p>
                  <p className="text-xs text-[#6b655e]">@sarahm</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[#6b655e]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={onSavedClick}>
                Saved Posts
                {savedCount > 0 && <span className="ml-auto text-xs bg-[#ff8d49] text-white px-1.5 py-0.5 rounded-full">{savedCount}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
