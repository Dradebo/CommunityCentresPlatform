/**
 * Google Maps Custom Pin Icons
 * Teardrop-style pins with color coding for different center statuses
 */

export interface MapPinConfig {
  color: string;
  scale: number;
  anchor?: google.maps.Point;
  labelOrigin?: google.maps.Point;
}

// Color constants for different center types
export const MAP_PIN_COLORS = {
  verified: '#10b981',    // Green - verified centers
  admin: '#3b82f6',       // Blue - admin-added centers
  pending: '#94a3b8',     // Gray - pending verification
  selected: '#ef4444',    // Red - selected center
} as const;

// Teardrop pin SVG path (pointing downward)
// This creates a classic map pin shape: rounded top with pointed bottom
const TEARDROP_PATH = 'M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L12 30l8.485-9.515C22.657 18.314 24 15.314 24 12c0-6.627-5.373-12-12-12z';

/**
 * Creates a custom teardrop pin icon for Google Maps
 *
 * @param color - Hex color code for the pin
 * @param scale - Size multiplier (1.0 = 40px height, 1.25 = 50px height)
 * @param selected - Whether this is a selected pin (adds extra styling)
 * @returns Google Maps Symbol configuration
 */
export function createMapPin(
  color: string,
  scale: number = 1.0,
  selected: boolean = false
): google.maps.Symbol {
  return {
    path: TEARDROP_PATH,
    fillColor: color,
    fillOpacity: selected ? 1 : 0.9,
    strokeColor: '#ffffff',
    strokeWeight: selected ? 3 : 2,
    scale: scale,
    anchor: new google.maps.Point(12, 30), // Anchor at the pin point
    labelOrigin: new google.maps.Point(12, 12), // Center of the rounded top
  };
}

/**
 * Get pin color based on center verification status and added by role
 *
 * @param verificationStatus - 'verified', 'pending', or 'rejected'
 * @param addedByRole - User role (ADMIN, CENTER_MANAGER, VISITOR, etc.)
 * @returns Hex color code for the pin
 */
export function getPinColor(
  verificationStatus: string | undefined,
  addedByRole: string | undefined
): string {
  if (verificationStatus === 'verified') {
    return MAP_PIN_COLORS.verified;
  }

  if (addedByRole === 'ADMIN') {
    return MAP_PIN_COLORS.admin;
  }

  return MAP_PIN_COLORS.pending;
}

/**
 * Pin size presets
 */
export const PIN_SIZES = {
  small: 0.8,    // 32px - for clustered views
  normal: 1.0,   // 40px - default size
  hover: 1.25,   // 50px - on hover
  selected: 1.25, // 50px - when selected
} as const;
