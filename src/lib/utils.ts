
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, language?: 'english' | 'arabic'): string {
  try {
    // Use the appropriate locale based on language
    const locale = language === 'arabic' ? 'ar-QA' : 'en-QA';
    
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'QAR',
      minimumFractionDigits: 2,
    }).format(amount);
    
    // If it's English and the amount ends with .00, remove the decimal part
    if (language !== 'arabic' && formatted.endsWith('.00')) {
      return formatted.substring(0, formatted.length - 3);
    }
    
    return formatted;
  } catch (error) {
    console.error("Error formatting currency:", error);
    // Fallback formatting
    return language === 'arabic' 
      ? `${amount.toFixed(2)} ر.ق` 
      : `QAR ${amount.toFixed(2)}`;
  }
}
