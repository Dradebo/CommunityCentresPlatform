import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Center {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  services: string[];
  verified?: boolean;
}

interface LeafletMapProps {
  centers: Center[];
  selectedCenter: Center | null;
  onCenterSelect: (center: Center) => void;
  className?: string;
}

export function LeafletMap({ centers, selectedCenter, onCenterSelect, className = '' }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [0.3341, 32.6167], // Kampala center
      zoom: 11,
      zoomControl: true,
    });

    // Add OpenStreetMap tiles (free, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  // Update markers when centers change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    if (centers.length === 0) return;

    const bounds = L.latLngBounds([]);

    centers.forEach(center => {
      const isSelected = selectedCenter?.id === center.id;
      
      // Create custom icon based on verification status
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          background-color: ${center.verified ? '#22c55e' : '#f59e0b'};
          width: ${isSelected ? '32px' : '24px'};
          height: ${isSelected ? '32px' : '24px'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isSelected ? '14px' : '10px'};
        ">${center.verified ? '✓' : '○'}</div>`,
        iconSize: isSelected ? [32, 32] : [24, 24],
        iconAnchor: isSelected ? [16, 16] : [12, 12],
      });

      const marker = L.marker([center.latitude, center.longitude], { icon });

      // Add popup with center info
      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${center.name}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${center.location}</p>
          ${center.verified ? '<span style="background: #22c55e; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">Verified</span>' : ''}
          <p style="margin: 8px 0 0 0; font-size: 12px;">${center.description.substring(0, 100)}${center.description.length > 100 ? '...' : ''}</p>
          <button onclick="window.dispatchEvent(new CustomEvent('center-select', { detail: '${center.id}' }))" 
            style="margin-top: 8px; padding: 4px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
            View Details
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onCenterSelect(center);
      });

      marker.addTo(mapRef.current!);
      markersRef.current[center.id] = marker;

      bounds.extend([center.latitude, center.longitude]);
    });

    // Fit map to show all markers
    if (centers.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [centers, selectedCenter, onCenterSelect]);

  // Handle center selection from popup button
  useEffect(() => {
    const handler = (e: any) => {
      const centerId = e.detail;
      const center = centers.find(c => c.id === centerId);
      if (center) onCenterSelect(center);
    };

    window.addEventListener('center-select', handler);
    return () => window.removeEventListener('center-select', handler);
  }, [centers, onCenterSelect]);

  return (
    <div className="relative">
      <div 
        ref={mapContainerRef} 
        className={`rounded-lg border border-border ${className}`}
        style={{ height: '500px', width: '100%' }}
      />
      <div className="absolute bottom-2 left-2 bg-white dark:bg-gray-800 p-2 rounded shadow text-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
          <span>Verified Centers</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-white"></div>
          <span>Admin Added</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
          <span>Selected Center</span>
        </div>
      </div>
    </div>
  );
}
