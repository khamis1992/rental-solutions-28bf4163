
/**
 * Utilities for managing fonts in PDF reports
 */

// Import font data for Arabic support
import { jsPDF } from 'jspdf';

/**
 * Configure PDF document with the appropriate font for the selected language
 * @param doc jsPDF document instance
 * @param language Language for the document
 */
export const configureFontForLanguage = (doc: jsPDF, language: 'english' | 'arabic' = 'english'): void => {
  if (language === 'arabic') {
    // Use standard fonts available in jsPDF with appropriate fallbacks
    doc.setFont('helvetica');
    doc.setR2L(true); // Set right-to-left mode for Arabic
  } else {
    doc.setFont('helvetica');
    doc.setR2L(false);
  }
};

/**
 * Get appropriate text alignment based on language
 */
export const getTextAlignment = (language: 'english' | 'arabic'): 'left' | 'center' | 'right' => {
  return language === 'arabic' ? 'right' : 'left';
};
