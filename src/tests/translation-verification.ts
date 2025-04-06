
import enTranslations from '@/i18n/locales/en.json';
import arTranslations from '@/i18n/locales/ar.json';

/**
 * Utility function to verify that all keys in English translations exist in Arabic translations
 * and identify any missing translations
 */
export function verifyTranslationKeys() {
  const missingKeys: string[] = [];
  
  function checkNestedKeys(enObj: any, arObj: any, keyPrefix: string = '') {
    Object.keys(enObj).forEach(key => {
      const currentKey = keyPrefix ? `${keyPrefix}.${key}` : key;
      
      if (typeof enObj[key] === 'object' && enObj[key] !== null) {
        // This is a nested object, recurse into it
        if (typeof arObj[key] !== 'object' || arObj[key] === null) {
          // The Arabic translation doesn't have this nested object
          missingKeys.push(currentKey);
        } else {
          checkNestedKeys(enObj[key], arObj[key], currentKey);
        }
      } else {
        // This is a leaf value (string)
        if (!arObj || !Object.prototype.hasOwnProperty.call(arObj, key)) {
          missingKeys.push(currentKey);
        }
      }
    });
  }
  
  checkNestedKeys(enTranslations, arTranslations);
  
  return {
    complete: missingKeys.length === 0,
    missingKeys,
    totalEnglishKeys: countKeys(enTranslations),
    totalArabicKeys: countKeys(arTranslations),
    coverage: calculateCoverage(enTranslations, arTranslations)
  };
}

/**
 * Helper function to count the total number of leaf keys (actual translations)
 */
function countKeys(obj: any): number {
  let count = 0;
  
  function traverse(currentObj: any) {
    Object.keys(currentObj).forEach(key => {
      if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
        traverse(currentObj[key]);
      } else {
        count++;
      }
    });
  }
  
  traverse(obj);
  return count;
}

/**
 * Calculate the translation coverage percentage
 */
function calculateCoverage(enObj: any, arObj: any): number {
  const totalEnglish = countKeys(enObj);
  const result = verifyTranslationKeys();
  const missing = result.missingKeys.length;
  
  return Math.round(((totalEnglish - missing) / totalEnglish) * 100);
}

// Run verification and log results
const verificationResults = verifyTranslationKeys();
console.log('Translation verification results:', verificationResults);

// Export for use in tests
export const translationVerification = verificationResults;
