
/**
 * Utilities for handling Arabic text in reports and exports
 */

/**
 * Check if a string contains Arabic characters
 * @param text The string to check
 * @returns True if the string contains Arabic characters
 */
export function containsArabic(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode block ranges
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

/**
 * Add Right-to-Left mark to string if it contains Arabic
 * @param text Text that might contain Arabic
 * @returns Text with RTL mark if needed
 */
export function addRtlMarkIfNeeded(text: string): string {
  if (!text) return '';
  return containsArabic(text) ? `\u200F${text}` : text;
}

/**
 * Fix Arabic text rendering in PDF by adjusting character codes and direction
 * @param text The text to fix for PDF rendering
 * @returns Text prepared for PDF with proper Arabic support
 */
export function prepareArabicForPdf(text: string): string {
  if (!text) return '';
  
  // Handle mixed Arabic-English text
  if (containsArabic(text)) {
    // Add RTL mark at the beginning
    return `\u200F${text}`;
  }
  
  return text;
}

/**
 * Normalize and clean Arabic text for consistent display
 * @param text Arabic text to normalize
 * @returns Normalized text
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  
  // Remove diacritics (optional, depending on requirements)
  // const withoutDiacritics = text.replace(/[\u064B-\u0652]/g, '');
  
  // Normalize different forms of characters (like Alef)
  return text
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/[ة]/g, 'ه');
}

/**
 * Convert string to UTF-8 encoded array buffer
 * @param text Text to encode
 * @returns Array buffer with UTF-8 encoded text
 */
export function textToUtf8Buffer(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * Add UTF-8 BOM to array buffer
 * @param buffer Original buffer
 * @returns New buffer with BOM prefix
 */
export function addUtf8Bom(buffer: Uint8Array): Uint8Array {
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const result = new Uint8Array(bom.length + buffer.length);
  result.set(bom);
  result.set(buffer, bom.length);
  return result;
}
