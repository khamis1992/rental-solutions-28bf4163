import arabicReshaper from 'arabic-persian-reshaper';
import bidi from 'bidi-js';

// Arabic Unicode ranges
const ARABIC_RANGES = [
  [0x0600, 0x06FF], // Arabic
  [0x0750, 0x077F], // Arabic Supplement
  [0x08A0, 0x08FF], // Arabic Extended-A
  [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
];

/**
 * Detects if text contains Arabic characters
 */
export function hasArabicCharacters(text: string): boolean {
  if (!text) return false;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    for (const [start, end] of ARABIC_RANGES) {
      if (charCode >= start && charCode <= end) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Processes Arabic text for proper RTL rendering in PDFs
 */
export function processArabicText(text: string): string {
  if (!text || !hasArabicCharacters(text)) {
    return text;
  }

  // Clean existing directional marks
  let cleanText = text.replace(/[\u200E\u200F\u202A-\u202E]/g, '');

  // Shape Arabic letters (connect them)
  const shapedText = arabicReshaper.reshape(cleanText);

  // Apply the Unicode Bidirectional Algorithm
  const bidiText = bidi.getEmbeddingLevels(shapedText).result;

  return bidiText;
} 