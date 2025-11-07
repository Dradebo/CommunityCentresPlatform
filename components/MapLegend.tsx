import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Info } from 'lucide-react';
import { MAP_PIN_COLORS } from '../utils/mapIcons';

export function MapLegend() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={isExpanded ? 'Collapse legend' : 'Expand legend'}
      >
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Map Legend</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Legend Content */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
          {/* Verified Centers */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L12 30l8.485-9.515C22.657 18.314 24 15.314 24 12c0-6.627-5.373-12-12-12z"
                  fill={MAP_PIN_COLORS.verified}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Verified Centers</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Officially verified community centers</p>
            </div>
          </div>

          {/* Admin Added */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L12 30l8.485-9.515C22.657 18.314 24 15.314 24 12c0-6.627-5.373-12-12-12z"
                  fill={MAP_PIN_COLORS.admin}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Added</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Added by platform administrators</p>
            </div>
          </div>

          {/* Pending Verification */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg width="24" height="30" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L12 30l8.485-9.515C22.657 18.314 24 15.314 24 12c0-6.627-5.373-12-12-12z"
                  fill={MAP_PIN_COLORS.pending}
                  stroke="white"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Pending Verification</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting verification by administrators</p>
            </div>
          </div>

          {/* Selected Pin */}
          <div className="flex items-center space-x-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0">
              <svg width="30" height="38" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L12 30l8.485-9.515C22.657 18.314 24 15.314 24 12c0-6.627-5.373-12-12-12z"
                  fill={MAP_PIN_COLORS.selected}
                  stroke="white"
                  strokeWidth="3"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Selected Center</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Currently viewing this center</p>
            </div>
          </div>

          {/* Interaction Tip */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              <strong>Tip:</strong> Hover over pins for quick info, click for full details
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
