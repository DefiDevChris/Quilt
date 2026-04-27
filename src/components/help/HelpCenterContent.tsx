'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchFaq,
  FAQ_CATEGORY_LABELS,
  VIDEO_TUTORIALS,
  type FaqEntry,
  type FaqCategory,
} from '@/lib/help-content';
import { SUPPORT_EMAIL } from '@/lib/constants';

function FaqSection({
  entries,
  selectedCategory,
  onCategoryChange,
}: {
  entries: readonly FaqEntry[];
  selectedCategory: FaqCategory | 'all';
  onCategoryChange: (cat: FaqCategory | 'all') => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const categories: Array<FaqCategory | 'all'> = [
    'all',
    'getting-started',
    'design-tools',
    'export',
    'account',
    'sharing',
    'mobile',
  ];

  const filtered =
    selectedCategory === 'all' ? entries : entries.filter((e) => e.category === selectedCategory);

  return (
    <div>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-full text-[14px] leading-[20px] font-normal transition-colors duration-150 ${
              selectedCategory === cat
                ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                : 'bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:bg-[var(--color-primary)]/10'
            }`}
          >
            {cat === 'all' ? 'All' : FAQ_CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* FAQ items */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-text-dim)] py-4">No matching questions found.</p>
        ) : (
          filtered.map((entry) => {
            const isOpen = openId === entry.id;
            return (
              <div
                key={entry.id}
                className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(entry.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors duration-150 text-left"
                >
                  <span className="font-medium">{entry.title}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {isOpen && (
                  <div className="px-4 pb-3 text-sm text-[var(--color-text-dim)] leading-relaxed">
                    {entry.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function VideoTutorialsSection() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {VIDEO_TUTORIALS.map((video) => (
        <div
          key={video.id}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden hover:border-[var(--color-primary)] transition-colors duration-150"
        >
          {/* Thumbnail placeholder */}
          <div className="aspect-video bg-[var(--color-bg)] flex items-center justify-center">
            <div className="text-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                className="text-[var(--color-text-dim)] mx-auto mb-1"
              >
                <polygon
                  points="5 3 19 12 5 21 5 3"
                  fill="currentColor"
                  opacity="0.3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-xs text-[var(--color-text-dim)]">Coming Soon</p>
            </div>
          </div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-[var(--color-text)] mb-1">{video.title}</h4>
            <p className="text-xs text-[var(--color-text-dim)] line-clamp-2">{video.description}</p>
            <span className="text-xs text-[var(--color-text-dim)] mt-1 inline-block">
              {video.duration}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactSection() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[0_1px_2px_rgba(54,49,45,0.08)] p-8">
      <h3 className="text-[24px] leading-[32px] font-normal text-[var(--color-text)] mb-2">
        Contact Support
      </h3>
      <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)] mb-6">
        Can&apos;t find what you need? Reach out and we&apos;ll help you out.
      </p>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] leading-[20px] font-normal transition-colors duration-150 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-primary)]"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Email Support
      </a>
    </div>
  );
}

export function HelpCenterContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | 'all'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const faqResults = searchFaq(debouncedQuery);

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <h2
          className="text-[40px] leading-[52px] font-normal text-[var(--color-text)] mb-4"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Documentation
        </h2>
        <p className="text-[var(--color-text-dim)] text-[16px] leading-[24px] max-w-sm mx-auto">
          Find answers, learn sthe tools, get support.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-10 max-w-xl mx-auto">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
        >
          <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M13 13L18 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search for assistance..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-2 focus:outline-[var(--color-primary)] text-[16px] leading-[24px]"
        />
      </div>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-[24px] leading-[32px] font-normal text-[var(--color-text)] mb-6">
          Frequently Asked Questions
        </h2>
        <FaqSection
          entries={faqResults}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </section>

      {/* Video Tutorials */}
      <section className="mb-16">
        <h2 className="text-[24px] leading-[32px] font-normal text-[var(--color-text)] mb-6">
          Video Tutorials
        </h2>
        <VideoTutorialsSection />
      </section>

      {/* Contact */}
      <section>
        <ContactSection />
      </section>
    </div>
  );
}
