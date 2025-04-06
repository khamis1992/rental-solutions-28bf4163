
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { TranslationProvider } from '@/contexts/TranslationContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Custom render function that includes the TranslationProvider
export function renderWithTranslation(
  ui: React.ReactElement,
  language: 'en' | 'ar' = 'en',
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Set language before render
  i18n.changeLanguage(language);
  
  return render(
    <I18nextProvider i18n={i18n}>
      <TranslationProvider>
        {ui}
      </TranslationProvider>
    </I18nextProvider>,
    options
  );
}

// Helper functions for RTL testing
export const rtlTestHelpers = {
  /**
   * Checks if element is properly displayed in RTL mode
   * @param element The element to check
   * @returns boolean indicating if RTL styling is applied correctly
   */
  checkRtlStyling: (element: HTMLElement): boolean => {
    // Check for RTL markers
    const hasRtlClass = element.classList.contains('rtl-direction') || 
                        element.classList.contains('rtl-mode');
    const hasRtlDir = element.dir === 'rtl';
    const isRtlAlignment = window.getComputedStyle(element).textAlign === 'right';
    
    return hasRtlClass || hasRtlDir || isRtlAlignment;
  },
  
  /**
   * Check if text elements are in the correct language
   * @param elements Elements to check
   * @param language Expected language
   * @returns Result object with pass/fail status
   */
  checkLanguageContent: (elements: HTMLElement[], language: 'en' | 'ar'): {
    pass: boolean;
    failedElements: HTMLElement[];
  } => {
    // Simple language detection heuristics
    const arabicPattern = /[\u0600-\u06FF]/; // Arabic Unicode range
    const failedElements: HTMLElement[] = [];
    
    for (const element of elements) {
      const hasArabicText = arabicPattern.test(element.textContent || '');
      
      if ((language === 'ar' && !hasArabicText) || 
          (language === 'en' && hasArabicText)) {
        failedElements.push(element);
      }
    }
    
    return {
      pass: failedElements.length === 0,
      failedElements
    };
  }
};
