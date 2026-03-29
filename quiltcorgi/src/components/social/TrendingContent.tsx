'use client';

import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

const TRENDING_TOPICS = [
  { tag: '#SpringQuilts', posts: 234 },
  { tag: '#ModernQuilting', posts: 189 },
  { tag: '#Patchwork', posts: 156 },
  { tag: '#QuiltBlockDesign', posts: 142 },
  { tag: '#FabricLove', posts: 98 },
  { tag: '#HandQuilting', posts: 87 },
];

const TRENDING_CREATORS = [
  { name: 'Sarah Stitches', handle: '@sarahstitches', followers: '12.5k' },
  { name: 'Modern Quilter', handle: '@modernquilter', followers: '8.2k' },
  { name: 'Patchwork Pam', handle: '@patchworkpam', followers: '6.7k' },
  { name: 'Quilt Addict', handle: '@quiltaddict', followers: '5.1k' },
];

export function TrendingContent() {
  return (
    <div className="space-y-8">
      {/* Trending Topics */}
      <div className="glass-panel-social rounded-[2rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 text-white shadow-md">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Trending Now</h3>
              <p className="text-sm text-slate-500 font-medium">What the community is talking about</p>
            </div>
          </div>
          <Link 
            href="/socialthreads"
            className="text-sm font-bold text-orange-500 hover:text-orange-600 bg-white/50 px-4 py-2 rounded-full shadow-sm transition-colors"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TRENDING_TOPICS.map((topic, i) => (
            <Link
              key={topic.tag}
              href={`/socialthreads?tag=${encodeURIComponent(topic.tag)}`}
              className="glass-panel-social rounded-[1.5rem] p-5 glass-panel-social-hover cursor-pointer flex gap-5 items-center group"
            >
              <h4 className="text-4xl font-black text-orange-200 w-12 text-center group-hover:text-orange-400 transition-colors">
                #{i + 1}
              </h4>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{topic.tag}</h4>
                <p className="text-sm text-slate-500 font-medium">{topic.posts} posts</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending Creators */}
      <div className="glass-panel-social rounded-[2rem] p-8">
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Trending Creators</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRENDING_CREATORS.map((creator) => (
            <div 
              key={creator.handle}
              className="glass-panel-social rounded-[1.5rem] p-5 glass-panel-social-hover text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-orange-300 to-rose-300 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {creator.name[0]}
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{creator.name}</h4>
              <p className="text-sm text-slate-500 mb-3">{creator.handle}</p>
              <p className="text-xs font-medium text-orange-500 mb-4">{creator.followers} followers</p>
              <button className="w-full bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md transition-all">
                Follow
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Categories */}
      <div className="glass-panel-social rounded-[2rem] p-8">
        <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-6">Popular Categories</h3>
        
        <div className="flex flex-wrap gap-3">
          {['Show & Tell', 'WIP', 'Help', 'Inspiration', 'General', 'Modern', 'Traditional', 'Art Quilts'].map((category) => (
            <Link
              key={category}
              href={`/socialthreads?category=${encodeURIComponent(category.toLowerCase().replace(/ /g, '-'))}`}
              className="bg-white/50 hover:bg-white/80 border border-white/60 hover:border-orange-300 px-5 py-2.5 rounded-full text-sm font-bold text-slate-700 hover:text-orange-600 transition-all"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
