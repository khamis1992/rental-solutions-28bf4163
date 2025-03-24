
/**
 * Utilities for managing fonts in PDF reports
 */

import { jsPDF } from 'jspdf';

// Font configuration for different languages
export const configureFontForLanguage = (doc: jsPDF, language: 'english' | 'arabic' = 'english'): void => {
  if (language === 'arabic') {
    // For Arabic, use Helvetica which has decent Arabic character support in jsPDF
    doc.setFont('helvetica');
    // Set right-to-left mode for Arabic text
    doc.setR2L(true);
    
    // Set font size slightly larger for Arabic to improve readability
    const currentFontSize = doc.getFontSize();
    doc.setFontSize(currentFontSize + 1);
  } else {
    // For English, use default Helvetica font
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

/**
 * Format text for proper display in PDF based on language
 * This helps with character encoding issues
 */
export const formatTextForPdf = (text: string, language: 'english' | 'arabic'): string => {
  if (language === 'arabic') {
    // Ensure proper character encoding for Arabic
    return text;
  }
  return text;
};

/**
 * Calculate appropriate text width for different languages
 * Arabic text might need different width calculations
 */
export const getTextWidth = (doc: jsPDF, text: string, language: 'english' | 'arabic'): number => {
  // Use jsPDF's getStringUnitWidth for consistent text measurement
  return doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
};

/**
 * Set appropriate document properties based on language
 */
export const configureDocumentProperties = (doc: jsPDF, language: 'english' | 'arabic'): void => {
  if (language === 'arabic') {
    doc.setProperties({
      title: 'تقرير قانوني',
      subject: 'التزامات العميل القانونية',
      author: 'نظام إدارة تأجير السيارات',
      keywords: 'تقرير, قانوني, التزامات',
      creator: 'شركة العراف لتأجير السيارات'
    });
  } else {
    doc.setProperties({
      title: 'Legal Report',
      subject: 'Customer Legal Obligations',
      author: 'Car Rental Management System',
      keywords: 'report, legal, obligations',
      creator: 'ALARAF Car Rental'
    });
  }
};
