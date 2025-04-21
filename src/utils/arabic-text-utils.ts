import { jsPDF } from 'jspdf';
import '@fontsource/amiri';

// Bidirectional text handling
function getBidiText(text: string): string {
  return text.split('').reverse().join('');
}

// Prepare Arabic text for PDF rendering
export const prepareArabicText = (text: string): string => {
  if (!text) return '';

  // Normalize Arabic text (converts presentation forms)
  text = text.normalize('NFKC');

  // Handle special cases like Arabic numbers
  text = text.replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));

  return text;
};

// Configure PDF document for Arabic support
export function configureArabicPDF(doc: jsPDF): void {
  try {
    // Add font
    doc.addFont('Amiri', 'normal');
    doc.setFont('Amiri');
    
    // Configure right-to-left and language
    doc.setR2L(true);
    doc.setLanguage('ar');
    
    // Set default font size
    doc.setFontSize(12);
  } catch (error) {
    console.error('Error configuring Arabic PDF:', error);
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