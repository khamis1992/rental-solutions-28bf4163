
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // If amount is not a number, return empty string or placeholder
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  
  // For very large numbers, use compact notation
  if (amount >= 1000000) {
    // For millions, format with 2 decimal places and M suffix
    const inMillions = amount / 1000000;
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(inMillions) + 'M';
  } 
  // For thousands but less than millions
  else if (amount >= 10000) {
    // Format with no decimal places for thousands
    return new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  // For smaller amounts
  else {
    // Format with up to 2 decimal places for smaller numbers
    const formatted = new Intl.NumberFormat('en-QA', {
      style: 'currency',
      currency: 'QAR',
      maximumFractionDigits: 2,
    }).format(amount);
    
    // If the amount ends with .00, remove the decimal part
    return formatted.endsWith('.00') ? formatted.substring(0, formatted.length - 3) : formatted;
  }
}
