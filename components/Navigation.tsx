import React from 'react';
import { Button } from './ui/button';
import { ThemeToggle } from './ThemeToggle';
import { Map, List, MapPin } from 'lucide-react';

interface NavigationProps {
  currentView: 'map' | 'list';
  onViewChange: (view: 'map' | 'list') => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 min-h-16 py-3 flex flex-col gap-3 sm:h-16 sm:py-0 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-base sm:text-lg leading-tight">Kampala Community Centres</span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 sm:justify-end w-full sm:w-auto">
          <Button
            variant={currentView === 'map' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onViewChange('map')}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => onViewChange('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
