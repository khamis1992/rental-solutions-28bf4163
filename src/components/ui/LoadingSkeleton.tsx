import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
  width?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  lines = 1,
  height = "h-4",
  width = "w-full"
}) => {
  return (
    <div className={cn("animate-pulse space-y-2", className)} dir="rtl">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-gray-200 rounded",
            height,
            index === lines - 1 && lines > 1 ? "w-3/4" : width
          )}
        />
      ))}
    </div>
  );
};

// Specialized skeletons for different content types
export const AgreementSkeleton = () => (
  <div className="p-4 border rounded-lg space-y-4">
    <div className="flex justify-between items-center">
      <LoadingSkeleton width="w-32" />
      <LoadingSkeleton width="w-20" height="h-6" />
    </div>
    <LoadingSkeleton lines={2} />
    <div className="grid grid-cols-2 gap-4">
      <LoadingSkeleton />
      <LoadingSkeleton />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <LoadingSkeleton key={colIndex} />
        ))}
      </div>
    ))}
  </div>
); 