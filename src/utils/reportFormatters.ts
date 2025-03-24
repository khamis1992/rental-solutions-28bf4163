
import { ReportLanguage } from './legalReportUtils';
import { LANGUAGES } from './reportConstants';

/**
 * Format currency amount based on language setting
 */
export const formatCurrency = (amount: number, language: ReportLanguage = LANGUAGES.ENGLISH): string => {
  if (language === LANGUAGES.ARABIC) {
    return new Intl.NumberFormat('ar-QA', {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date based on language setting
 */
export const formatDate = (date: Date | string | undefined, language: ReportLanguage = LANGUAGES.ENGLISH): string => {
  if (!date) {
    return language === LANGUAGES.ARABIC ? 'غير متوفر' : 'N/A';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (language === LANGUAGES.ARABIC) {
    return dateObj.toLocaleDateString('ar-EG');
  }
  
  return dateObj.toLocaleDateString();
};

/**
 * Get translation for common terms
 */
export const getTranslation = (
  key: string, 
  language: ReportLanguage = LANGUAGES.ENGLISH,
  replacements: Record<string, string> = {}
): string => {
  const translations: Record<string, Record<ReportLanguage, string>> = {
    // Customer information
    customerInfo: {
      [LANGUAGES.ENGLISH]: 'Customer Information',
      [LANGUAGES.ARABIC]: 'معلومات العميل'
    },
    // Vehicle information
    vehicleInfo: {
      [LANGUAGES.ENGLISH]: 'Vehicle Information',
      [LANGUAGES.ARABIC]: 'معلومات المركبة'
    },
    // Report headings
    legalReport: {
      [LANGUAGES.ENGLISH]: 'LEGAL OBLIGATIONS REPORT',
      [LANGUAGES.ARABIC]: 'تقرير الالتزامات القانونية'
    },
    // Not available
    notAvailable: {
      [LANGUAGES.ENGLISH]: 'N/A',
      [LANGUAGES.ARABIC]: 'غير متوفر'
    }
  };
  
  let translatedText = translations[key]?.[language] || key;
  
  // Handle replacements
  Object.entries(replacements).forEach(([placeholder, value]) => {
    translatedText = translatedText.replace(`{${placeholder}}`, value);
  });
  
  return translatedText;
};
