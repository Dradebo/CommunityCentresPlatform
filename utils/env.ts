// Environment variable utilities
export const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    // Check if we're in a Vite environment and have access to import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export const API_BASE_URL = getEnvVar('VITE_API_URL', 'http://localhost:8080/api');
export const SOCKET_URL = getEnvVar('VITE_API_URL', 'http://localhost:8080').replace('/api', '');