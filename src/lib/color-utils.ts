
import { Vehicle } from '@/types/vehicle';

// Map of standard color names to their hex values
export const COLOR_MAP: Record<string, string> = {
  red: '#ff0000',
  blue: '#0000ff',
  green: '#00ff00',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  brown: '#a52a2a',
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  silver: '#c0c0c0',
  gold: '#ffd700',
  beige: '#f5f5dc',
  burgundy: '#800020',
  navy: '#000080',
  teal: '#008080',
  cyan: '#00ffff',
  magenta: '#ff00ff',
};

// CSS filter values for common colors
export const FILTER_MAP: Record<string, string> = {
  red: 'hue-rotate(0deg) saturate(1.5)',
  blue: 'hue-rotate(240deg) saturate(1.5)',
  green: 'hue-rotate(120deg) saturate(1.2)',
  yellow: 'hue-rotate(60deg) saturate(1.5)',
  orange: 'hue-rotate(30deg) saturate(1.5)',
  purple: 'hue-rotate(270deg) saturate(1.5)',
  pink: 'hue-rotate(330deg) saturate(1.2)',
  brown: 'hue-rotate(30deg) saturate(0.8) brightness(0.8)',
  black: 'brightness(0.4) saturate(0)',
  white: 'brightness(1.3) saturate(0)',
  gray: 'saturate(0) brightness(0.8)',
  silver: 'saturate(0) brightness(1.1)',
  gold: 'hue-rotate(45deg) saturate(1.2) brightness(1.1)',
  beige: 'hue-rotate(30deg) saturate(0.3) brightness(1.1)',
  burgundy: 'hue-rotate(345deg) saturate(1.3) brightness(0.7)',
  navy: 'hue-rotate(240deg) saturate(1.5) brightness(0.5)',
  teal: 'hue-rotate(180deg) saturate(1.2)',
  cyan: 'hue-rotate(180deg) saturate(1.5)',
  magenta: 'hue-rotate(300deg) saturate(1.5)',
};

/**
 * Convert a color name to its hex value
 */
export function getColorHex(colorName: string | undefined): string | null {
  if (!colorName) return null;
  
  // Clean up the color name (trim, lowercase, remove spaces)
  const normalizedColor = colorName.toLowerCase().trim().replace(/\s+/g, '');
  
  // Check if it's already a hex color
  if (normalizedColor.startsWith('#')) {
    return normalizedColor;
  }
  
  // Check if it's in our map
  return COLOR_MAP[normalizedColor] || null;
}

/**
 * Get CSS filters for a color
 */
export function getColorFilter(colorName: string | undefined): string {
  if (!colorName) return '';
  
  const normalizedColor = colorName.toLowerCase().trim().replace(/\s+/g, '');
  
  return FILTER_MAP[normalizedColor] || '';
}

/**
 * Check if a color is dark (for determining text color)
 */
export function isDarkColor(colorHex: string): boolean {
  // Remove the hash if it exists
  const hex = colorHex.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is dark
  return luminance < 0.5;
}

/**
 * Get the best color adjustment method for a vehicle
 */
export function getColorAdjustmentMethod(vehicle: Vehicle | Partial<Vehicle>): 'filter' | 'overlay' | 'none' {
  if (!vehicle?.color) return 'none';
  
  const normalizedColor = vehicle.color.toLowerCase().trim();
  
  // Some colors work better with filters, others with overlays
  const filterColors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
  const overlayColors = ['black', 'white', 'gray', 'silver', 'beige', 'gold', 'burgundy', 'navy'];
  
  if (filterColors.includes(normalizedColor)) {
    return 'filter';
  } else if (overlayColors.includes(normalizedColor)) {
    return 'overlay';
  }
  
  // Default to filter for other colors
  return 'filter';
}
