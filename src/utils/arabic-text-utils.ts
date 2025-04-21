
import { jsPDF } from 'jspdf';
import '@fontsource/amiri';

// Bidirectional text handling
function getBidiText(text: string): string {
  return text.split('').reverse().join('');
}

// Prepare Arabic text for PDF rendering
export function prepareArabicText(text: string): string {
  if (!text) return '';
  
  // Remove any invisible characters and normalize
  const normalizedText = text.normalize('NFKC').trim();
  return containsArabic(normalizedText) ? getBidiText(normalizedText) : normalizedText;
}

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
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Format mixed text (Arabic/English)
export function formatMixedText(text: string): string {
  if (!text) return '';
  
  return text.split(' ').map(word => {
    return containsArabic(word) ? getBidiText(word) : word;
  }).join(' ');
}
