import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

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
let optionsSet = false;

export const loadGoogleMaps = async (): Promise<typeof google.maps> => {
  if (mapsLoaded) {
    return google.maps;
  }

  // Set API options only once (must be called before importLibrary)
  if (!optionsSet) {
    setOptions({
      key: API_KEY,
      v: 'weekly',
    });
    optionsSet = true;
  }

  // Import required libraries
  await importLibrary('maps');
  await importLibrary('places');

  mapsLoaded = true;
  return google.maps;
};
