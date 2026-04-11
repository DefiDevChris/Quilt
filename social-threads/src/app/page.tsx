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
import { Footer } from '@/components/social/Footer';
import { Post, ViewMode, FilterMode, User } from '@/types/social';

export default function SocialFeed() {
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
      const response = await fetch(`/api/posts?filter=${filterMode}`);
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
    if (saved) {
      setSavedPosts(new Set(JSON.parse(saved)));
    }
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    localStorage.setItem('savedPosts', JSON.stringify(Array.from(savedPosts)));
  }, [savedPosts]);

  const handleCreatePost = async (content: string, image?: string) => {
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, image, userId: '1' }),
      });
      const data = await response.json();
      setPosts(prev => [data.post, ...prev]);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, userId: '1' }),
      });
      const data = await response.json();

      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? { ...post, comments: [...post.comments, data.comment] }
            : post
        )
      );

      if (selectedPost?.id === postId) {
        setSelectedPost(prev =>
          prev ? { ...prev, comments: [...prev.comments, data.comment] } : null
        );
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleImageClick = (post: Post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  const handleSavePost = (postId: string, saved: boolean) => {
    setSavedPosts(prev => {
      const newSet = new Set(prev);
      if (saved) {
        newSet.add(postId);
      } else {
        newSet.delete(postId);
      }
      return newSet;
    });
  };

  const handleEditPost = (postId: string, content: string, image?: string) => {
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, content, image: image || post.image }
          : post
      )
    );

    if (selectedPost?.id === postId) {
      setSelectedPost(prev =>
        prev ? { ...prev, content, image: image || prev.image } : null
      );
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));

    setSavedPosts(prev => {
      const newSet = new Set(prev);
      newSet.delete(postId);
      return newSet;
    });

    if (selectedPost?.id === postId) {
      handleCloseModal();
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setShowUserProfile(true);
  };

  const savedPostsData = posts.filter(post => savedPosts.has(post.id));

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.content.toLowerCase().includes(query) ||
      post.user.name.toLowerCase().includes(query) ||
      post.user.username.toLowerCase().includes(query)
    );
  });

  const displayedPosts = filteredPosts.slice(0, displayedPostsCount);
  const hasMorePosts = displayedPostsCount < filteredPosts.length;

  const handleLoadMore = () => {
    setDisplayedPostsCount(prev => prev + POSTS_PER_PAGE);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setDisplayedPostsCount(5);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onSavedClick={() => setShowSavedPanel(!showSavedPanel)}
        savedCount={savedPosts.size}
        onSearch={handleSearch}
        searchQuery={searchQuery}
      />

      <div className="flex flex-1">
        <Sidebar
          onSavedClick={() => setShowSavedPanel(!showSavedPanel)}
          savedCount={savedPosts.size}
        />

        <main className="flex-1 min-h-[calc(100vh-4rem)] p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Create Post */}
            {isLoading ? (
              <CreatePostSkeleton />
            ) : (
              <CreatePost onPost={handleCreatePost} />
            )}

            {/* Filter Bar */}
            <FilterBar
              viewMode={viewMode}
              filterMode={filterMode}
              onViewModeChange={setViewMode}
              onFilterModeChange={setFilterMode}
            />

            {/* Saved Posts Panel */}
            {showSavedPanel && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Posts ({savedPostsData.length})</h3>
                  <button
                    onClick={() => setShowSavedPanel(false)}
                    className="text-sm text-muted-foreground"
                  >
                    Close
                  </button>
                </div>
                {savedPostsData.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No saved posts yet. Click the bookmark icon on any post to save it!</p>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {savedPostsData.map(post => (
                      <div
                        key={post.id}
                        className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => {
                          handleImageClick(post);
                          setShowSavedPanel(false);
                        }}
                      >
                        <img
                          src={post.image}
                          alt={post.content.slice(0, 50)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Posts Feed */}
            {isLoading ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 gap-6'
                  : 'space-y-6'
              }>
                {[1, 2, 3].map((i) => (
                  <PostSkeleton key={i} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-6'
                    : 'space-y-6'
                }
              >
                {displayedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    viewMode={viewMode}
                    onImageClick={handleImageClick}
                    onAddComment={handleAddComment}
                    onSavePost={handleSavePost}
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    savedPosts={savedPosts}
                    isOwner={post.userId === currentUser}
                    onUserClick={handleUserClick}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {hasMorePosts && (
              <div className="flex justify-center pt-6">
                <button 
                  onClick={handleLoadMore}
                  className="px-8 py-3 bg-primary text-white rounded-full font-medium flex items-center gap-2"
                >
                  <span>Load More Posts</span>
                  <span className="text-xs opacity-80">({filteredPosts.length - displayedPostsCount} remaining)</span>
                </button>
              </div>
            )}

            {/* No more posts message */}
            {!hasMorePosts && filteredPosts.length > 0 && (
              <div className="flex justify-center pt-6">
                <p className="text-gray-400 text-sm">You&apos;ve reached the end of the feed!</p>
              </div>
            )}

            {/* No posts found for search */}
            {filteredPosts.length === 0 && searchQuery && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-2">No posts found for &quot;{searchQuery}&quot;</p>
                <button 
                  onClick={() => handleSearch('')}
                  className="text-primary"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Modal */}
      <ImageModal
        post={selectedPost}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onAddComment={handleAddComment}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        user={selectedUser!}
        postsCount={posts.filter(p => p.userId === selectedUser?.id).length}
        followersCount={selectedUser?.followers || 0}
        followingCount={selectedUser?.following || 0}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
