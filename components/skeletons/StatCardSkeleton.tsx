import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';

export const StatCardSkeleton: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </CardContent>
    </Card>
  );
};

export const StatCardSkeletonRow: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  );
};
