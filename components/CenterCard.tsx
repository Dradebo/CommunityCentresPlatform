import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, CheckCircle, Users, Sparkles, Building } from 'lucide-react';

interface CenterCardProps {
  center: {
    id: string;
    name: string;
    location: string;
    coordinates: { lat: number; lng: number };
    services: string[];
    resources?: string[];
    description: string;
    verified: boolean;
    connections: string[];
    addedBy: 'admin' | 'visitor';
  };
  onClick: () => void;
}

export const CenterCard: React.FC<CenterCardProps> = ({ center, onClick }) => {
  // Determine gradient based on center status
  const getCardGradient = () => {
    if (center.verified) {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/40 dark:to-emerald-900/40 border-green-200 dark:border-green-700';
    }
    if (center.addedBy === 'admin') {
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-blue-200 dark:border-blue-700';
    }
    return 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 border-gray-200 dark:border-gray-600';
  };

  const getVerifiedBadge = () => {
    if (!center.verified) return null;

    return (
      <div className="absolute -top-2 -right-2 z-10">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-1.5 shadow-lg animate-scale-in">
          <CheckCircle className="h-5 w-5 text-white" />
        </div>
      </div>
    );
  };

  const hasConnections = center.connections && center.connections.length > 0;

  return (
    <Card
      className={`
        cursor-pointer
        transition-all
        duration-300
        hover:shadow-xl
        hover:-translate-y-1
        hover:scale-[1.02]
        active:scale-[0.98]
        touch-manipulation
        relative
        overflow-hidden
        ${getCardGradient()}
        animate-fade-in
        group
      `}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

      {getVerifiedBadge()}

      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold leading-tight text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {center.name}
          </CardTitle>
          {!center.verified && center.addedBy === 'visitor' && (
            <Badge variant="outline" className="shrink-0 text-xs">
              Pending
            </Badge>
          )}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mt-2">
          <MapPin className="h-4 w-4 mr-1.5 shrink-0 text-primary-500" />
          <span className="line-clamp-1">{center.location}</span>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 leading-relaxed">
          {center.description}
        </p>

        {/* Services badges */}
        <div className="flex flex-wrap gap-2">
          {center.services.slice(0, 3).map((service, index) => (
            <Badge
              key={service}
              variant="secondary"
              className="text-xs font-medium bg-white/60 dark:bg-gray-700 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-600 transition-colors"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {service}
            </Badge>
          ))}
          {center.services.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{center.services.length - 3} more
            </Badge>
          )}
          {/* Resource count badge */}
          {center.resources && center.resources.length > 0 && (
            <Badge variant="outline" className="text-xs border-purple-500 text-purple-700 dark:border-purple-400 dark:text-purple-300">
              <Building className="h-3 w-3 mr-1" />
              {center.resources.length} {center.resources.length === 1 ? 'Resource' : 'Resources'}
            </Badge>
          )}
        </div>

        {/* Connection indicator */}
        {hasConnections && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-gray-700 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <Users className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400" />
            <span className="font-medium">
              {center.connections.length} {center.connections.length === 1 ? 'connection' : 'connections'}
            </span>
          </div>
        )}

        {/* Quality indicator for verified centers */}
        {center.verified && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-100/60 dark:bg-green-900/40 backdrop-blur-sm rounded-full px-3 py-1.5 w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Verified Center</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
