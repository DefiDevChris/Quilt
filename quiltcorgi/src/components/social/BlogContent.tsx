'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { BlogPostListItem } from '@/types/community';
import { EmptyState } from '@/components/ui/EmptyState';
import Mascot from '@/components/landing/Mascot';

function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface BlogContentProps {
  initialPosts?: BlogPostListItem[];
  initialTotal?: number;
}

export function BlogContent({ initialPosts = [], initialTotal = 0 }: BlogContentProps) {
  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);

  // Fetch more posts if initialPosts is empty
  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blog?page=${page}&limit=9`);
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setPosts(data.posts);
        } else {
          setPosts(prev => [...prev, ...data.posts]);
        }
        setHasMore(data.posts.length === 9 && (page * 9) < data.total);
      }
    } catch (error) {
      console.error('Failed to fetch blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchPosts();
  };

  // Featured post is the first one
  const featuredPost = posts[0];
  const regularPosts = posts.slice(1);

  if (posts.length === 0 && !loading) {
    return (
      <div className="glass-panel rounded-[2rem] p-10">
        <EmptyState
          title="No posts yet"
          description="Check back soon for quilt design tips, tutorials, and updates from the QuiltCorgi team."
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero / Featured Post */}
      {featuredPost && (
        <Link href={`/blog/${featuredPost.slug}`}>
          <article className="glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-200/40 via-rose-100/40 to-orange-200/40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"></div>
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <span className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-4 shadow-sm"
                >
                  {featuredPost.category}
                </span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight"
                >
                  {featuredPost.title}
                </h3>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium line-clamp-3"
                >
                  {featuredPost.excerpt || 'Read the full article to learn more about quilt design and techniques.'}
                </p>
                <div className="flex items-center gap-4">
                  <img 
                    src={featuredPost.authorAvatarUrl || `https://i.pravatar.cc/150?u=${featuredPost.authorName}`} 
                    alt={featuredPost.authorName} 
                    className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" 
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{featuredPost.authorName}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {formatDate(featuredPost.publishedAt)} • {featuredPost.readTimeMinutes} min read
                    </p>
                  </div>
                </div>
              </div>
              {featuredPost.featuredImageUrl && (
                <div className="w-full md:w-1/3 aspect-square rounded-3xl overflow-hidden shadow-lg border-4 border-white/50 relative"
                >
                  <img 
                    src={featuredPost.featuredImageUrl} 
                    alt={featuredPost.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                </div>
              )}
            </div>
          </article>
        </Link>
      )}

      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {regularPosts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
             <article className="glass-panel rounded-[1.5rem] p-5 hover:bg-white/80 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full"
            >
              <div className="relative mb-4 rounded-xl overflow-hidden shadow-sm aspect-[16/10]">
                <img 
                  src={post.featuredImageUrl || '/images/quilts/quilt_01_bed_geometric.png'} 
                  alt={post.title} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 uppercase tracking-wide"
                >
                  {post.category}
                </div>
              </div>
              
              <h4 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{post.title}</h4>
              <p className="text-sm text-slate-600 line-clamp-2 mb-4 flex-1"
              >
                {post.excerpt || 'Read more about this topic...'}
              </p>
              
              <div className="flex justify-between items-center pt-4 border-t border-white/40">
                <div className="flex items-center gap-2">
                  <img 
                    src={post.authorAvatarUrl || `https://i.pravatar.cc/150?u=${post.authorName}`} 
                    alt={post.authorName} 
                    className="w-6 h-6 rounded-full border border-white" 
                  />
                  <span className="text-xs text-slate-500 font-medium">{post.authorName}</span>
                </div>
                <span className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  Read more →
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-[1.5rem] p-5 animate-pulse">
              <div className="aspect-[16/10] bg-white/50 rounded-xl mb-4" />
              <div className="h-5 bg-white/50 rounded-full w-3/4 mb-2" />
              <div className="h-4 bg-white/50 rounded-full w-full mb-1" />
              <div className="h-4 bg-white/50 rounded-full w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            className="glass-panel px-8 py-3 rounded-full font-bold text-slate-700 hover:bg-white/80 transition-all"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
