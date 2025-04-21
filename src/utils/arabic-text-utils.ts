
import { jsPDF } from 'jspdf';

// Bidirectional text handling
function getBidiText(text: string): string {
  // Properly handle RTL text
  return text.split('').reverse().join('');
}

// Prepare Arabic text for PDF rendering
export const prepareArabicText = (text: string): string => {
  if (!text) return '';

  // Normalize Arabic text (converts presentation forms)
  text = text.normalize('NFKD');

  // Handle special cases like Arabic numbers and remove diacritics
  text = text
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48))
    .replace(/[\u064B-\u065F]/g, '');

  return text;
};

// Configure PDF document for Arabic support
export function configureArabicPDF(doc: jsPDF): void {
  try {
    // Set default font that supports Arabic
    doc.addFont('assets/fonts/NotoNaskhArabic-Regular.ttf', 'NotoNaskh', 'normal');
    doc.setFont('NotoNaskh');
    
    // Configure right-to-left and language
    doc.setR2L(true);
    doc.setLanguage('ar');
    
    // Set default font size
    doc.setFontSize(12);
  } catch (error) {
    console.error('Error configuring Arabic PDF:', error);
    // Fallback to built-in font
    doc.setFont('Helvetica');
    throw new Error('Failed to configure Arabic PDF settings');
  }
}

// Helper to determine if text contains Arabic
export const containsArabic = (text: string): boolean => {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
};

// Format mixed text (Arabic/English)
export function formatMixedText(text: string): string {
  if (!text) return '';
  
  return text.split(' ').map(word => {
    return containsArabic(word) ? getBidiText(word) : word;
  }).join(' ');
}
