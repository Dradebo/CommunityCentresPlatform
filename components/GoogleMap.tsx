import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, KAMPALA_CENTER, DEFAULT_ZOOM } from '../utils/googleMaps';
import { createMapPin, getPinColor, PIN_SIZES, MAP_PIN_COLORS } from '../utils/mapIcons';
import { MapLegend } from './MapLegend';
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

/**
 * Creates HTML content for info window popup
 */
function createInfoWindowContent(center: CommunityCenterData): string {
  const statusBadge = center.verificationStatus === 'verified'
    ? '<span style="display: inline-block; padding: 2px 8px; background-color: #10b981; color: white; border-radius: 4px; font-size: 12px; font-weight: 500;">✓ Verified</span>'
    : center.addedBy?.role === 'ADMIN'
    ? '<span style="display: inline-block; padding: 2px 8px; background-color: #3b82f6; color: white; border-radius: 4px; font-size: 12px; font-weight: 500;">Admin Added</span>'
    : '<span style="display: inline-block; padding: 2px 8px; background-color: #94a3b8; color: white; border-radius: 4px; font-size: 12px; font-weight: 500;">Pending</span>';

  return `
    <div style="padding: 8px; min-width: 200px; max-width: 300px;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
        ${center.name}
      </h3>
      <div style="margin-bottom: 8px;">
        ${statusBadge}
      </div>
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        Click to view full details
      </p>
    </div>
  `;
}

export function GoogleMap({ centers, selectedCenter, onCenterSelect, className = '' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Initialize Google Map
  useEffect(() => {
    console.log('GoogleMap: Initializing map instance');

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
    // Wait for map to finish loading before adding markers
    if (!mapInstanceRef.current || isLoading) return;

    console.log(`GoogleMap: Processing ${centers.length} centers for marker display`);

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
      // Parse coordinates to handle both strings and numbers
      const lat = typeof center.latitude === 'string' ? parseFloat(center.latitude) : center.latitude;
      const lng = typeof center.longitude === 'string' ? parseFloat(center.longitude) : center.longitude;

      // Skip centers with invalid coordinates
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
        console.warn(`Skipping center ${center.id} (${center.name}) with invalid coordinates:`,
          { latitude: center.latitude, longitude: center.longitude, parsedLat: lat, parsedLng: lng });
        return;
      }

      const position = {
        lat,
        lng,
      };

      let marker = markersRef.current.get(center.id);
      const pinColor = getPinColor(center.verificationStatus, center.addedBy?.role);
      const isSelected = center.id === selectedCenter;

      if (!marker) {
        // Create info window on first marker creation (reused for all markers)
        if (!infoWindowRef.current) {
          infoWindowRef.current = new google.maps.InfoWindow();
        }

        // Create new marker with custom teardrop pin
        const icon = isSelected
          ? createMapPin(MAP_PIN_COLORS.selected, PIN_SIZES.selected, true)
          : createMapPin(pinColor, PIN_SIZES.normal, false);

        marker = new google.maps.Marker({
          position,
          map,
          title: center.name,
          icon,
          animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
        });

        // Add click listener
        marker.addListener('click', () => {
          onCenterSelect(center.id);

          // Show info window on click
          if (infoWindowRef.current && mapInstanceRef.current) {
            const content = createInfoWindowContent(center);
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        // Add hover listeners for info window and scale effect
        marker.addListener('mouseover', () => {
          // Scale up pin on hover (unless selected)
          if (!isSelected && marker) {
            marker.setIcon(createMapPin(pinColor, PIN_SIZES.hover, false));
          }

          // Show info window on hover
          if (infoWindowRef.current && mapInstanceRef.current && marker) {
            const content = createInfoWindowContent(center);
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        marker.addListener('mouseout', () => {
          // Scale back down (unless selected)
          if (!isSelected && marker) {
            marker.setIcon(createMapPin(pinColor, PIN_SIZES.normal, false));
          }

          // Close info window on mouse leave (unless selected)
          if (!isSelected && infoWindowRef.current) {
            infoWindowRef.current.close();
          }
        });

        markersRef.current.set(center.id, marker);
      } else {
        // Update existing marker position
        marker.setPosition(position);
      }

      // Update marker appearance based on selection state
      if (isSelected) {
        marker.setIcon(createMapPin(MAP_PIN_COLORS.selected, PIN_SIZES.selected, true));
        marker.setAnimation(google.maps.Animation.BOUNCE);

        // Auto-open info window for selected marker
        if (infoWindowRef.current && mapInstanceRef.current) {
          const content = createInfoWindowContent(center);
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        }

        // Stop bounce animation after 2 cycles (1.4 seconds)
        setTimeout(() => {
          marker?.setAnimation(null);
        }, 1400);
      } else {
        marker.setIcon(createMapPin(pinColor, PIN_SIZES.normal, false));
        marker.setAnimation(null);
      }
    });

    // Fit bounds to show all markers with smart zoom
    if (centers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      centers.forEach(center => {
        // Parse and validate coordinates for bounds calculation
        const lat = typeof center.latitude === 'string' ? parseFloat(center.latitude) : center.latitude;
        const lng = typeof center.longitude === 'string' ? parseFloat(center.longitude) : center.longitude;

        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng });
        }
      });

      // Add padding around markers (50px on all sides)
      const padding = { top: 50, right: 50, bottom: 50, left: 50 };
      map.fitBounds(bounds, padding);

      // Smart zoom constraints based on number of centers
      google.maps.event.addListenerOnce(map, 'idle', () => {
        const zoom = map.getZoom();
        if (zoom !== undefined) {
          if (centers.length === 1) {
            // Single center: set to comfortable detail level
            map.setZoom(14);
          } else {
            // Multiple centers: constrain zoom range to keep pins visible
            if (zoom > 17) {
              map.setZoom(17); // Max zoom to prevent over-zooming
            } else if (zoom < 11) {
              map.setZoom(11); // Min zoom to keep details visible
            }
          }
        }
      });
    }
  }, [centers, selectedCenter, onCenterSelect, isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Close and clear info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
        infoWindowRef.current = null;
      }

      // Clean up markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current.clear();

      // Clear map instance reference to force fresh initialization on remount
      mapInstanceRef.current = null;

      // Reset loading state for clean remount
      setIsLoading(true);
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
      {!isLoading && <MapLegend />}
    </div>
  );
}
