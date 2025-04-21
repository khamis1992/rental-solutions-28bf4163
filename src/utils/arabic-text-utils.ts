
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
  
  // Handle mixed Arabic-English text for PDFs
  if (containsArabic(text)) {
    // Add RTL mark at the beginning and zero-width joiner for better character connection
    return `\u200F${text}\u200D`;
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

/**
 * Get base64 encoded Arabic font data to embed in PDFs
 * This uses a small subset of commonly needed Arabic characters
 * @returns Base64 encoded font data that supports Arabic
 */
export function getArabicFontData(): string {
  // This is a placeholder - in a production environment, 
  // you would use a complete Arabic font file converted to base64
  // Instead, we'll return an empty string and handle Arabic
  // through alternative means in the PDF generation
  return '';
}

/**
 * Apply Arabic text settings to jsPDF document
 * @param doc jsPDF document instance
 * @returns The same document with Arabic settings applied
 */
export function applyArabicSettings(doc: any): any {
  // Set text direction for Arabic content
  doc.setR2L(true);
  return doc;
}
