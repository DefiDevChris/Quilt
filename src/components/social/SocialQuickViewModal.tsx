'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { X, Heart, Share2, ExternalLink } from 'lucide-react';
import { useSocialQuickView, type QuickViewItem } from '@/stores/socialQuickViewStore';
import { useAuthStore } from '@/stores/authStore';
import { RedditStyleComments } from '@/components/community/comments/RedditStyleComments';

function PostContent({ item }: { item: Extract<QuickViewItem, { type: 'post' }> }) {
 const user = useAuthStore((s) => s.user);
 const [liked, setLiked] = useState(item.isLikedByUser ?? false);
 const [likeCount, setLikeCount] = useState(item.likeCount);
 const [copied, setCopied] = useState(false);

 const handleLike = async () => {
 if (!user) return;
 const next = !liked;
 setLiked(next);
 setLikeCount(next ? likeCount + 1 : likeCount - 1);
 try {
 await fetch(`/api/social/${item.id}/like`, { method: 'POST' });
 } catch {
 setLiked(!next);
 setLikeCount(next ? likeCount - 1 : likeCount + 1);
 }
 };

 const handleShare = async () => {
 try {
 await navigator.clipboard.writeText(`${window.location.origin}/socialthreads/${item.id}`);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {
 /* clipboard unavailable */
 }
 };

 const profileHref = item.creatorUsername ? `/members/${item.creatorUsername}` : '#';

 return (
 <>
 {/* Left: Image */}
 <div className="quick-view-image">
 {item.imageUrl ? (
 <img src={item.imageUrl} alt={item.title} />
 ) : (
 <div className="flex flex-col items-center justify-center text-[#4d4a46] gap-3">
 <ExternalLink size={40} />
 <span className="text-sm">No image</span>
 </div>
 )}
 </div>

 {/* Right: Panel */}
 <div className="quick-view-panel">
 {/* Header */}
 <div className="quick-view-panel-header">
 <Link href={profileHref} className="quick-view-panel-avatar">
 {item.creatorAvatarUrl ? (
 <img src={item.creatorAvatarUrl} alt={item.creatorName} />
 ) : (
 <div className="w-full h-full rounded-full bg-[#f5f2ef] flex items-center justify-center text-sm font-semibold text-[#4d4a46]">
 {item.creatorName.charAt(0).toUpperCase()}
 </div>
 )}
 </Link>
 <div className="quick-view-panel-user">
 <Link href={profileHref} className="quick-view-panel-username">
 {item.creatorName}
 </Link>
 {item.creatorUsername && (
 <p className="quick-view-panel-handle">@{item.creatorUsername}</p>
 )}
 </div>
 <button className="quick-view-panel-close" onClick={() => useSocialQuickView.getState().close()}>
 <X size={20} />
 </button>
 </div>

 {/* Caption */}
 {(item.description || item.title) && (
 <div className="quick-view-panel-caption">
 {item.description || item.title}
 </div>
 )}

 {/* Likes */}
 {likeCount > 0 && (
 <div className="quick-view-panel-likes">{likeCount.toLocaleString()} likes</div>
 )}

 {/* Actions */}
 <div className="quick-view-panel-actions">
 <button
 onClick={handleLike}
 className={`post-card-action-btn ${liked ? 'liked' : ''}`}
 >
 <Heart size={22} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} />
 </button>
 <button onClick={handleShare} className="post-card-action-btn" title={copied ? 'Copied!' : 'Share'}>
 <Share2 size={22} strokeWidth={2} />
 </button>
 <div className="post-card-action-spacer" />
 <Link
 href={`/socialthreads/${item.id}`}
 className="text-sm font-medium text-[#4d4a46] hover:text-[#2d2a26] flex items-center gap-1"
 >
 View post <ExternalLink size={12} />
 </Link>
 </div>

 {/* Comments */}
 <div className="quick-view-panel-content">
 <RedditStyleComments
 postId={item.id}
 currentUserId={user?.id}
 isAdmin={user?.role === 'admin'}
 />
 </div>
 </div>
 </>
 );
}

