
// This file contains utilities for font handling

// Function to fetch and load font files
export async function loadFontFile(fontPath: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Loading font from: ${fontPath}`);
    const response = await fetch(fontPath, {
      cache: 'force-cache' // Use cached version if available to improve performance
    });
    
    if (!response.ok) {
      console.error(`Failed to load font from ${fontPath}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const buffer = await response.arrayBuffer();
    console.log(`Successfully loaded font from ${fontPath}, size: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.error(`Error loading font from ${fontPath}:`, error);
    return null;
  }
}

// Convert ArrayBuffer to Base64 string (for jsPDF)
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
}

// Convert numbers to Arabic numerals
export function toArabicNumerals(str: string): string {
  if (!str) return '';
  
  const arabicNumerals: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩'
  };
  
  return str.replace(/[0-9]/g, match => arabicNumerals[match] || match);
}

// Helper function to check if Arabic fonts are available
export async function checkArabicFontsAvailability(): Promise<{
  available: boolean;
  regularFont: boolean;
  boldFont: boolean;
}> {
  const result = {
    available: false,
    regularFont: false,
    boldFont: false
  };
  
  try {
    const boldFont = await loadFontFile('/fonts/Amiri-Bold.ttf');
    const regularFont = await loadFontFile('/fonts/Amiri-Regular.ttf');
    
    result.boldFont = !!boldFont;
    result.regularFont = !!regularFont;
    result.available = result.boldFont && result.regularFont;
    
    return result;
  } catch (error) {
    console.error("Error checking Arabic fonts availability:", error);
    return result;
  }
}
