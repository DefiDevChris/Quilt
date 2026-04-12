'use client';

import { useState } from 'react';
import { Bell, Search, ChevronDown, Heart, MessageCircle, UserPlus, Bookmark } from 'lucide-react';
import { Button, Input, Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui';
import Image from 'next/image';

interface HeaderProps {
  onSavedClick?: () => void;
  savedCount?: number;
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function Header({ onSavedClick, savedCount = 0, onSearch, searchQuery: externalSearchQuery }: HeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  const handleSearch = (query: string) => {
    setInternalSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[var(--color-border)]">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logo.png" alt="QuiltCorgi" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold text-[var(--color-text)]">QuiltCorgi</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-dim)]" />
            <Input
              type="search"
              placeholder="Search posts, people, hashtags..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-11 pr-4 h-11 bg-[var(--color-bg)] text-sm"
            />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {savedCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSavedClick}
              className="h-10 w-10 relative text-[var(--color-text-dim)]"
            >
              <Bookmark className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white flex items-center justify-center">
                {savedCount}
              </span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 relative text-[var(--color-text-dim)]">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-white flex items-center justify-center">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2">
              <DropdownMenuLabel className="px-3 py-2 text-base font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-0" />
              <DropdownMenuItem className="py-3 px-3 cursor-pointer rounded-full mx-1">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" alt="" className="h-10 w-10 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <Heart className="h-3 w-3 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">Emma Wilson</span> liked your post</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">2 min ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 px-3 cursor-pointer rounded-full mx-1">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" alt="" className="h-10 w-10 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <MessageCircle className="h-3 w-3 text-white fill-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">Alex Chen</span> commented on your post</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">15 min ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="py-3 px-3 cursor-pointer rounded-full mx-1">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop" alt="" className="h-10 w-10 rounded-full" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                      <UserPlus className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">Olivia Parker</span> started following you</p>
                    <p className="text-xs text-[var(--color-text-dim)] mt-0.5">1 hour ago</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2.5 pl-2 cursor-pointer py-1.5 rounded-full hover:bg-[var(--color-bg)] transition-colors duration-150">
                <Avatar
                  className="h-9 w-9 border-2 border-[var(--color-primary)]"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop"
                  fallback="SM"
                />
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-[var(--color-text)]">Sarah Mitchell</p>
                  <p className="text-xs text-[var(--color-text-dim)]">@sarahm</p>
                </div>
                <ChevronDown className="h-4 w-4 text-[var(--color-text-dim)]" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1 py-2.5">Profile</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1 py-2.5" onClick={onSavedClick}>
                Saved Posts
                {savedCount > 0 && <span className="ml-auto text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">{savedCount}</span>}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1 py-2.5">Settings</DropdownMenuItem>
              <DropdownMenuSeparator className="mx-0" />
              <DropdownMenuItem className="cursor-pointer rounded-full mx-1 py-2.5 text-red-500">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
