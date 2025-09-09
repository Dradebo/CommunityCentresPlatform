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
  AlertTriangle
} from 'lucide-react';

interface CommunityCenterData {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  services: string[];
  description: string;
  verified: boolean;
  connections: string[];
  addedBy: 'admin' | 'visitor';
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

interface FilterCriteria {
  searchQuery: string;
  selectedServices: string[];
  selectedLocations: string[];
  verificationStatus: 'all' | 'verified' | 'unverified';
  connectionStatus: 'all' | 'connected' | 'standalone';
  addedBy: 'all' | 'admin' | 'visitor';
}

interface SearchAndFilterProps {
  centers: CommunityCenterData[];
  onFilterChange: (filteredCenters: CommunityCenterData[], activeFilters: FilterCriteria) => void;
}

const availableServices = [
  'Healthcare',
  'Education', 
  'Skills Training',
  'Youth Programs',
  'Women Empowerment',
  'Childcare',
  'Vocational Training',
  'Computer Training',
  'Library',
  'Microfinance',
  'Food Security',
  'Mental Health',
  'Legal Aid',
  'Sports & Recreation',
  'Community Events'
];

const kampalaLocations = [
  'Central Division',
  'Kawempe Division',
  'Rubaga Division',
  'Makindye Division',
  'Nakawa Division'
];

export function SearchAndFilter({ centers, onFilterChange }: SearchAndFilterProps) {
  const [filters, setFilters] = useState<FilterCriteria>({
    searchQuery: '',
    selectedServices: [],
    selectedLocations: [],
    verificationStatus: 'all',
    connectionStatus: 'all',
    addedBy: 'all'
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const applyFilters = (newFilters: FilterCriteria) => {
    let filteredCenters = centers;

    // Text search
    if (newFilters.searchQuery.trim()) {
      const query = newFilters.searchQuery.toLowerCase();
      filteredCenters = filteredCenters.filter(center => 
        center.name.toLowerCase().includes(query) ||
        center.location.toLowerCase().includes(query) ||
        center.description.toLowerCase().includes(query) ||
        center.services.some(service => service.toLowerCase().includes(query))
      );
    }

    // Service filters
    if (newFilters.selectedServices.length > 0) {
      filteredCenters = filteredCenters.filter(center =>
        newFilters.selectedServices.some(service => center.services.includes(service))
      );
    }

    // Location filters
    if (newFilters.selectedLocations.length > 0) {
      filteredCenters = filteredCenters.filter(center =>
        newFilters.selectedLocations.some(location => center.location.includes(location))
      );
    }

    // Verification status
    if (newFilters.verificationStatus !== 'all') {
      filteredCenters = filteredCenters.filter(center =>
        newFilters.verificationStatus === 'verified' ? center.verified : !center.verified
      );
    }

    // Connection status
    if (newFilters.connectionStatus !== 'all') {
      filteredCenters = filteredCenters.filter(center =>
        newFilters.connectionStatus === 'connected' 
          ? center.connections.length > 0 
          : center.connections.length === 0
      );
    }

    // Added by filter
    if (newFilters.addedBy !== 'all') {
      filteredCenters = filteredCenters.filter(center =>
        center.addedBy === newFilters.addedBy
      );
    }

    onFilterChange(filteredCenters, newFilters);
  };

  const handleFilterChange = (key: keyof FilterCriteria, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleServiceToggle = (service: string) => {
    const newServices = filters.selectedServices.includes(service)
      ? filters.selectedServices.filter(s => s !== service)
      : [...filters.selectedServices, service];
    handleFilterChange('selectedServices', newServices);
  };

  const handleLocationToggle = (location: string) => {
    const newLocations = filters.selectedLocations.includes(location)
      ? filters.selectedLocations.filter(l => l !== location)
      : [...filters.selectedLocations, location];
    handleFilterChange('selectedLocations', newLocations);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterCriteria = {
      searchQuery: '',
      selectedServices: [],
      selectedLocations: [],
      verificationStatus: 'all',
      connectionStatus: 'all',
      addedBy: 'all'
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  const hasActiveFilters = 
    filters.searchQuery.trim() !== '' ||
    filters.selectedServices.length > 0 ||
    filters.selectedLocations.length > 0 ||
    filters.verificationStatus !== 'all' ||
    filters.connectionStatus !== 'all' ||
    filters.addedBy !== 'all';

  const activeFilterCount = [
    filters.searchQuery.trim() !== '',
    filters.selectedServices.length > 0,
    filters.selectedLocations.length > 0,
    filters.verificationStatus !== 'all',
    filters.connectionStatus !== 'all',
    filters.addedBy !== 'all'
  ].filter(Boolean).length;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search & Filter Centers</span>
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
            placeholder="Search by name, location, description, or services..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
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
                {kampalaLocations.map(location => (
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

            {/* Status Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="mb-2 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verification Status</span>
                </h4>
                <Select 
                  value={filters.verificationStatus} 
                  onValueChange={(value) => handleFilterChange('verificationStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Centers</SelectItem>
                    <SelectItem value="verified">Verified Only</SelectItem>
                    <SelectItem value="unverified">Unverified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="mb-2 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Connection Status</span>
                </h4>
                <Select 
                  value={filters.connectionStatus} 
                  onValueChange={(value) => handleFilterChange('connectionStatus', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Centers</SelectItem>
                    <SelectItem value="connected">Connected Centers</SelectItem>
                    <SelectItem value="standalone">Standalone Centers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="mb-2 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Added By</span>
                </h4>
                <Select 
                  value={filters.addedBy} 
                  onValueChange={(value) => handleFilterChange('addedBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="admin">Admin Added</SelectItem>
                    <SelectItem value="visitor">Visitor Added</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}