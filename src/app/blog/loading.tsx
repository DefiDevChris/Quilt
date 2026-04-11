import React from 'react';

export default function BlogLoading() {
  return (
    <div className="flex flex-col w-full min-h-screen animate-pulse bg-[var(--color-bg)]">
      {/* Hero Skeleton */}
      <div className="w-full h-[60vh] lg:h-[75vh] bg-[var(--color-surface)] relative">
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl w-full mx-auto px-6 h-full flex flex-col justify-end pb-24 md:pb-32">
            <div className="w-24 h-8 bg-[#d4d4d4] rounded-lg mb-6" />
            <div className="w-full max-w-2xl h-16 bg-[#d4d4d4] rounded-lg mb-8" />
            <div className="w-full max-w-md h-6 bg-[#d4d4d4] rounded-lg mb-8" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#d4d4d4]" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-[#d4d4d4] rounded-lg" />
                <div className="w-20 h-3 bg-[#d4d4d4] rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="w-48 h-10 bg-[#d4d4d4] rounded-lg" />
            <div className="w-24 h-2 bg-[#ffc8a6]/30 rounded-lg" />
          </div>
          <div className="w-64 h-4 bg-[#d4d4d4] rounded-lg hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[400px] bg-[#d4d4d4] rounded-lg" />
          <div className="md:col-span-4 h-[400px] bg-[#d4d4d4] rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-[#d4d4d4] rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-[#d4d4d4] rounded-lg" />
          <div className="md:col-span-4 h-[250px] bg-[#d4d4d4] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
