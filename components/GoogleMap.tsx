import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, KAMPALA_CENTER, DEFAULT_ZOOM } from '../utils/googleMaps';
import { MapPin } from 'lucide-react';

interface CommunityCenterData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  verificationStatus?: 'verified' | 'pending' | 'rejected';
  addedBy?: {
    role: string;
  };
}

interface GoogleMapProps {
  centers: CommunityCenterData[];
  selectedCenter: string | null;
  onCenterSelect: (centerId: string) => void;
  className?: string;
}

export function GoogleMap({ centers, selectedCenter, onCenterSelect, className = '' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const maps = await loadGoogleMaps();

        const map = new maps.Map(mapRef.current, {
          center: KAMPALA_CENTER,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError('Failed to load Google Maps. Please check your API key.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []);

  // Add/update markers when centers change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Remove markers that no longer exist
    const currentCenterIds = new Set(centers.map(c => c.id));
    markersRef.current.forEach((marker, id) => {
      if (!currentCenterIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Add or update markers
    centers.forEach(center => {
      const position = {
        lat: center.latitude,
        lng: center.longitude,
      };

      let marker = markersRef.current.get(center.id);

      if (!marker) {
        // Create new marker
        marker = new google.maps.Marker({
          position,
          map,
          title: center.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: center.verificationStatus === 'verified' ? '#10b981' :
                       center.addedBy?.role === 'ADMIN' ? '#3b82f6' : '#94a3b8',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        // Add click listener
        marker.addListener('click', () => {
          onCenterSelect(center.id);
        });

        markersRef.current.set(center.id, marker);
      } else {
        // Update existing marker position
        marker.setPosition(position);
      }

      // Highlight selected marker
      if (center.id === selectedCenter) {
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#ef4444',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        });
      } else {
        marker.setIcon({
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: center.verificationStatus === 'verified' ? '#10b981' :
                     center.addedBy?.role === 'ADMIN' ? '#3b82f6' : '#94a3b8',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        });
      }
    });

    // Fit bounds to show all markers
    if (centers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      centers.forEach(center => {
        bounds.extend({ lat: center.latitude, lng: center.longitude });
      });
      map.fitBounds(bounds);

      // Don't zoom in too close if there's only one marker
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom !== undefined && zoom > 15) {
          map.setZoom(15);
        }
      });
    }
  }, [centers, selectedCenter, onCenterSelect]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();
    };
  }, []);

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 mb-2">{loadError}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please check your environment configuration
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
