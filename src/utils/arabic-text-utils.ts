
import { jsPDF } from 'jspdf';

// Bidirectional text handling with proper encoding
function getBidiText(text: string): string {
  return '\u202B' + text + '\u202C';
}

// Prepare Arabic text for PDF rendering with proper encoding
export const prepareArabicText = (text: string): string => {
  if (!text) return '';
  
  try {
    // First convert text to UTF-8
    const encoder = new TextEncoder();
    const decoder = new TextDecoder('utf-8');
    const bytes = encoder.encode(text);
    const decodedText = decoder.decode(bytes);

    const normalizedText = decodedText
      .normalize('NFKD')
      // Remove tashkeel (diacritics)
      .replace(/[\u0653-\u065F]/g, '')
      // Normalize Arabic presentation forms
      .replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, c => {
        const n = c.charCodeAt(0);
        return String.fromCharCode(n - 0xFB50 + 0x0600);
      })
      // Add RTL marks for mixed text
      .split(' ')
      .map(word => containsArabic(word) ? `\u202B${word}\u202C` : word)
      .join(' ');
      
    return normalizedText;
  } catch (error) {
    console.error('Error preparing Arabic text:', error);
    return text;
  }
};

// Configure PDF document for Arabic support with enhanced encoding
export async function configureArabicPDF(doc: jsPDF): Promise<void> {
  try {
    // Set font for Arabic support
    doc.setFont('times', 'normal');
    doc.setR2L(true); // Enable right-to-left text direction
    doc.setLanguage('ar');
    doc.setFontSize(12);

    // Override text rendering method to handle Arabic text with proper encoding
    const originalText = doc.text.bind(doc);
    doc.text = function(text: string | string[], x: number, y: number, options?: any): jsPDF {
      if (!text) return doc;
      
      const defaultOptions = { align: 'right', ...options };
      
      // Handle array of strings
      if (Array.isArray(text)) {
        text.forEach((line, i) => {
          if (!line) return;
          try {
            const processed = formatMixedText(prepareArabicText(line.toString()));
            originalText(processed, x, y + (i * (doc.getLineHeight() || 5)), defaultOptions);
          } catch (error) {
            console.error('Error processing text line:', error);
            originalText(line.toString(), x, y + (i * (doc.getLineHeight() || 5)), defaultOptions);
          }
        });
        return doc;
      }

      // Handle single string with proper encoding
      try {
        const processed = formatMixedText(prepareArabicText(text.toString()));
        return originalText(processed, x, y, defaultOptions);
      } catch (error) {
        console.error('Error processing text:', error);
        return originalText(text.toString(), x, y, defaultOptions);
      }
    };
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error configuring Arabic PDF:', error);
    doc.setFont('helvetica', 'normal');
    return Promise.resolve();
  }
}

// Helper to determine if text contains Arabic
export const containsArabic = (text: string): boolean => {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
};

// Format mixed text (Arabic/English) with proper encoding
export function formatMixedText(text: string): string {
  if (!text) return '';

  // Convert text to UTF-8
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8');
  const bytes = encoder.encode(text);
  const decodedText = decoder.decode(bytes);

  // Handle the entire text as one unit for better RTL support
  if (containsArabic(decodedText)) {
    return '\u202B' + prepareArabicText(decodedText) + '\u202C';
  }
  return decodedText;
}
