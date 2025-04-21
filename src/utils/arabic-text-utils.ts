
import { jsPDF } from 'jspdf';

// Ensure proper Arabic text handling
export function prepareArabicText(text: string): string {
  // Remove any invisible characters and normalize
  return text.normalize('NFKC').trim();
}

// Configure PDF document for Arabic
export function configureArabicPDF(doc: jsPDF): void {
  doc.setFont('Amiri', 'normal');
  doc.setR2L(true);
  doc.setLanguage('ar');
}

// Helper to determine if text contains Arabic
export function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}
