import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { MapPin, Users, Phone, Mail, Globe } from 'lucide-react';

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

interface MapComponentProps {
  centers: CommunityCenterData[];
  onCenterSelect: (centerId: string) => void;
}

export function MapComponent({ centers, onCenterSelect }: MapComponentProps) {
  // Mock map implementation - in a real app you'd use Google Maps, Mapbox, or OpenStreetMap
  const mapBounds = {
    north: 0.4,
    south: 0.25,
    east: 32.65,
    west: 32.5
  };

  const getPositionOnMap = (coordinates: { lat: number; lng: number }) => {
    const latPercent = ((coordinates.lat - mapBounds.south) / (mapBounds.north - mapBounds.south)) * 100;
    const lngPercent = ((coordinates.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * 100;
    
    return {
      top: `${100 - latPercent}%`,
      left: `${lngPercent}%`
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interactive Map - Kampala Community Centers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative bg-green-50 rounded-lg overflow-hidden" style={{ height: '500px' }}>
            {/* Mock map background with Kampala districts */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
              <div className="absolute top-4 left-4 text-sm text-gray-600">
                Kampala, Uganda
              </div>
              
              {/* District labels */}
              <div className="absolute top-1/4 left-1/3 text-xs text-gray-500 bg-white/70 px-2 py-1 rounded">
                Central Division
              </div>
              <div className="absolute top-1/3 left-1/4 text-xs text-gray-500 bg-white/70 px-2 py-1 rounded">
                Kawempe
              </div>
              <div className="absolute bottom-1/3 left-1/3 text-xs text-gray-500 bg-white/70 px-2 py-1 rounded">
                Rubaga
              </div>
              
              {/* Rivers and landmarks */}
              <div className="absolute bottom-1/4 right-1/4 text-xs text-blue-600 bg-white/70 px-2 py-1 rounded">
                Lake Victoria
              </div>
            </div>

            {/* Community center markers */}
            {centers.map(center => {
              const position = getPositionOnMap(center.coordinates);
              return (
                <div
                  key={center.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={position}
                  onClick={() => onCenterSelect(center.id)}
                >
                  <div className="relative group">
                    <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${
                      center.verified ? 'bg-blue-600' : 'bg-orange-500'
                    }`}>
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {center.name}
                      {center.verified && <span className="ml-1">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Map legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 rounded-lg p-3 shadow-lg">
              <div className="text-sm mb-2">Legend:</div>
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-xs">Verified Centers</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs">Unverified Centers</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick stats and recent additions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Additions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {centers.slice(-3).map(center => (
              <div key={center.id} className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{center.name}</div>
                  <div className="text-xs text-gray-500">{center.location}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {center.verified && <Badge variant="default" className="text-xs">Verified</Badge>}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onCenterSelect(center.id)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Network Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {centers.filter(center => center.connections.length > 0).map(center => (
                <div key={center.id} className="flex items-center justify-between">
                  <div className="text-sm">{center.name}</div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{center.connections.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}