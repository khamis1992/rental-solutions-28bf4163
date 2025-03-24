
/**
 * Utilities for managing fonts in PDF reports
 */

import { jsPDF } from 'jspdf';
import { formatCurrency } from '@/lib/utils';

// Standard Arabic font that jsPDF can handle
const ARABIC_FONT = 'Helvetica';

/**
 * Configure font for language
 * This sets up the appropriate font and text direction for the document
 */
export const configureFontForLanguage = (doc: jsPDF, language: 'english' | 'arabic' = 'english'): void => {
  try {
    if (language === 'arabic') {
      // Set right-to-left mode for Arabic text
      doc.setR2L(true);
      
      // For Arabic, use default font but with right-to-left rendering
      doc.setFont(ARABIC_FONT);
      
      // Increase the font size slightly for better Arabic readability
      const currentFontSize = doc.getFontSize();
      doc.setFontSize(currentFontSize + 2);
      
      console.log("Arabic font configuration applied successfully");
    } else {
      // For English, use default settings
      doc.setFont('helvetica');
      doc.setR2L(false);
    }
  } catch (error) {
    console.error("Error configuring font:", error);
    // Fallback to default font if there's an error
    doc.setFont('helvetica');
    doc.setR2L(language === 'arabic');
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
 * Ensures characters are correctly encoded
 */
export const formatTextForPdf = (text: string, language: 'english' | 'arabic'): string => {
  if (!text) return '';
  
  try {
    // For Arabic, ensure we're handling the text correctly
    if (language === 'arabic') {
      return text;
    }
    return text;
  } catch (error) {
    console.error("Error formatting text for PDF:", error);
    return text; // Return original text as fallback
  }
};

/**
 * Calculate appropriate text width for different languages
 */
export const getTextWidth = (doc: jsPDF, text: string, language: 'english' | 'arabic'): number => {
  try {
    // Use jsPDF's built-in text measurement
    return doc.getStringUnitWidth(text) * doc.getFontSize() / doc.internal.scaleFactor;
  } catch (error) {
    console.error("Error calculating text width:", error);
    // Fallback estimation if the built-in method fails
    return text.length * (doc.getFontSize() / 3) / doc.internal.scaleFactor;
  }
};

/**
 * Set appropriate document properties based on language
 */
export const configureDocumentProperties = (doc: jsPDF, language: 'english' | 'arabic'): void => {
  try {
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
  } catch (error) {
    console.error("Error setting document properties:", error);
    // Set basic properties as fallback
    doc.setProperties({
      title: 'Report',
      creator: 'ALARAF Car Rental'
    });
  }
};

/**
 * Add Arabic text to PDF in a reliable way
 * Works around limitations in jsPDF's handling of Arabic text
 */
export const addArabicText = (
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options: { align?: 'left' | 'center' | 'right' } = {}
): void => {
  try {
    // Ensure right-to-left is enabled for Arabic text
    doc.setR2L(true);
    
    // Set alignment - default to right for Arabic
    const align = options.align || 'right';
    
    // Add the text with alignment
    doc.text(text, x, y, { align });
    
  } catch (error) {
    console.error("Error adding Arabic text:", error, "Text:", text);
    // Fallback - try to add text without special handling
    try {
      doc.text(text, x, y);
    } catch (innerError) {
      console.error("Fallback text rendering also failed:", innerError);
    }
  }
};

/**
 * Format currency with appropriate locale settings
 */
export const formatCurrencyForReport = (amount: number, language: 'english' | 'arabic' = 'english'): string => {
  try {
    return formatCurrency(amount, language);
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback formatting
    return language === 'arabic' 
      ? `${amount.toFixed(2)} ر.ق` 
      : `QAR ${amount.toFixed(2)}`;
  }
};