function BlogContentPane({ item }: { item: Extract<QuickViewItem, { type: 'blog' }> }) {
 return (
 <>
 <div className="quick-view-image">
 {item.imageUrl ? (
 <img src={item.imageUrl} alt={item.title} />
 ) : (
 <div className="w-full h-full bg-[#f5f2ef]" />
 )}
 </div>
 <div className="quick-view-panel">
 <div className="quick-view-panel-header">
 <div className="quick-view-panel-user">
 <p className="quick-view-panel-username">{item.authorName}</p>
 <p className="quick-view-panel-handle">{item.readTimeMinutes} min read</p>
 </div>
 <button className="quick-view-panel-close" onClick={() => useSocialQuickView.getState().close()}>
 <X size={20} />
 </button>
 </div>
 <div className="quick-view-panel-caption">
 <p className="text-xs text-[#4d4a46] mb-1 ">{item.category}</p>
 <h2 className="font-serif text-lg font-semibold text-[#2d2a26] leading-snug">{item.title}</h2>
 {item.excerpt && <p className="text-sm text-[#4d4a46] mt-2 leading-relaxed">{item.excerpt}</p>}
 </div>
 <div className="quick-view-panel-actions">
 <div className="post-card-action-spacer" />
 <Link
 href="/socialthreads"
 className="text-sm font-medium text-[#ff8d49] hover:opacity-80 flex items-center gap-1"
 >
 Read more <ExternalLink size={12} />
 </Link>
 </div>
 </div>
 </>
 );
}

function FabricContentPane({ item }: { item: Extract<QuickViewItem, { type: 'fabric' }> }) {
 return (
 <>
 <div className="quick-view-image">
 <img src={item.imageUrl} alt={item.name} />
 </div>
 <div className="quick-view-panel">
 <div className="quick-view-panel-header">
 <div className="quick-view-panel-user">
 <p className="quick-view-panel-username">{item.name}</p>
 {item.manufacturer && <p className="quick-view-panel-handle">{item.manufacturer}</p>}
 </div>
 <button className="quick-view-panel-close" onClick={() => useSocialQuickView.getState().close()}>
 <X size={20} />
 </button>
 </div>
 <div className="quick-view-panel-actions">
 <div className="post-card-action-spacer" />
 <Link
 href="/dashboard"
 className="text-sm font-medium text-[#ff8d49] hover:opacity-80 flex items-center gap-1"
 >
 View in library <ExternalLink size={12} />
 </Link>
 </div>
 </div>
 </>
 );
}

function PatternContentPane({ item }: { item: Extract<QuickViewItem, { type: 'pattern' }> }) {
 return (
 <>
 <div className="quick-view-image">
 {item.previewUrl ? (
 <img src={item.previewUrl} alt={item.name} />
 ) : (
 <div className="flex items-center justify-center text-[#4d4a46]">
 <ExternalLink size={40} />
 </div>
 )}
 </div>
 <div className="quick-view-panel">
 <div className="quick-view-panel-header">
 <div className="quick-view-panel-user">
 <p className="quick-view-panel-username">{item.name}</p>
 {item.skillLevel && <p className="quick-view-panel-handle">{item.skillLevel}</p>}
 </div>
 <button className="quick-view-panel-close" onClick={() => useSocialQuickView.getState().close()}>
 <X size={20} />
 </button>
 </div>
 <div className="quick-view-panel-actions">
 <div className="post-card-action-spacer" />
 <Link
 href="/dashboard"
 className="text-sm font-medium text-[#ff8d49] hover:opacity-80 flex items-center gap-1"
 >
 Open in Studio <ExternalLink size={12} />
 </Link>
 </div>
 </div>
 </>
 );
}

export function SocialQuickViewModal() {
 const { item, isOpen, close } = useSocialQuickView();
 const [mounted, setMounted] = useState(false);

 // eslint-disable-next-line react-hooks/set-state-in-effect
 useLayoutEffect(() => setMounted(true), []);

 useEffect(() => {
 if (!isOpen) return;
 const handleKey = (e: KeyboardEvent) => {
 if (e.key === 'Escape') close();
 };
 document.addEventListener('keydown', handleKey);
 document.body.style.overflow = 'hidden';
 return () => {
 document.removeEventListener('keydown', handleKey);
 document.body.style.overflow = '';
 };
 }, [isOpen, close]);

 if (!mounted || !isOpen || !item) return null;

 return createPortal(
 <div
 className="quick-view-modal-overlay"
 onClick={(e) => e.target === e.currentTarget && close()}
 >
 <div className="quick-view-modal">
 {item.type === 'post' && <PostContent item={item} />}
 {item.type === 'blog' && <BlogContentPane item={item} />}
 {item.type === 'fabric' && <FabricContentPane item={item} />}
 {item.type === 'pattern' && <PatternContentPane item={item} />}
 </div>
 </div>,
 document.body
 );
}
