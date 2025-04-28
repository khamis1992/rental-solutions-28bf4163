
/**
 * Format date string to localized display format
 * @param dateString Date string or null
 * @param format Display format (default: localized date string)
 * @returns Formatted date string or fallback
 */
export function formatDate(dateString: string | null, fallback: string = 'N/A'): string {
  if (!dateString) return fallback;
  
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return fallback;
  }
}

/**
 * Format currency value
 * @param value Numeric value to format
 * @param locale Locale for formatting (default: en-US)
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined, 
  locale: string = 'en-US', 
  currency: string = 'USD'
): string {
  if (value === null || value === undefined) return '$0.00';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(value);
  } catch (e) {
    console.error('Error formatting currency:', e);
    return '$0.00';
  }
}

/**
 * Format percentage value
 * @param value Numeric value to format as percentage
 * @param decimalPlaces Number of decimal places to display
 * @returns Formatted percentage string
 */
export function formatPercent(value: number | null | undefined, decimalPlaces: number = 2): string {
  if (value === null || value === undefined) return '0%';
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    
    return formatter.format(value / 100);
  } catch (e) {
    console.error('Error formatting percentage:', e);
    return '0%';
  }
}
