
/**
 * Format a number as currency (QAR)
 * @param value - The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return 'QAR 0.00';
  }
  
  return `QAR ${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format a number with commas for thousands
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '0';
  }
  
  return value.toLocaleString('en-US');
};
