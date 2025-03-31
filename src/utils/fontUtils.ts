
// This file contains utilities for font handling

// Function to fetch and load font files
export async function loadFontFile(fontPath: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(fontPath);
    if (!response.ok) {
      throw new Error(`Failed to load font from ${fontPath}: ${response.status} ${response.statusText}`);
    }
    return await response.arrayBuffer();
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
