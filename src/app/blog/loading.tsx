import React from 'react';

export default function BlogLoading() {
  return (
    <div className="flex flex-col w-full min-h-screen animate-pulse bg-neutral">
      {/* Hero Skeleton */}
      <div className="w-full h-[60vh] lg:h-[75vh] bg-neutral-100 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl w-full mx-auto px-6 h-full flex flex-col justify-end pb-24 md:pb-32">
            <div className="w-24 h-8 bg-neutral-200 rounded-full mb-6" />
            <div className="w-full max-w-2xl h-16 bg-neutral-200 rounded-full mb-8" />
            <div className="w-full max-w-md h-6 bg-neutral-200 rounded-full mb-8" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200" />
              <div className="space-y-2">
                <div className="w-32 h-4 bg-neutral-200 rounded-full" />
                <div className="w-20 h-3 bg-neutral-200 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Skeleton */}
      <div className="max-w-7xl mx-auto w-full px-6 py-16 md:py-24">
        <div className="flex items-end justify-between mb-12">
          <div className="space-y-4">
            <div className="w-48 h-10 bg-neutral-200 rounded-full" />
            <div className="w-24 h-2 bg-primary/30 rounded-full" />
          </div>
          <div className="w-64 h-4 bg-neutral-200 rounded-full hidden md:block" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 h-[400px] bg-neutral-200 rounded-full" />
          <div className="md:col-span-4 h-[400px] bg-neutral-200 rounded-full" />
          <div className="md:col-span-4 h-[250px] bg-neutral-200 rounded-full" />
          <div className="md:col-span-4 h-[250px] bg-neutral-200 rounded-full" />
          <div className="md:col-span-4 h-[250px] bg-neutral-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}
