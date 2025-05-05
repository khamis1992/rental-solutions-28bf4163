
/**
 * Geographic validation utility functions
 */

// Utility function to validate latitude
export const isValidLatitude = (latitude: number): boolean => {
  return latitude >= -90 && latitude <= 90;
};

// Utility function to validate longitude
export const isValidLongitude = (longitude: number): boolean => {
  return longitude >= -180 && longitude <= 180;
};

// Utility function to validate color in hex format
export const isValidHexColor = (color: string): boolean => {
  const regex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  return regex.test(color);
};

// Utility function to validate MAC address
export const isValidMACAddress = (macAddress: string): boolean => {
  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return regex.test(macAddress);
};

// Utility function to validate IP address
export const isValidIPAddress = (ipAddress: string): boolean => {
  const regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
  return regex.test(ipAddress);
};
