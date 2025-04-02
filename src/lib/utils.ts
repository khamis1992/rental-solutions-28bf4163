import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: 'QAR')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | string | null | undefined, currency = 'QAR'): string => {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${currency} 0.00`;
  }
  
  return `${currency} ${numericAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Delays execution for specified milliseconds
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Converts a file to a base64 string
 * @param file The file to convert
 * @returns Promise with the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Truncates text to a specified length
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  return text.length > maxLength
    ? `${text.substring(0, maxLength)}...`
    : text;
};

/**
 * Formats a phone number in Qatari format
 * @param phone The phone number to format
 * @returns Formatted phone number string
 */
export const formatAsQatariPhone = (phone: string | null | undefined): string => {
  if (!phone) return 'N/A';
  
  // Remove all non-numeric characters
  const numericPhone = phone.replace(/\D/g, '');
  
  // Basic formatting for Qatar numbers
  if (numericPhone.length === 8) {
    return `+974 ${numericPhone.substring(0, 4)} ${numericPhone.substring(4)}`;
  } else if (numericPhone.startsWith('974') && numericPhone.length === 11) {
    const digits = numericPhone.substring(3);
    return `+974 ${digits.substring(0, 4)} ${digits.substring(4)}`;
  }
  
  // Return original if not matching known patterns
  return phone;
};
