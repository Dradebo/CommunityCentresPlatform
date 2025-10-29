import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';

export const CenterCardSkeleton: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader className="space-y-3">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        {/* Location skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>

        {/* Service badges skeleton */}
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-24"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16"></div>
        </div>
      </CardContent>
    </Card>
  );
};

interface CenterCardSkeletonGridProps {
  count?: number;
}

export const CenterCardSkeletonGrid: React.FC<CenterCardSkeletonGridProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <CenterCardSkeleton key={index} />
      ))}
    </div>
  );
};
