import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  CheckCircle,
} from 'lucide-react';

interface FilterCriteria {
  searchQuery: string;
  selectedServices: string[];
  selectedLocations: string[];
  verificationStatus: 'all' | 'verified' | 'unverified';
}

interface SearchAndFilterProps {
  onFilterChange: (filters: FilterCriteria) => void;
  availableServices: string[];
  availableLocations: string[];
}

const defaultFilters: FilterCriteria = {
  searchQuery: '',
  selectedServices: [],
  selectedLocations: [],
  verificationStatus: 'all',
};

export function SearchAndFilter({ onFilterChange, availableServices, availableLocations }: SearchAndFilterProps) {
  const [filters, setFilters] = useState<FilterCriteria>(defaultFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = (newFilters: FilterCriteria) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value: string) => {
    applyFilters({ ...filters, searchQuery: value });
  };

  const handleServiceToggle = (service: string) => {
    const newServices = filters.selectedServices.includes(service)
      ? filters.selectedServices.filter(s => s !== service)
      : [...filters.selectedServices, service];
    applyFilters({ ...filters, selectedServices: newServices });
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.selectedLocations.includes(location)
      ? filters.selectedLocations.filter(l => l !== location)
      : [...filters.selectedLocations, location];
    applyFilters({ ...filters, selectedLocations: newLocations });
  };

  const handleVerificationChange = (value: string) => {
    applyFilters({ ...filters, verificationStatus: value as FilterCriteria['verificationStatus'] });
  };

  const clearAllFilters = () => {
    applyFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.selectedServices.length > 0 ||
    filters.selectedLocations.length > 0 ||
    filters.verificationStatus !== 'all';

  const activeFilterCount = [
    filters.searchQuery.trim() !== '',
    filters.selectedServices.length > 0,
    filters.selectedLocations.length > 0,
    filters.verificationStatus !== 'all',
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, location, or services..."
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {filters.selectedServices.map(service => (
            <Badge key={service} variant="default" className="cursor-pointer">
              {service}
              <X className="h-3 w-3 ml-1" onClick={() => handleServiceToggle(service)} />
            </Badge>
          ))}
          {filters.selectedLocations.map(location => (
            <Badge key={location} variant="outline" className="cursor-pointer">
              <MapPin className="h-3 w-3 mr-1" />
              {location}
              <X className="h-3 w-3 ml-1" onClick={() => handleLocationToggle(location)} />
            </Badge>
          ))}
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            {/* Services Filter */}
            <div>
              <h4 className="mb-3 flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Services</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableServices.map(service => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={filters.selectedServices.includes(service)}
                      onCheckedChange={() => handleServiceToggle(service)}
                    />
                    <label htmlFor={service} className="text-sm cursor-pointer">
                      {service}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <h4 className="mb-3 flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Divisions</span>
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableLocations.map(location => (
                  <div key={location} className="flex items-center space-x-2">
                    <Checkbox
                      id={location}
                      checked={filters.selectedLocations.includes(location)}
                      onCheckedChange={() => handleLocationToggle(location)}
                    />
                    <label htmlFor={location} className="text-sm cursor-pointer">
                      {location}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Status Filter */}
            <div>
              <h4 className="mb-2 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Verification Status</span>
              </h4>
              <Select 
                value={filters.verificationStatus} 
                onValueChange={handleVerificationChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centres</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
