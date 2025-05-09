
/**
 * Utility functions for formatting values for display
 */

// Format a date as a localized string
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format a currency value
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format a number with commas
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-US').format(num);
}

// Format a phone number
export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) return 'N/A';
  
  // Basic formatting for Qatar numbers
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
  }
  
  return phoneNumber;
}
