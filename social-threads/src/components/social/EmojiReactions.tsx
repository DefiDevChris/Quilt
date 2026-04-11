'use client';

import { useState } from 'react';
import { Heart, ThumbsUp, Smile, Frown, Angry, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Reaction {
  emoji: string;
  label: string;
  count: number;
  icon: typeof Heart;
}

interface EmojiReactionsProps {
  initialReactions?: {
    heart?: number;
    thumbsUp?: number;
    laugh?: number;
    sad?: number;
    angry?: number;
    surprised?: number;
  };
  onReact?: (reaction: string) => void;
}

export function EmojiReactions({ initialReactions = {}, onReact }: EmojiReactionsProps) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({
    heart: initialReactions.heart || 0,
    thumbsUp: initialReactions.thumbsUp || 0,
    laugh: initialReactions.laugh || 0,
    sad: initialReactions.sad || 0,
    angry: initialReactions.angry || 0,
    surprised: initialReactions.surprised || 0,
  });

  const reactionOptions = [
    { id: 'heart', emoji: '❤️', label: 'Heart', icon: Heart, color: 'text-red-500' },
    { id: 'thumbsUp', emoji: '👍', label: 'Like', icon: ThumbsUp, color: 'text-blue-500' },
    { id: 'laugh', emoji: '😂', label: 'Laugh', icon: Smile, color: 'text-yellow-500' },
    { id: 'surprised', emoji: '😮', label: 'Wow', icon: Zap, color: 'text-orange-500' },
    { id: 'sad', emoji: '😢', label: 'Sad', icon: Frown, color: 'text-purple-500' },
    { id: 'angry', emoji: '😠', label: 'Angry', icon: Angry, color: 'text-red-600' },
  ];

  const handleReaction = (reactionId: string) => {
    if (selectedReaction === reactionId) {
      // Deselect
      setReactions(prev => ({
        ...prev,
        [reactionId]: Math.max(0, prev[reactionId] - 1),
      }));
      setSelectedReaction(null);
    } else {
      // Select new reaction
      if (selectedReaction) {
        // Remove previous reaction
        setReactions(prev => ({
          ...prev,
          [selectedReaction]: Math.max(0, prev[selectedReaction] - 1),
          [reactionId]: prev[reactionId] + 1,
        }));
      } else {
        setReactions(prev => ({
          ...prev,
          [reactionId]: prev[reactionId] + 1,
        }));
      }
      setSelectedReaction(reactionId);
    }
    onReact?.(reactionId);
    setShowPicker(false);
  };

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="relative">
      {/* Reaction Button */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          showPicker ? "bg-[#f9a06b]/20 text-[#f9a06b]" : "hover:bg-[#fdfaf7] text-gray-600"
        )}
      >
        <span className="text-lg">
          {selectedReaction ? reactionOptions.find(r => r.id === selectedReaction)?.emoji : '👍'}
        </span>
        <span>{totalReactions}</span>
      </button>

      {/* Reaction Picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-[#e5d5c5] flex gap-1 animate-fadeIn z-20">
          {reactionOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleReaction(option.id)}
              className={cn(
                "p-2 rounded-xl transition-all duration-200 hover:bg-[#fdfaf7] hover:scale-125",
                selectedReaction === option.id && "bg-[#f9a06b]/20 scale-110"
              )}
              title={option.label}
            >
              <span className="text-2xl">{option.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
