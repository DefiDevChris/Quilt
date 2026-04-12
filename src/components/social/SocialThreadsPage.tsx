'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/social/Header';
import { Sidebar } from '@/components/social/Sidebar';
import { CreatePost } from '@/components/social/CreatePost';
import { FilterBar } from '@/components/social/FilterBar';
import { PostCard } from '@/components/social/PostCard';
import { ImageModal } from '@/components/social/ImageModal';
import { UserProfileModal } from '@/components/social/UserProfileModal';
import { PostSkeleton, CreatePostSkeleton } from '@/components/social/PostSkeleton';
import { BrandedPage } from '@/components/layout/BrandedPage';
import { Post, ViewMode, FilterMode, User } from '@/types/social';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';

const POSTS_PER_PAGE = 5;

export function SocialThreadsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('full');
  const [filterMode, setFilterMode] = useState<FilterMode>('newest');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedPostsCount, setDisplayedPostsCount] = useState(POSTS_PER_PAGE);
  const [shareToast, setShareToast] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch(`/api/social-threads?filter=${filterMode}`);
      const data = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filterMode]);

  useEffect(() => {
    const saved = localStorage.getItem('savedPosts');
    if (saved) setSavedPosts(new Set(JSON.parse(saved)));
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    localStorage.setItem('savedPosts', JSON.stringify(Array.from(savedPosts)));
  }, [savedPosts]);

  const handleCreatePost = async (content: string, image?: string) => {
    try {
      const response = await fetch('/api/social-threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, image, userId: '1' }),
      });
      const data = await response.json();
      setPosts((prev) => [data.post, ...prev]);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/social-threads/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: '1' }),
      });
      const data = await response.json();
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, data.comment] } : post
        )
      );
      if (selectedPost?.id === postId) {
        setSelectedPost((prev) => (prev ? { ...prev, comments: [...prev.comments, data.comment] } : null));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleImageClick = (post: Post) => { setSelectedPost(post); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedPost(null); };

  const handleSavePost = (postId: string, saved: boolean) => {
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      saved ? newSet.add(postId) : newSet.delete(postId);
      return newSet;
    });
  };

  const handleUserClick = (user: User) => { setSelectedUser(user); setShowUserProfile(true); };

  const handleShare = async (postId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/social-threads?post=${postId}`);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    } catch {
      console.error('Failed to copy link');
    }
  };

  const handleLike = (postId: string, liked: boolean) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes: liked ? post.likes + 1 : post.likes - 1 }
          : post
      )
    );
    if (selectedPost?.id === postId) {
      setSelectedPost((prev) =>
        prev ? { ...prev, likes: liked ? prev.likes + 1 : prev.likes - 1 } : null
      );
    }
  };

  const savedPostsData = posts.filter((post) => savedPosts.has(post.id));

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.content.toLowerCase().includes(query) || post.user.name.toLowerCase().includes(query) || post.user.username.toLowerCase().includes(query);
  });

  const displayedPosts = filteredPosts.slice(0, displayedPostsCount);
  const hasMorePosts = displayedPostsCount < filteredPosts.length;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header onSavedClick={() => setShowSavedPanel(!showSavedPanel)} savedCount={savedPosts.size} searchQuery={searchQuery} />

      <div className="flex">
        <Sidebar onSavedClick={() => setShowSavedPanel(!showSavedPanel)} savedCount={savedPosts.size} />

        <BrandedPage showMascots mascotCount={1} decorationOpacity={8}>
          <main className="flex-1 py-8 px-10">
            <div className="max-w-5xl mx-auto space-y-6">
            {isLoading ? <CreatePostSkeleton /> : <CreatePost onPost={handleCreatePost} />}

            <FilterBar viewMode={viewMode} filterMode={filterMode} onViewModeChange={setViewMode} onFilterModeChange={setFilterMode} />

            {showSavedPanel && (
              <div className="rounded-lg p-6" style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, boxShadow: SHADOW.brand }}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold" style={{ color: COLORS.text }}>Saved Posts ({savedPostsData.length})</h3>
                  <button
                    onClick={() => setShowSavedPanel(false)}
                    className="text-sm transition-colors"
                    style={{
                      color: COLORS.textDim,
                      transitionDuration: `${MOTION.transitionDuration}ms`,
                      transitionTimingFunction: MOTION.transitionEasing,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = COLORS.text;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = COLORS.textDim;
                    }}
                  >Close</button>
                </div>
                {savedPostsData.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: COLORS.textDim }}>No saved posts yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {savedPostsData.map((post) => (
                      <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                        style={{ transitionDuration: `${MOTION.transitionDuration}ms`, transitionTimingFunction: MOTION.transitionEasing }}
                        onClick={() => { handleImageClick(post); setShowSavedPanel(false); }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '0.9';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.opacity = '1';
                        }}
                      >
                        <img src={post.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-6'}>
                {[1, 2, 3].map((i) => (<PostSkeleton key={i} viewMode={viewMode} />))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-6' : 'space-y-6'}>
                {displayedPosts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode={viewMode} onImageClick={handleImageClick}
                    onAddComment={handleAddComment} onSavePost={handleSavePost} savedPosts={savedPosts}
                    isOwner={post.userId === currentUser} onUserClick={handleUserClick}
                    onLike={handleLike} onShare={handleShare} />
                ))}
              </div>
            )}

            {hasMorePosts && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setDisplayedPostsCount((p) => p + POSTS_PER_PAGE)}
                  className="px-8 py-3 rounded-full text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: COLORS.primary,
                    color: COLORS.surface,
                    transitionDuration: `${MOTION.transitionDuration}ms`,
                    transitionTimingFunction: MOTION.transitionEasing,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS_HOVER.primary;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = COLORS.primary;
                  }}
                >
                  Load More
                </button>
              </div>
            )}

            {!hasMorePosts && filteredPosts.length > 0 && (
              <p className="text-sm text-center pt-4" style={{ color: COLORS.textDim }}>You&apos;ve reached the end.</p>
            )}

            {filteredPosts.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <p className="mb-3" style={{ color: COLORS.textDim }}>No posts found for &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm font-medium transition-colors"
                  style={{
                    color: COLORS.primary,
                    transitionDuration: `${MOTION.transitionDuration}ms`,
                    transitionTimingFunction: MOTION.transitionEasing,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none';
                  }}
                >Clear search</button>
              </div>
            )}
          </div>
        </main>
        </BrandedPage>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-medium" style={{ backgroundColor: COLORS.text, color: COLORS.surface, boxShadow: SHADOW.brand }}>
          Link copied to clipboard!
        </div>
      )}

      <ImageModal post={selectedPost} isOpen={isModalOpen} onClose={handleCloseModal} onAddComment={handleAddComment} />
      <UserProfileModal isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} user={selectedUser!}
        postsCount={posts.filter((p) => p.userId === selectedUser?.id).length}
        followersCount={selectedUser?.followers || 0} followingCount={selectedUser?.following || 0} />
    </div>
  );
}
