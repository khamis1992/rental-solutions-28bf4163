
import { format, parseISO, isValid } from 'date-fns';

// Define allowed format types
type DateFormat = 'MMM dd, yyyy' | 'yyyy-MM-dd' | 'MMMM dd, yyyy HH:mm:ss';

/**
 * Format a date string or Date object
 */
export const formatDate = (
  date: string | Date | null | undefined,
  formatString: DateFormat = 'MMM dd, yyyy'
): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format currency value
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency = 'QAR'
): string => {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return `${currency} 0.00`;
  
  return `${currency} ${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{4})(\d{4})/, '$1 $2');
  } else if (cleaned.length === 11 && cleaned.startsWith('974')) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '+$1 $2 $3');
  }
  
  return phone;
};
