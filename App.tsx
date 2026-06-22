import React, { useState, useEffect } from 'react';
import { LeafletMap } from './components/LeafletMap';
import { Navigation } from './components/Navigation';
import { SearchAndFilter } from './components/SearchAndFilter';
import { CenterCard } from './components/CenterCard';
import { ThemeProvider } from './contexts/ThemeContext';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { MapPin, Users, Building, CheckCircle, Loader2, Mail, Phone, Globe } from 'lucide-react';
import { apiService } from './services/api';
import { Toaster, toast } from 'sonner';
import { EmptyState } from './components/EmptyState';
import { MapSkeleton } from './components/skeletons/MapSkeleton';
import { CenterCardSkeletonGrid } from './components/skeletons/CenterCardSkeleton';
import { StatCardSkeletonRow } from './components/skeletons/StatCardSkeleton';

interface Center {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  services: string[];
  verified: boolean;
  addedBy: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
}

interface FilterCriteria {
  searchQuery: string;
  selectedServices: string[];
  selectedLocations: string[];
  verificationStatus: 'all' | 'verified' | 'unverified';
}

// Available services for filter
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

// Kampala divisions for filter
const availableLocations = [
  'Central Division',
  'Kawempe Division',
  'Rubaga Division',
  'Makindye Division',
  'Nakawa Division'
];

function AppContent() {
  const [currentView, setCurrentView] = useState<'map' | 'list'>('map');
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null);
  const [filteredCenters, setFilteredCenters] = useState<Center[]>([]);
  const [communityCenters, setCommunityCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCenters();
  }, []);

  const loadCenters = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCenters();
      setCommunityCenters(response.centers);
      setFilteredCenters(response.centers);
    } catch (err: any) {
      toast.error('Loading Failed', {
        description: err.message || 'Failed to load centers',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: FilterCriteria) => {
    const filtered = communityCenters.filter(center => {
      // Text search
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const searchText = `${center.name} ${center.location} ${center.description} ${center.services.join(' ')}`.toLowerCase();
        if (!searchText.includes(query)) return false;
      }
      
      // Service filter
      if (filters.selectedServices.length > 0) {
        if (!filters.selectedServices.some(s => center.services.includes(s))) return false;
      }
      
      // Location filter
      if (filters.selectedLocations.length > 0) {
        if (!filters.selectedLocations.some(l => center.location.includes(l))) return false;
      }
      
      // Verification status
      if (filters.verificationStatus !== 'all') {
        const isVerified = filters.verificationStatus === 'verified';
        if (center.verified !== isVerified) return false;
      }
      
      return true;
    });
    
    setFilteredCenters(filtered);
  };

  const handleContactCenter = (center: Center) => {
    if (center.contactEmail) {
      const subject = `Inquiry about ${center.name}`;
      const body = `Hello,\n\nI am writing to inquire about ${center.name} located in ${center.location}.\n\n`;
      const mailtoLink = `mailto:${center.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
    } else if (center.contactPhone) {
      window.location.href = `tel:${center.contactPhone}`;
    }
  };

  const stats = {
    total: communityCenters.length,
    verified: communityCenters.filter(c => c.verified).length,
    services: [...new Set(communityCenters.flatMap(c => c.services))].length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        <main className="container mx-auto px-4 py-8">
          <StatCardSkeletonRow />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="h-[500px]">
              <MapSkeleton />
            </div>
            <CenterCardSkeletonGrid />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Kampala Community Centres Directory
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find community centres across Kampala. Search by location, services, or verification status. 
            Contact centres directly via email or phone.
          </p>
          <div className="mt-4 inline-flex max-w-3xl items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            Public directory mode: this site now runs from a maintained static centres dataset with direct contact links.
          </div>
        </section>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Centres</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Centres</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Offered</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.services}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <SearchAndFilter 
          onFilterChange={handleFilterChange}
          availableServices={availableServices}
          availableLocations={availableLocations}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Map View */}
          <div className="h-[500px] rounded-lg overflow-hidden border border-border">
            <LeafletMap
              centers={filteredCenters}
              selectedCenter={selectedCenter}
              onCenterSelect={setSelectedCenter}
            />
          </div>

          {/* Centers List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Community Centres</h2>
            {filteredCenters.length === 0 ? (
              <EmptyState
                icon={<Building className="h-12 w-12 text-muted-foreground" />}
                title="No centres found"
                description="Try adjusting your search criteria or filters to find community centres."
                action={
                  <Button variant="outline" onClick={() => loadCenters()}>
                    Clear Filters
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredCenters.map(center => (
                  <Card 
                    key={center.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedCenter?.id === center.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedCenter(center)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{center.name}</h3>
                        {center.verified && (
                          <Badge className="bg-green-500">Verified</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {center.location}
                      </p>
                      <p className="text-sm mb-3 line-clamp-2">{center.description}</p>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {center.services.slice(0, 3).map(service => (
                            <Badge key={service} variant="secondary" className="text-xs">{service}</Badge>
                          ))}
                        {center.services.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{center.services.length - 3}</Badge>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {center.contactEmail && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactCenter(center);
                            }}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                        )}
                        {center.website && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(center.website, '_blank');
                            }}
                          >
                            <Globe className="h-3 w-3 mr-1" />
                            Website
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Center Details */}
        {selectedCenter && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedCenter.name}</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    {selectedCenter.location}
                  </p>
                </div>
                {selectedCenter.verified && <Badge className="bg-green-500">Verified</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{selectedCenter.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-semibold mb-2">Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedCenter.services.map(service => (
                      <Badge key={service} variant="secondary">{service}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedCenter.contactPhone && (
                      <p className="text-sm">
                        <Phone className="inline h-3 w-3 mr-1" />
                        <a href={`tel:${selectedCenter.contactPhone}`} className="text-blue-600 hover:underline">
                          {selectedCenter.contactPhone}
                        </a>
                      </p>
                    )}
                    {selectedCenter.contactEmail && (
                      <p className="text-sm">
                        <Mail className="inline h-3 w-3 mr-1" />
                        <a href={`mailto:${selectedCenter.contactEmail}`} className="text-blue-600 hover:underline">
                          {selectedCenter.contactEmail}
                        </a>
                      </p>
                    )}
                    {selectedCenter.website && (
                      <p className="text-sm">
                        <Globe className="inline h-3 w-3 mr-1" />
                        <a href={selectedCenter.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Visit Website
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <Button onClick={() => handleContactCenter(selectedCenter)}>
                <Mail className="h-4 w-4 mr-2" />
                Contact This Centre
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
