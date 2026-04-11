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
import { Post, ViewMode, FilterMode, User } from '@/types/social';

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
  const [displayedPostsCount, setDisplayedPostsCount] = useState(5);
  const POSTS_PER_PAGE = 5;

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
  const savedPostsData = posts.filter((post) => savedPosts.has(post.id));

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return post.content.toLowerCase().includes(query) || post.user.name.toLowerCase().includes(query) || post.user.username.toLowerCase().includes(query);
  });

  const displayedPosts = filteredPosts.slice(0, displayedPostsCount);
  const hasMorePosts = displayedPostsCount < filteredPosts.length;

  return (
    <div className="min-h-screen bg-[#faf7f4]">
      <Header onSavedClick={() => setShowSavedPanel(!showSavedPanel)} savedCount={savedPosts.size} searchQuery={searchQuery} />

      <div className="flex">
        <Sidebar onSavedClick={() => setShowSavedPanel(!showSavedPanel)} savedCount={savedPosts.size} />

        <main className="flex-1 py-6 px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {isLoading ? <CreatePostSkeleton /> : <CreatePost onPost={handleCreatePost} />}

            <FilterBar viewMode={viewMode} filterMode={filterMode} onViewModeChange={setViewMode} onFilterModeChange={setFilterMode} />

            {showSavedPanel && (
              <div className="bg-[#ffffff] border border-[#e8e1da] rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-[#2d2a26]">Saved Posts ({savedPostsData.length})</h3>
                  <button onClick={() => setShowSavedPanel(false)} className="text-sm text-[#6b655e]">Close</button>
                </div>
                {savedPostsData.length === 0 ? (
                  <p className="text-sm text-[#6b655e] text-center py-6">No saved posts yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {savedPostsData.map((post) => (
                      <div key={post.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => { handleImageClick(post); setShowSavedPanel(false); }}>
                        <img src={post.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isLoading ? (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-5' : 'space-y-5'}>
                {[1, 2, 3].map((i) => (<PostSkeleton key={i} viewMode={viewMode} />))}
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-5' : 'space-y-5'}>
                {displayedPosts.map((post) => (
                  <PostCard key={post.id} post={post} viewMode={viewMode} onImageClick={handleImageClick}
                    onAddComment={handleAddComment} onSavePost={handleSavePost} savedPosts={savedPosts}
                    isOwner={post.userId === currentUser} onUserClick={handleUserClick} />
                ))}
              </div>
            )}

            {hasMorePosts && (
              <div className="flex justify-center pt-2">
                <button onClick={() => setDisplayedPostsCount((p) => p + POSTS_PER_PAGE)}
                  className="px-6 py-2.5 bg-[#ff8d49] text-white rounded-full text-sm font-medium">
                  Load More
                </button>
              </div>
            )}

            {!hasMorePosts && filteredPosts.length > 0 && (
              <p className="text-sm text-[#6b655e] text-center pt-2">You&apos;ve reached the end.</p>
            )}

            {filteredPosts.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-[#6b655e] mb-2">No posts found for &quot;{searchQuery}&quot;</p>
                <button onClick={() => setSearchQuery('')} className="text-sm text-[#ff8d49]">Clear search</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <ImageModal post={selectedPost} isOpen={isModalOpen} onClose={handleCloseModal} onAddComment={handleAddComment} />
      <UserProfileModal isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} user={selectedUser!}
        postsCount={posts.filter((p) => p.userId === selectedUser?.id).length}
        followersCount={selectedUser?.followers || 0} followingCount={selectedUser?.following || 0} />
    </div>
  );
}
