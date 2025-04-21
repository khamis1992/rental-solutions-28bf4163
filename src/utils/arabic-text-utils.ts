import { jsPDF } from 'jspdf';

// Bidirectional text handling
function getBidiText(text: string): string {
  return '\u202B' + text + '\u202C';
}

// Prepare Arabic text for PDF rendering
export const prepareArabicText = (text: string): string => {
  if (!text) return '';
  
  return text
    .normalize('NFKD')
    // Remove tashkeel (diacritics)
    .replace(/[\u0653-\u065F]/g, '')
    // Normalize Arabic presentation forms
    .replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, c => {
      const n = c.charCodeAt(0);
      return String.fromCharCode(n - 0xFB50 + 0x0600);
    });
};

// Configure PDF document for Arabic support
export function configureArabicPDF(doc: jsPDF): void {
  try {
    doc.setFont('times', 'normal');
    doc.setR2L(true);
    doc.setLanguage('ar');
    doc.setFontSize(12);
  } catch (error) {
    console.error('Error configuring Arabic PDF:', error);
    doc.setFont('helvetica', 'normal');
  }
}

// Helper to determine if text contains Arabic
export const containsArabic = (text: string): boolean => {
  if (!text) return false;
  const arabicPattern = /[\u0600-\u06FF]/;
  return arabicPattern.test(text);
};

// Format mixed text (Arabic/English)
export function formatMixedText(text: string): string {
  if (!text) return '';

  // Handle the entire text as one unit for better RTL support
  if (containsArabic(text)) {
    return '\u202B' + prepareArabicText(text) + '\u202C';
  }
  return text;
}