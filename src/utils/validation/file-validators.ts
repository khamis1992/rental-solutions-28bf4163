
/**
 * File validation utility functions
 */

// Utility function to validate file size (in MB)
export const isValidFileSize = (fileSize: number, maxSize: number): boolean => {
  const fileSizeInMB = fileSize / (1024 * 1024);
  return fileSizeInMB <= maxSize;
};

// Utility function to validate file type
export const isValidFileType = (fileType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(fileType);
};

// Utility function to validate image dimensions
export const isValidImageDimensions = (
  width: number, 
  height: number, 
  maxWidth: number, 
  maxHeight: number
): boolean => {
  return width <= maxWidth && height <= maxHeight;
};
