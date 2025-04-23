/**
 * Language utilities for handling RTL languages like Arabic
 */

// Check if the current language is RTL
export const isRTL = (lang) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lang);
};

// Set document direction based on language
export const setDocumentDirection = (lang) => {
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL(lang) ? 'rtl' : 'ltr';
  document.body.dir = isRTL(lang) ? 'rtl' : 'ltr';
};

// Get direction class based on language
export const getDirectionClass = (lang) => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};
