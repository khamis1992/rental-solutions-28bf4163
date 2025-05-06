import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

/**
 * Combines class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string to a readable format
 * @param date The date to format (can be string, Date object, or null/undefined)
 * @param formatStr The date format string (default: 'dd/MM/yyyy')
 * @returns Formatted date string or 'N/A' if date is invalid
 */
export const formatDate = (date: string | Date | null | undefined, formatStr = 'dd/MM/yyyy'): string => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

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
