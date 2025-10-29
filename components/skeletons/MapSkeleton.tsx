import React from 'react';

export const MapSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* Pulsing shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-800 dark:to-gray-700 animate-shimmer"></div>

      {/* Mock map markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-pulse-slow">
            <div className="h-12 w-12 bg-primary-500/20 dark:bg-primary-400/20 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="h-6 w-6 bg-primary-500/40 dark:bg-primary-400/40 rounded-full"></div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Loading map...
          </p>
        </div>
      </div>

      {/* Decorative map grid lines */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-400 dark:text-gray-600"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    </div>
  );
};
