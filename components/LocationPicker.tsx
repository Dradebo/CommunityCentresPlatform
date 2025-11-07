import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, KAMPALA_CENTER, DEFAULT_ZOOM, LatLng } from '../utils/googleMaps';
import { MapPin, Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface LocationPickerProps {
  initialLocation?: LatLng;
  onLocationSelect: (location: LatLng, address?: string) => void;
  className?: string;
}

export function LocationPicker({ initialLocation, onLocationSelect, className = '' }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LatLng>(initialLocation || KAMPALA_CENTER);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  // Initialize Google Map
  useEffect(() => {
    console.log('LocationPicker: Initializing map instance');

    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        const maps = await loadGoogleMaps();

        const map = new maps.Map(mapRef.current, {
          center: initialLocation || KAMPALA_CENTER,
          zoom: initialLocation ? 15 : DEFAULT_ZOOM,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });

        mapInstanceRef.current = map;

        // Create draggable marker
        const marker = new maps.Marker({
          position: initialLocation || KAMPALA_CENTER,
          map,
          draggable: true,
          title: 'Drag to select location',
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });

        markerRef.current = marker;

        // Handle marker drag
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const newLocation = {
              lat: position.lat(),
              lng: position.lng(),
            };
            setSelectedLocation(newLocation);
            reverseGeocode(newLocation);
          }
        });

        // Handle map click
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const newLocation = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng(),
            };
            marker.setPosition(e.latLng);
            setSelectedLocation(newLocation);
            reverseGeocode(newLocation);
          }
        });

        // Initialize Places Autocomplete
        if (searchInputRef.current) {
          const autocomplete = new maps.places.Autocomplete(searchInputRef.current, {
            bounds: new maps.LatLngBounds(
              new maps.LatLng(0.1, 32.2), // SW bounds of Kampala
              new maps.LatLng(0.5, 32.8)  // NE bounds of Kampala
            ),
            componentRestrictions: { country: 'ug' },
            fields: ['geometry', 'formatted_address', 'name'],
          });

          autocompleteRef.current = autocomplete;

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
              const newLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              };
              map.setCenter(newLocation);
              map.setZoom(17);
              marker.setPosition(newLocation);
              setSelectedLocation(newLocation);
              setSelectedAddress(place.formatted_address || place.name || '');
              onLocationSelect(newLocation, place.formatted_address || place.name);
            }
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load Google Maps:', error);
        setLoadError('Failed to load Google Maps. Please check your API key.');
        setIsLoading(false);
      }
    };

    initMap();
  }, []); // Only initialize once, don't reinitialize when initialLocation changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      // Clear autocomplete
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      // Clear map instance reference to force fresh initialization on remount
      if (mapInstanceRef.current) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        mapInstanceRef.current = null;
      }

      // Reset loading state for clean remount
      setIsLoading(true);
    };
  }, []);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (location: LatLng) => {
    try {
      const maps = await loadGoogleMaps();
      const geocoder = new maps.Geocoder();

      geocoder.geocode({ location }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address;
          setSelectedAddress(address);
          onLocationSelect(location, address);
        } else {
          onLocationSelect(location);
        }
      });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect(location);
    }
  };

  const handleConfirmLocation = () => {
    onLocationSelect(selectedLocation, selectedAddress);
  };

  if (loadError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-8 ${className}`}>
        <div className="text-center">
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
    <div className={`h-[550px] flex flex-col ${className}`}>
      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search for a location in Kampala..."
            className="pl-10 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        {selectedAddress && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="inline h-4 w-4 mr-1" />
            {selectedAddress}
          </p>
        )}
      </div>

      {/* Map Container */}
      <div className="relative flex-1 min-h-[400px] rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Click on the map or drag the pin to select your center's location.
          You can also search for an address above.
        </p>
      </div>

      {/* Coordinates Display */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Selected coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
      </div>
    </div>
  );
}
