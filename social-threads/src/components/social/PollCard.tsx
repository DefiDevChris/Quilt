'use client';

import { useState } from 'react';
import { BarChart3, Check, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollCardProps {
  pollId: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endTime?: string;
  onVote?: (pollId: string, optionId: string) => void;
}

export function PollCard({ pollId, question, options: initialOptions, totalVotes: initialTotalVotes, endTime, onVote }: PollCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [options, setOptions] = useState(initialOptions);
  const [totalVotes, setTotalVotes] = useState(initialTotalVotes);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    setSelectedOption(optionId);
    setHasVoted(true);
    setTotalVotes(prev => prev + 1);
    setOptions(prev =>
      prev.map(opt =>
        opt.id === optionId
          ? { ...opt, votes: opt.votes + 1 }
          : opt
      )
    );
    onVote?.(pollId, optionId);
    toast({
      title: 'Vote submitted!',
      description: 'Thanks for participating in the poll.',
    });
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const timeRemaining = endTime ? getTimeRemaining(endTime) : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-secondary">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <h3 className="font-semibold text-foreground">Poll</h3>
        {timeRemaining && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
            {timeRemaining}
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-foreground font-medium mb-4 text-lg">{question}</p>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const percentage = getPercentage(option.votes);
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              className={cn(
                "w-full relative overflow-hidden rounded-xl border-2 transition-all duration-300 group",
                hasVoted
                  ? "cursor-default"
                  : "cursor-pointer hover:border-primary hover:shadow-md",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Progress Bar */}
              {hasVoted && (
                <div
                  className={cn(
                    "absolute inset-0 transition-all duration-500",
                    isSelected ? "bg-primary/10" : "bg-muted/50"
                  )}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {isSelected && (
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary animate-scale-in">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className={cn(
                    "font-medium text-left",
                    hasVoted ? "text-foreground" : "group-hover:text-primary transition-colors"
                  )}>
                    {option.text}
                  </span>
                </div>

                {hasVoted && (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <span className="font-bold text-primary">{percentage}%</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
        </div>
        {hasVoted && (
          <span className="text-xs text-primary font-medium animate-fadeIn">
            ✓ Your vote has been recorded
          </span>
        )}
      </div>
    </div>
  );
}

function getTimeRemaining(endTime: string): string {
  const end = new Date(endTime);
  const now = new Date();
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Ending soon';
}
