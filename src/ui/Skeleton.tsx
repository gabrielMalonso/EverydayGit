import React from 'react';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-4 rounded-card-inner bg-surface3/70 animate-pulse ${className}`} />
);

export const SkeletonCircle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-avatar bg-surface3/70 animate-pulse ${className}`} />
);

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`rounded-card bg-surface3/60 animate-pulse ${className}`} />
);

export const SectionSkeleton: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div className="rounded-card border border-border1 bg-surface1 p-4">
    <div className="mb-3 flex items-center gap-3">
      <SkeletonCircle className="h-6 w-6" />
      <SkeletonLine className="w-40" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine key={index} className={index === lines - 1 ? 'w-2/3' : ''} />
      ))}
    </div>
  </div>
);
