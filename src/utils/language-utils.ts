// Utility functions for language detection and alignment

/**
 * Checks if a string contains mostly Arabic characters.
 * @param text The text to check
 * @returns true if mostly Arabic, false otherwise
 */
export function isArabic(text: string): boolean {
  if (!text) return false;
  // Arabic Unicode block: \u0600-\u06FF, \u0750-\u077F, \u08A0-\u08FF, \uFB50-\uFDFF, \uFE70-\uFEFF
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
  const match = text.match(arabicPattern);
  return match ? (match.length / text.length) > 0.3 : false; // >30% is considered Arabic
}

/**
 * Checks if a string contains mostly English letters.
 * @param text The text to check
 * @returns true if mostly English, false otherwise
 */
export function isEnglish(text: string): boolean {
  if (!text) return false;
  const englishPattern = /[A-Za-z]/g;
  const match = text.match(englishPattern);
  return match ? (match.length / text.length) > 0.3 : false;
}

/**
 * Returns alignment and direction for pdfMake based on text language.
 * @param text The text to check
 * @returns { alignment: 'right' | 'left', rtl: boolean }
 */
export function getTextAlignmentAndDirection(text: string): { alignment: 'right' | 'left', rtl: boolean } {
  if (isArabic(text)) {
    return { alignment: 'right', rtl: true };
  } else {
    return { alignment: 'left', rtl: false };
  }
} 