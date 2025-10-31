import { Loader } from '@googlemaps/js-api-loader';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!API_KEY && import.meta.env.MODE !== 'test') {
  console.warn('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
}

export interface LatLng {
  lat: number;
  lng: number;
}

// Kampala city center coordinates
export const KAMPALA_CENTER: LatLng = {
  lat: 0.3476,
  lng: 32.5825,
};

export const DEFAULT_ZOOM = 12;

let mapsLoaded = false;

export const loadGoogleMaps = async (): Promise<typeof google.maps> => {
  if (mapsLoaded) {
    return google.maps;
  }

  const loader = new Loader({
    apiKey: API_KEY,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  // @ts-ignore - Loader type definitions are incorrect for v2
  await loader.load();

  mapsLoaded = true;
  return google.maps;
};
