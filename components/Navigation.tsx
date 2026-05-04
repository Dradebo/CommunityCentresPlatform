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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span className="font-semibold text-lg">Kampala Community Centres</span>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={currentView === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewChange('map')}
          >
            <Map className="h-4 w-4 mr-1" />
            Map
          </Button>
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            size="sm"
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
